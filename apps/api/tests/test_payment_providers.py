import json
import time
from datetime import datetime, timezone
import pytest
from standardwebhooks.webhooks import Webhook
from apps.api.app.integrations.payments import (
    get_payment_provider,
    DodoPaymentsProvider,
    StripeProvider,
)
from apps.api.app.integrations.payments.base import BasePaymentProvider
from apps.api.app.models.models import Subscription, PaymentProviderEvent, Business
from apps.api.app.core.database import SessionLocal, Base, engine


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_payment_provider_factory():
    # Test default factory produces DodoPaymentsProvider
    provider = get_payment_provider("dodo")
    assert isinstance(provider, BasePaymentProvider)
    assert isinstance(provider, DodoPaymentsProvider)
    assert provider.provider_name == "dodo"

    # Test factory produces StripeProvider when requested
    stripe_provider = get_payment_provider("stripe")
    assert isinstance(stripe_provider, BasePaymentProvider)
    assert isinstance(stripe_provider, StripeProvider)
    assert stripe_provider.provider_name == "stripe"


def test_dodo_status_normalization():
    dodo = DodoPaymentsProvider()
    assert dodo.normalize_status("active") == "active"
    assert dodo.normalize_status("renewed") == "active"
    assert dodo.normalize_status("pending") == "trialing"
    assert dodo.normalize_status("created") == "trialing"
    assert dodo.normalize_status("on_hold") == "past_due"
    assert dodo.normalize_status("failed") == "past_due"
    assert dodo.normalize_status("cancelled") == "cancelled"
    assert dodo.normalize_status("canceled") == "cancelled"
    assert dodo.normalize_status("expired") == "expired"
    assert dodo.normalize_status("paused") == "paused"


def test_stripe_status_normalization():
    stripe_p = StripeProvider()
    assert stripe_p.normalize_status("trialing") == "trialing"
    assert stripe_p.normalize_status("active") == "active"
    assert stripe_p.normalize_status("past_due") == "past_due"
    assert stripe_p.normalize_status("unpaid") == "past_due"
    assert stripe_p.normalize_status("canceled") == "cancelled"
    assert stripe_p.normalize_status("incomplete_expired") == "expired"
    assert stripe_p.normalize_status("paused") == "paused"


def test_dodo_checkout_creation():
    dodo = DodoPaymentsProvider()
    session = dodo.create_subscription_checkout(
        business_id="biz_test_123",
        plan_tier="growth",
        success_url="http://localhost:3000/dashboard/billing",
        cancel_url="http://localhost:3000/dashboard/billing",
        customer_email="owner@contractor.com",
        customer_name="Contractor Owner",
        currency="USD",
    )

    assert session.provider == "dodo"
    assert session.plan_tier == "growth"
    assert session.amount == 199.0
    assert session.currency == "USD"
    assert session.id is not None
    assert session.checkout_url is not None


def test_dodo_webhook_signature_and_parsing():
    # Base64 standard webhook secret
    secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2gAqrut"
    dodo = DodoPaymentsProvider(webhook_key=secret)

    payload_dict = {
        "event_type": "subscription.active",
        "webhook_id": "wh_evt_dodo_test_001",
        "data": {
            "subscription_id": "sub_dodo_live_999",
            "customer_id": "cus_dodo_888",
            "status": "active",
            "currency": "USD",
            "amount": 19900,
            "metadata": {
                "business_id": "biz_demo_hvac_001",
                "plan_tier": "growth",
            },
        },
    }

    raw_body = json.dumps(payload_dict).encode("utf-8")
    msg_id = "msg_dodo_test_001"
    now = datetime.now(timezone.utc)
    timestamp = str(int(now.timestamp()))

    wh = Webhook(secret)
    sig = wh.sign(msg_id, now, raw_body.decode("utf-8"))

    headers = {
        "webhook-id": msg_id,
        "webhook-signature": sig,
        "webhook-timestamp": timestamp,
    }

    # Verify signature check passes
    assert dodo.verify_webhook_signature(raw_body, headers) is True

    # Verify invalid signature fails
    invalid_headers = {
        "webhook-id": msg_id,
        "webhook-signature": "v1,invalid_signature_string",
        "webhook-timestamp": timestamp,
    }
    assert dodo.verify_webhook_signature(raw_body, invalid_headers) is False

    # Parse event
    parsed = dodo.parse_webhook_event(raw_body, headers)
    assert parsed["provider"] == "dodo"
    assert parsed["business_id"] == "biz_demo_hvac_001"
    assert parsed["plan_tier"] == "growth"
    assert parsed["normalized_status"] == "active"
    assert parsed["amount"] == 199.0
    assert parsed["currency"] == "USD"


def test_dodo_plan_change_and_cancellation():
    dodo = DodoPaymentsProvider()
    cancel_res = dodo.cancel_subscription("sub_dodo_sim_test_001", cancel_at_cycle_end=True)
    assert cancel_res["status"] == "cancelled"

    change_res = dodo.change_subscription_plan("sub_dodo_sim_test_001", "growth")
    assert change_res["status"] in ["updated", "success"]


def test_dodo_customer_portal():
    dodo = DodoPaymentsProvider()
    portal = dodo.create_portal_session("cus_sim_123", "http://localhost:3000/dashboard/billing")
    assert portal["provider"] == "dodo"
    assert "url" in portal


def test_dodo_entitlement_enforcement(db_session):
    # Setup test business and subscription
    biz = Business(name="Entitlement Test HVAC", industry="HVAC")
    db_session.add(biz)
    db_session.flush()

    sub = Subscription(
        business_id=biz.id,
        provider="dodo",
        plan_tier="growth",
        status="active",
        messages_count=100,
        messages_limit=2500,
        appointments_count=5,
        appointments_limit=250,
    )
    db_session.add(sub)
    db_session.commit()

    # Active growth limits
    assert sub.status == "active"
    assert sub.messages_limit == 2500
    assert sub.appointments_limit == 250

    # Simulate cancellation event
    sub.status = "cancelled"
    sub.messages_limit = 50
    sub.appointments_limit = 5
    db_session.commit()

    reloaded = db_session.query(Subscription).filter(Subscription.business_id == biz.id).first()
    assert reloaded.status == "cancelled"
    assert reloaded.messages_limit == 50
