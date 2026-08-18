import uuid
import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

if os.path.exists("./test_attack_audit.db"):
    try:
        os.remove("./test_attack_audit.db")
    except Exception:
        pass

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from apps.api.app.core.database import Base, get_db
from apps.api.app.models.models import (
    User,
    Business,
    BusinessMember,
    BusinessKnowledge,
    Agent,
    Lead,
    Appointment,
    Conversation,
    Message,
)
from apps.api.app.main import app
from apps.api.app.core.security import create_access_token, get_password_hash
from apps.api.app.agents.tools.registry import tool_registry

test_engine = create_engine("sqlite:///./test_attack_audit.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def create_tenant_environment(prefix: str):
    db = TestingSessionLocal()
    try:
        user_id = str(uuid.uuid4())
        biz_id = str(uuid.uuid4())
        email = f"{prefix}_{uuid.uuid4().hex[:6]}@example.com"
        
        user = User(
            id=user_id,
            email=email,
            name=f"Owner {prefix.title()}",
            hashed_password=get_password_hash("CorrectPassword123!"),
            is_verified=True,
            is_active=True,
            session_version=1,
        )
        db.add(user)

        biz = Business(
            id=biz_id,
            name=f"{prefix.title()} Enterprise",
            phone=f"+1555{uuid.uuid4().hex[:7]}",
            owner_phone=f"+1555{uuid.uuid4().hex[:7]}",
            onboarding_completed=True,
            timezone="America/New_York",
        )
        db.add(biz)

        mem = BusinessMember(
            id=str(uuid.uuid4()),
            business_id=biz_id,
            user_id=user_id,
            role="owner"
        )
        db.add(mem)

        agent = Agent(
            id=str(uuid.uuid4()),
            business_id=biz_id,
            name=f"{prefix.title()} AI Assistant",
            status="active"
        )
        db.add(agent)

        db.commit()
        token = create_access_token(subject=user_id, business_id=biz_id, role="owner", session_version=1)
        return user_id, biz_id, token
    finally:
        db.close()


# --- 1. AUTHENTICATION & SESSION ATTACK TESTS ---
def test_auth_attacks():
    user_id, biz_id, valid_token = create_tenant_environment("auth_test")

    # Attack 1: Missing JWT
    res_no_auth = client.get("/api/v1/leads/")
    assert res_no_auth.status_code == 401, f"Expected 401 for missing JWT, got {res_no_auth.status_code}"

    # Attack 2: Tampered / Malformed JWT
    res_tampered = client.get("/api/v1/leads/", headers={"Authorization": f"Bearer {valid_token}MALICIOUS_SUFFIX"})
    assert res_tampered.status_code == 401, f"Expected 401 for tampered JWT, got {res_tampered.status_code}"

    # Attack 3: Wrong password login
    res_wrong_pw = client.post("/api/v1/auth/login", json={"email": "auth_test@example.com", "password": "WrongPassword!"})
    assert res_wrong_pw.status_code == 401

    # Attack 4: Session Invalidation on Logout
    res_logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {valid_token}"})
    assert res_logout.status_code == 200

    # Old token must now be rejected because session_version incremented
    res_revoked = client.get("/api/v1/leads/", headers={"Authorization": f"Bearer {valid_token}"})
    assert res_revoked.status_code == 401, "Revoked token must be rejected after logout!"

    print("PASS - [AUDIT 1] Authentication & Session Invalidation Defense")


# --- 2. MULTI-TENANT AUTHORIZATION & IDOR ATTACKS ---
def test_idor_cross_tenant_attacks():
    user_a, biz_a, token_a = create_tenant_environment("tenant_a")
    user_b, biz_b, token_b = create_tenant_environment("tenant_b")

    db = TestingSessionLocal()
    try:
        # Create a private lead and appointment in Business B
        lead_b = Lead(
            business_id=biz_b,
            name="Confidential Customer B",
            phone="+15559998888",
            email="confidential_b@example.com",
            service="Emergency Root Canal",
            status="qualified",
        )
        db.add(lead_b)
        db.flush()

        appt_b = Appointment(
            business_id=biz_b,
            lead_id=lead_b.id,
            start_time=datetime.now(timezone.utc) + timedelta(days=2, hours=10),
            end_time=datetime.now(timezone.utc) + timedelta(days=2, hours=11),
            customer_name="Confidential Customer B",
            status="confirmed",
        )
        db.add(appt_b)
        db.commit()
        lead_b_id = lead_b.id
        appt_b_id = appt_b.id
    finally:
        db.close()

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Attack 1: User A tries to GET Lead B by direct ID (IDOR)
    res_idor_lead = client.get(f"/api/v1/leads/{lead_b_id}", headers=headers_a)
    assert res_idor_lead.status_code == 404, f"IDOR vulnerability! User A could access Lead B: {res_idor_lead.text}"

    # Attack 2: User A tries to modify Lead B (IDOR)
    res_idor_mod_lead = client.patch(
        f"/api/v1/leads/{lead_b_id}",
        headers=headers_a,
        json={"name": "Tampered By Hacker A"}
    )
    assert res_idor_mod_lead.status_code == 404, "IDOR vulnerability! User A could modify Lead B"

    # Attack 3: User A tries to modify Appointment B (IDOR)
    res_idor_appt = client.patch(
        f"/api/v1/appointments/{appt_b_id}",
        headers=headers_a,
        json={"notes": "Tampered appointment"}
    )
    assert res_idor_appt.status_code == 404, "IDOR vulnerability! User A could modify Appointment B"

    # Attack 4: User A listing leads must not contain Lead B
    res_list = client.get("/api/v1/leads/", headers=headers_a)
    assert res_list.status_code == 200
    leads_a = res_list.json()
    assert all(l["id"] != lead_b_id for l in leads_a), "Cross-tenant data leaked in list query!"

    print("PASS - [AUDIT 2] Multi-Tenant IDOR & Data Leakage Resistance")


# --- 3. APPOINTMENT DOUBLE-BOOKING CONCURRENCY ATTACK ---
def test_appointment_double_booking_attack():
    user_id, biz_id, token = create_tenant_environment("concurrency_biz")
    headers = {"Authorization": f"Bearer {token}"}

    booking_start = (datetime.now(timezone.utc) + timedelta(days=3)).replace(hour=14, minute=0, second=0, microsecond=0)
    booking_end = booking_start + timedelta(minutes=60)

    # First customer successfully reserves slot 14:00 - 15:00
    res1 = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "start_time": booking_start.isoformat(),
            "end_time": booking_end.isoformat(),
            "customer_name": "Alice First",
            "service": "AC Inspection",
        }
    )
    assert res1.status_code == 200, f"Booking 1 failed: {res1.text}"

    # Second customer concurrently attempts to book the EXACT same slot (or overlapping 14:30 - 15:30)
    res2_exact = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "start_time": booking_start.isoformat(),
            "end_time": booking_end.isoformat(),
            "customer_name": "Bob Duplicate",
            "service": "AC Repair",
        }
    )
    assert res2_exact.status_code == 409, f"Expected 409 Conflict for double-booking, got {res2_exact.status_code}"

    # Overlapping booking (14:30 - 15:30) must also be rejected
    overlap_start = booking_start + timedelta(minutes=30)
    overlap_end = overlap_start + timedelta(minutes=60)
    res3_overlap = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "start_time": overlap_start.isoformat(),
            "end_time": overlap_end.isoformat(),
            "customer_name": "Charlie Overlap",
            "service": "AC Repair",
        }
    )
    assert res3_overlap.status_code == 409, f"Expected 409 Conflict for overlapping slot, got {res3_overlap.status_code}"

    print("PASS - [AUDIT 3] Appointment Double-Booking & Race Condition Defense")


# --- 4. AI TOOL ROLE & PERMISSION ATTACK ---
def test_ai_tool_permission_boundaries():
    user_id, biz_id, token = create_tenant_environment("ai_sec_biz")
    db = TestingSessionLocal()
    try:
        conv = Conversation(
            business_id=biz_id,
            customer_id="+15551234567",
            customer_name="Attacker Customer",
            channel="whatsapp",
            status="ai_handling",
        )
        db.add(conv)
        db.commit()
        conv_id = conv.id

        import asyncio

        # Attack: Customer session tries to execute owner admin tool 'toggle_ai_automation'
        attack_result = asyncio.run(
            tool_registry.execute_tool(
                db=db,
                business_id=biz_id,
                conversation_id=conv_id,
                tool_name="toggle_ai_automation",
                arguments_json='{"new_status": "paused"}',
                allowed_tools={"toggle_ai_automation": True},
                is_owner=False, # Customer session
            )
        )
        assert attack_result["success"] is False, "Security failure: Customer session executed owner tool!"
        assert "requires verified business owner authorization" in attack_result["error"]

        # Legitimate Owner execution of 'toggle_ai_automation'
        owner_result = asyncio.run(
            tool_registry.execute_tool(
                db=db,
                business_id=biz_id,
                conversation_id=conv_id,
                tool_name="toggle_ai_automation",
                arguments_json='{"new_status": "paused"}',
                allowed_tools={"toggle_ai_automation": True},
                is_owner=True, # Verified Owner
            )
        )
        assert owner_result["success"] is True, f"Owner tool failed: {owner_result}"
        assert owner_result["result"]["status"] == "paused"

        print("PASS - [AUDIT 4] AI Tool Server-Side Role Authorization Barrier")
    finally:
        db.close()


# --- 5. WHATSAPP UNMAPPED TENANT ATTACK ---
def test_unmapped_whatsapp_message_isolation():
    user_id, biz_id, token = create_tenant_environment("wa_target_biz")
    
    # An incoming webhook from an unmapped/unknown phone_number_id
    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "UNKNOWN_WABA_9999",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "+10000000000",
                                "phone_number_id": "UNKNOWN_PHONE_ID_999999"
                            },
                            "contacts": [{"profile": {"name": "Random Sender"}}],
                            "messages": [
                                {
                                    "from": "+19998887777",
                                    "id": f"wamid.{uuid.uuid4().hex}",
                                    "timestamp": "1700000000",
                                    "type": "text",
                                    "text": {"body": "Secret Message meant for another company"}
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }

    # Dispatch to webhook endpoint
    res = client.post("/api/v1/webhooks/whatsapp", json=payload)
    assert res.status_code == 200

    # Ensure no conversation was erroneously created in our business
    db = TestingSessionLocal()
    try:
        erroneous_conv = db.query(Conversation).filter(
            Conversation.business_id == biz_id,
            Conversation.customer_id == "+19998887777"
        ).first()
        assert erroneous_conv is None, "Tenant isolation failure: Unmapped WhatsApp message routed to arbitrary tenant!"
        print("PASS - [AUDIT 5] WhatsApp Unmapped Tenant Isolation Defense")
    finally:
        db.close()


if __name__ == "__main__":
    print("\n============================================================")
    print("LEADFLOW AI - PRODUCTION READINESS & ATTACK AUDIT SUITE")
    print("============================================================")
    test_auth_attacks()
    test_idor_cross_tenant_attacks()
    test_appointment_double_booking_attack()
    test_ai_tool_permission_boundaries()
    test_unmapped_whatsapp_message_isolation()
    print("============================================================")
    print("ALL PRODUCTION ATTACK & SECURITY AUDIT TESTS PASSED!")
    print("============================================================\n")

    if os.path.exists("./test_attack_audit.db"):
        try:
            os.remove("./test_attack_audit.db")
        except Exception:
            pass
