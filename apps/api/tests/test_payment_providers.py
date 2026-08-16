import hmac
import hashlib
import json
import pytest
from apps.api.app.integrations.payments import (
    get_payment_provider,
    RazorpayProvider,
    StripeProvider,
)
from apps.api.app.integrations.payments.base import BasePaymentProvider


def test_payment_provider_factory():
    # Test default factory produces RazorpayProvider
    provider = get_payment_provider("razorpay")
    assert isinstance(provider, BasePaymentProvider)
    assert isinstance(provider, RazorpayProvider)
    assert provider.provider_name == "razorpay"

    # Test factory produces StripeProvider when requested
    stripe_provider = get_payment_provider("stripe")
    assert isinstance(stripe_provider, BasePaymentProvider)
    assert isinstance(stripe_provider, StripeProvider)
    assert stripe_provider.provider_name == "stripe"


def test_razorpay_status_normalization():
    rzp = RazorpayProvider()
    assert rzp.normalize_status("created") == "trialing"
    assert rzp.normalize_status("active") == "active"
    assert rzp.normalize_status("authenticated") == "active"
    assert rzp.normalize_status("halted") == "past_due"
    assert rzp.normalize_status("pending") == "past_due"
    assert rzp.normalize_status("cancelled") == "cancelled"
    assert rzp.normalize_status("expired") == "expired"
    assert rzp.normalize_status("completed") == "expired"
    assert rzp.normalize_status("paused") == "paused"


def test_stripe_status_normalization():
    stripe_p = StripeProvider()
    assert stripe_p.normalize_status("trialing") == "trialing"
    assert stripe_p.normalize_status("active") == "active"
    assert stripe_p.normalize_status("past_due") == "past_due"
    assert stripe_p.normalize_status("unpaid") == "past_due"
    assert stripe_p.normalize_status("canceled") == "cancelled"
    assert stripe_p.normalize_status("incomplete_expired") == "expired"
    assert stripe_p.normalize_status("paused") == "paused"


def test_razorpay_checkout_creation():
    rzp = RazorpayProvider()
    session = rzp.create_subscription_checkout(
        business_id="biz_test_123",
        plan_tier="growth",
        success_url="http://localhost:3000/dashboard/billing",
        cancel_url="http://localhost:3000/dashboard/billing",
        customer_email="owner@test.com",
        customer_name="Test Owner",
        currency="USD",
    )

    assert session.provider == "razorpay"
    assert session.plan_tier == "growth"
    assert session.amount == 199.0
    assert session.currency == "USD"
    assert session.id is not None
    assert session.checkout_url is not None


def test_razorpay_webhook_signature_and_parsing():
    secret = "test_rzp_webhook_secret_key_123"
    rzp = RazorpayProvider(webhook_secret=secret)

    payload_dict = {
        "entity": "event",
        "event": "subscription.authenticated",
        "created_at": 1740000000,
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_test_999",
                    "status": "authenticated",
                    "currency": "USD",
                    "notes": {
                        "business_id": "biz_demo_hvac_001",
                        "plan_tier": "growth",
                    },
                }
            },
            "payment": {
                "entity": {
                    "id": "pay_test_001",
                    "amount": 19900,
                    "currency": "USD",
                    "subscription_id": "sub_rzp_test_999",
                }
            },
        },
    }

    raw_body = json.dumps(payload_dict).encode("utf-8")
    valid_signature = hmac.new(
        secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    # Verify signature check passes
    assert rzp.verify_webhook_signature(raw_body, valid_signature) is True
    # Invalid signature check fails
    assert rzp.verify_webhook_signature(raw_body, "invalid_sig_hex") is False

    # Parse event
    parsed = rzp.parse_webhook_event(raw_body, valid_signature)
    assert parsed["provider"] == "razorpay"
    assert parsed["business_id"] == "biz_demo_hvac_001"
    assert parsed["plan_tier"] == "growth"
    assert parsed["normalized_status"] == "active"
    assert parsed["amount"] == 199.0
    assert parsed["currency"] == "USD"
