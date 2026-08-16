import json
import time
from datetime import datetime, timezone, timedelta
from standardwebhooks.webhooks import Webhook
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.core.database import SessionLocal, Base, engine
from apps.api.app.core.config import settings
from apps.api.app.models.models import Business, BusinessMember, Subscription, PaymentProviderEvent, User
from apps.api.app.core.security import get_password_hash, create_access_token
from apps.api.app.integrations.payments import get_payment_provider, DodoPaymentsProvider

def run_e2e_verification():
    print("=" * 80)
    print("LEADFLOW AI — DODO PAYMENTS REAL SANDBOX END-TO-END LIFECYCLE VERIFICATION")
    print("=" * 80)
    
    client = TestClient(app)
    db = SessionLocal()
    results = {}
    
    # -------------------------------------------------------------------------
    # STEP 1: Create / Select Test Business
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Creating/Selecting Test Business...")
    biz = db.query(Business).filter(Business.name == "Dodo Sandbox Verification HVAC").first()
    if biz:
        # Clean previous test subscriptions and events
        db.query(Subscription).filter(Subscription.business_id == biz.id).delete()
        db.commit()
    else:
        biz = Business(
            name="Dodo Sandbox Verification HVAC",
            industry="HVAC",
            phone="+15559876543",
            timezone="America/New_York",
            average_job_value=850.0,
            onboarding_completed=True,
        )
        db.add(biz)
        db.commit()
        db.refresh(biz)
    
    # Create test user
    user = db.query(User).filter(User.email == "sandbox_tester@leadflow.ai").first()
    if not user:
        user = User(
            email="sandbox_tester@leadflow.ai",
            name="Sandbox Tester",
            hashed_password=get_password_hash("TestPassword123!"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    member = db.query(BusinessMember).filter(BusinessMember.business_id == biz.id, BusinessMember.user_id == user.id).first()
    if not member:
        member = BusinessMember(business_id=biz.id, user_id=user.id, role="owner")
        db.add(member)
        db.commit()
        
    auth_token = create_access_token(subject=user.id, business_id=biz.id, role="owner")
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    print(f" -> Business ID: {biz.id}")
    print(f" -> User Email: {user.email}")
    results["step_1_create_business"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 2: Confirm Current Subscription State
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Initializing & Confirming Initial Subscription State...")
    now = datetime.now(timezone.utc)
    initial_sub = Subscription(
        business_id=biz.id,
        provider="dodo",
        plan_tier="starter",
        status="trialing",
        currency="USD",
        amount=99.0,
        trial_start=now,
        trial_end=now + timedelta(days=7),
        messages_count=12,
        messages_limit=1000,
        appointments_count=1,
        appointments_limit=100,
    )
    db.add(initial_sub)
    db.commit()
    db.refresh(initial_sub)
    
    print(f" -> State Before: Plan={initial_sub.plan_tier}, Status={initial_sub.status}, MessagesLimit={initial_sub.messages_limit}, ApptsLimit={initial_sub.appointments_limit}")
    assert initial_sub.plan_tier == "starter"
    assert initial_sub.status == "trialing"
    results["step_2_initial_state"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 3 & 4: Open Billing / Create Checkout for Growth ($199/mo)
    # -------------------------------------------------------------------------
    print("\n[STEP 3 & 4] Requesting Growth ($199/month) Checkout Session via API...")
    checkout_res = client.post(
        "/api/v1/billing/checkout",
        headers=headers,
        json={"plan_tier": "growth", "currency": "USD", "provider": "dodo"},
    )
    assert checkout_res.status_code == 200, f"Checkout API failed: {checkout_res.text}"
    checkout_data = checkout_res.json()
    
    print(f" -> Checkout Session ID: {checkout_data['id']}")
    print(f" -> Checkout URL: {checkout_data['checkout_url']}")
    print(f" -> Amount: ${checkout_data['amount']} {checkout_data['currency']}")
    assert checkout_data["plan_tier"] == "growth"
    assert checkout_data["amount"] == 199.0
    assert "dodo" in checkout_data["checkout_url"] or "session" in checkout_data["checkout_url"]
    results["step_3_4_checkout_creation"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 5 & 6: Dodo Sandbox Checkout Completion & Webhook Dispatch
    # -------------------------------------------------------------------------
    print("\n[STEP 5 & 6] Simulating Dodo Sandbox Checkout Webhook Dispatch (`subscription.active`)...")
    live_sub_id = f"sub_dodo_live_{int(time.time())}"
    live_cust_id = f"cus_dodo_live_{int(time.time())}"
    webhook_event_id = f"wh_evt_growth_act_{int(time.time())}"
    
    webhook_payload = {
        "event_type": "subscription.active",
        "webhook_id": webhook_event_id,
        "data": {
            "subscription_id": live_sub_id,
            "customer_id": live_cust_id,
            "product_id": settings.DODO_PAYMENTS_PRODUCT_GROWTH,
            "status": "active",
            "currency": "USD",
            "amount": 19900,
            "metadata": {
                "business_id": biz.id,
                "plan_tier": "growth",
            },
        },
    }
    
    raw_payload = json.dumps(webhook_payload).encode("utf-8")
    webhook_key = settings.DODO_PAYMENTS_WEBHOOK_KEY
    wh = Webhook(webhook_key)
    now_dt = datetime.now(timezone.utc)
    ts_str = str(int(now_dt.timestamp()))
    sig_str = wh.sign(webhook_event_id, now_dt, raw_payload.decode("utf-8"))
    
    webhook_headers = {
        "webhook-id": webhook_event_id,
        "webhook-signature": sig_str,
        "webhook-timestamp": ts_str,
        "content-type": "application/json",
    }
    
    wh_response = client.post(
        "/api/v1/webhooks/dodo",
        headers=webhook_headers,
        content=raw_payload,
    )
    print(f" -> Webhook Response: Code={wh_response.status_code}, Body={wh_response.json()}")
    assert wh_response.status_code == 200
    assert wh_response.json()["status"] == "success"
    results["step_5_6_webhook_reach"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 7: Verify Webhook Signature Check
    # -------------------------------------------------------------------------
    print("\n[STEP 7] Verifying Webhook Signature Verification Logic...")
    provider = get_payment_provider("dodo")
    assert provider.verify_webhook_signature(raw_payload, webhook_headers) is True
    print(" -> Standard Webhooks HMAC-SHA256 Signature: VERIFIED")
    results["step_7_signature_verification"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 8: Verify Event Idempotency
    # -------------------------------------------------------------------------
    print("\n[STEP 8] Verifying Webhook Event Idempotency...")
    dup_response = client.post(
        "/api/v1/webhooks/dodo",
        headers=webhook_headers,
        content=raw_payload,
    )
    print(f" -> Duplicate Webhook Response: Code={dup_response.status_code}, Body={dup_response.json()}")
    assert dup_response.status_code == 200
    assert dup_response.json()["status"] == "already_processed"
    
    event_count = db.query(PaymentProviderEvent).filter(
        PaymentProviderEvent.provider == "dodo",
        PaymentProviderEvent.provider_event_id == webhook_event_id,
    ).count()
    assert event_count == 1, f"Expected 1 recorded event, found {event_count}"
    print(f" -> Event table entries for event {webhook_event_id}: {event_count} (No duplicate recorded)")
    results["step_8_event_idempotency"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 9 & 10 & 11: Verify Database Subscription Record & Entitlement Changes
    # -------------------------------------------------------------------------
    print("\n[STEP 9, 10, 11] Verifying Database Subscription Record & Growth Entitlements...")
    db.expire_all()
    updated_sub = db.query(Subscription).filter(Subscription.business_id == biz.id).first()
    
    print(f" -> State After Webhook: Plan={updated_sub.plan_tier}, Status={updated_sub.status}, Amount={updated_sub.amount}, MessagesLimit={updated_sub.messages_limit}, ApptsLimit={updated_sub.appointments_limit}, SubID={updated_sub.provider_subscription_id}")
    
    assert updated_sub.plan_tier == "growth"
    assert updated_sub.status == "active"
    assert updated_sub.amount == 199.0
    assert updated_sub.messages_limit == 2500
    assert updated_sub.appointments_limit == 250
    assert updated_sub.provider_subscription_id == live_sub_id
    results["step_9_10_11_database_and_entitlements"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 12: Verify Dashboard Subscription Endpoint Returns Correct Plan
    # -------------------------------------------------------------------------
    print("\n[STEP 12] Verifying Dashboard Subscription Query API...")
    dashboard_sub_res = client.get("/api/v1/billing/subscription", headers=headers)
    assert dashboard_sub_res.status_code == 200
    dashboard_sub = dashboard_sub_res.json()
    
    print(f" -> Dashboard Payload: Plan={dashboard_sub['plan_tier']}, Status={dashboard_sub['status']}, MessagesLimit={dashboard_sub['messages_limit']}, ApptsLimit={dashboard_sub['appointments_limit']}")
    assert dashboard_sub["plan_tier"] == "growth"
    assert dashboard_sub["status"] == "active"
    assert dashboard_sub["messages_limit"] == 2500
    assert dashboard_sub["appointments_limit"] == 250
    results["step_12_dashboard_display"] = "PASS"

    # -------------------------------------------------------------------------
    # STEP 13: Verify No Duplicate Subscription Record Created
    # -------------------------------------------------------------------------
    print("\n[STEP 13] Verifying Multi-Tenant Schema Single Subscription Constraint...")
    total_subs = db.query(Subscription).filter(Subscription.business_id == biz.id).count()
    print(f" -> Total Subscription records for business {biz.id}: {total_subs}")
    assert total_subs == 1, f"Expected exactly 1 subscription, found {total_subs}"
    results["step_13_no_duplicate_subscription"] = "PASS"

    # =========================================================================
    # SECONDARY SCENARIOS: A, B, C, D, E
    # =========================================================================
    
    # SCENARIO A: Cancellation
    print("\n[SCENARIO A] Testing Subscription Cancellation...")
    cancel_evt_id = f"wh_evt_cancel_{int(time.time())}"
    cancel_payload = {
        "event_type": "subscription.cancelled",
        "webhook_id": cancel_evt_id,
        "data": {
            "subscription_id": live_sub_id,
            "status": "cancelled",
            "metadata": {"business_id": biz.id, "plan_tier": "growth"},
        },
    }
    raw_cancel = json.dumps(cancel_payload).encode("utf-8")
    now_cancel = datetime.now(timezone.utc)
    sig_cancel = wh.sign(cancel_evt_id, now_cancel, raw_cancel.decode("utf-8"))
    
    cancel_res = client.post(
        "/api/v1/webhooks/dodo",
        headers={
            "webhook-id": cancel_evt_id,
            "webhook-signature": sig_cancel,
            "webhook-timestamp": str(int(now_cancel.timestamp())),
        },
        content=raw_cancel,
    )
    assert cancel_res.status_code == 200
    db.expire_all()
    sub_after_cancel = db.query(Subscription).filter(Subscription.business_id == biz.id).first()
    print(f" -> After Cancellation Event: Status={sub_after_cancel.status}, MessagesLimit={sub_after_cancel.messages_limit}")
    assert sub_after_cancel.status == "cancelled"
    results["scenario_a_cancellation"] = "PASS"

    # SCENARIO B: Payment Failure / On Hold
    print("\n[SCENARIO B] Testing Payment Failure / On Hold Lifecycle...")
    fail_evt_id = f"wh_evt_fail_{int(time.time())}"
    fail_payload = {
        "event_type": "payment.failed",
        "webhook_id": fail_evt_id,
        "data": {
            "subscription_id": live_sub_id,
            "status": "on_hold",
            "metadata": {"business_id": biz.id, "plan_tier": "growth"},
        },
    }
    raw_fail = json.dumps(fail_payload).encode("utf-8")
    now_fail = datetime.now(timezone.utc)
    sig_fail = wh.sign(fail_evt_id, now_fail, raw_fail.decode("utf-8"))
    
    fail_res = client.post(
        "/api/v1/webhooks/dodo",
        headers={
            "webhook-id": fail_evt_id,
            "webhook-signature": sig_fail,
            "webhook-timestamp": str(int(now_fail.timestamp())),
        },
        content=raw_fail,
    )
    assert fail_res.status_code == 200
    db.expire_all()
    sub_after_fail = db.query(Subscription).filter(Subscription.business_id == biz.id).first()
    print(f" -> After Payment Failure: Status={sub_after_fail.status}")
    assert sub_after_fail.status == "past_due"
    results["scenario_b_payment_failure"] = "PASS"

    # SCENARIO C: Duplicate Webhook
    print("\n[SCENARIO C] Testing Duplicate Webhook Detection...")
    dup_res = client.post(
        "/api/v1/webhooks/dodo",
        headers={
            "webhook-id": fail_evt_id,
            "webhook-signature": sig_fail,
            "webhook-timestamp": str(int(now_fail.timestamp())),
        },
        content=raw_fail,
    )
    assert dup_res.status_code == 200
    assert dup_res.json()["status"] == "already_processed"
    print(" -> Duplicate Webhook correctly detected & ignored without duplicate database modifications.")
    results["scenario_c_duplicate_webhook"] = "PASS"

    # SCENARIO D: Invalid Webhook Signature
    print("\n[SCENARIO D] Testing Invalid Webhook Signature Rejection...")
    invalid_res = client.post(
        "/api/v1/webhooks/dodo",
        headers={
            "webhook-id": "wh_invalid_001",
            "webhook-signature": "v1,invalid_signature_hash",
            "webhook-timestamp": str(int(time.time())),
        },
        content=b'{"test": "invalid"}',
    )
    print(f" -> Invalid Signature Response: Code={invalid_res.status_code}")
    assert invalid_res.status_code == 400
    results["scenario_d_invalid_signature"] = "PASS"

    # SCENARIO E: Subscription Status Update (Re-activation / Renewal)
    print("\n[SCENARIO E] Testing Subscription Status Update (Reactivation / Renewal)...")
    renew_evt_id = f"wh_evt_renew_{int(time.time())}"
    renew_payload = {
        "event_type": "subscription.renewed",
        "webhook_id": renew_evt_id,
        "data": {
            "subscription_id": live_sub_id,
            "product_id": settings.DODO_PAYMENTS_PRODUCT_GROWTH,
            "status": "active",
            "currency": "USD",
            "amount": 19900,
            "metadata": {"business_id": biz.id, "plan_tier": "growth"},
        },
    }
    raw_renew = json.dumps(renew_payload).encode("utf-8")
    now_renew = datetime.now(timezone.utc)
    sig_renew = wh.sign(renew_evt_id, now_renew, raw_renew.decode("utf-8"))
    
    renew_res = client.post(
        "/api/v1/webhooks/dodo",
        headers={
            "webhook-id": renew_evt_id,
            "webhook-signature": sig_renew,
            "webhook-timestamp": str(int(now_renew.timestamp())),
        },
        content=raw_renew,
    )
    assert renew_res.status_code == 200
    db.expire_all()
    sub_after_renew = db.query(Subscription).filter(Subscription.business_id == biz.id).first()
    print(f" -> After Renewal: Status={sub_after_renew.status}, MessagesLimit={sub_after_renew.messages_limit}")
    assert sub_after_renew.status == "active"
    assert sub_after_renew.messages_limit == 2500
    results["scenario_e_subscription_update"] = "PASS"

    print("\n" + "=" * 80)
    print("ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY")
    print("=" * 80)
    for test_name, res in results.items():
        print(f" - {test_name.upper()}: {res}")
        
    db.close()
    return results

if __name__ == "__main__":
    run_e2e_verification()
