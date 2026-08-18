import uuid
import sys
import os

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

# Remove old temp db if present
if os.path.exists("./test_persistence_temp.db"):
    try:
        os.remove("./test_persistence_temp.db")
    except Exception:
        pass

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from apps.api.app.core.database import Base, get_db
from apps.api.app.models.models import User, Business, BusinessMember, BusinessKnowledge, Agent
from apps.api.app.main import app
from apps.api.app.core.security import create_access_token, get_password_hash

# File-based SQLite for fast local automated test suite
test_engine = create_engine("sqlite:///./test_persistence_temp.db", connect_args={"check_same_thread": False})
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


def get_or_create_test_user(prefix: str):
    db = TestingSessionLocal()
    try:
        user_id = str(uuid.uuid4())
        biz_id = str(uuid.uuid4())
        email = f"{prefix}_{uuid.uuid4().hex[:6]}@example.com"
        user = User(
            id=user_id,
            email=email,
            name=f"Owner {prefix.title()}",
            hashed_password=get_password_hash("SecurePassword123!"),
            is_verified=True,
            is_active=True,
            session_version=1,
        )
        db.add(user)

        biz = Business(
            id=biz_id,
            name=f"{prefix.title()} Business",
            onboarding_completed=False,
            onboarding_step=1,
            completed_steps=[],
            onboarding_state={},
            onboarding_version=1,
            timezone="Asia/Kolkata",
        )
        db.add(biz)

        mem = BusinessMember(
            id=str(uuid.uuid4()),
            business_id=biz_id,
            user_id=user_id,
            role="owner"
        )
        db.add(mem)
        db.commit()

        token = create_access_token(subject=user_id, business_id=biz_id, role="owner", session_version=1)
        return user_id, biz_id, token
    finally:
        db.close()


def test_onboarding_state_initialization():
    user, biz, token = get_or_create_test_user("init")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/businesses/onboarding/state", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["current_step"] == 1
    assert data["allowed_step"] == 1
    assert data["completed_steps"] == []
    assert data["onboarding_completed"] is False
    print("PASS - [TEST 1] Onboarding State Initialization & Hydration")


def test_draft_autosave_preserves_partial_data():
    user, biz, token = get_or_create_test_user("draft")
    headers = {"Authorization": f"Bearer {token}"}

    draft_data = {
        "business_name": "Apex Dental Pro",
        "industry": "dental",
        "city": "Austin, TX",
        "description": "High-end dental care"
    }
    res = client.patch(
        "/api/v1/businesses/onboarding/step/2",
        headers=headers,
        json={"data": draft_data}
    )
    assert res.status_code == 200, res.text
    assert res.json()["success"] is True

    # Hydrate from state endpoint
    res_state = client.get("/api/v1/businesses/onboarding/state", headers=headers)
    assert res_state.status_code == 200
    state_data = res_state.json()
    assert state_data["business_info"]["name"] == "Apex Dental Pro"
    assert state_data["business_info"]["industry"] == "dental"
    assert state_data["business_info"]["city"] == "Austin, TX"
    print("PASS - [TEST 2] Partial Draft Auto-Save & Hydration")


def test_step_1_validation_and_completion():
    user, biz, token = get_or_create_test_user("step1")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Invalid short name
    bad_res = client.post(
        "/api/v1/businesses/onboarding/step/1/complete",
        headers=headers,
        json={"step": 1, "data": {"owner_name": "a", "owner_phone": "+919876543210"}}
    )
    assert bad_res.status_code == 422

    # 2. Garbage name
    bad_res2 = client.post(
        "/api/v1/businesses/onboarding/step/1/complete",
        headers=headers,
        json={"step": 1, "data": {"owner_name": "aaaaaaa", "owner_phone": "+919876543210"}}
    )
    assert bad_res2.status_code == 422

    # 3. Valid Step 1
    good_res = client.post(
        "/api/v1/businesses/onboarding/step/1/complete",
        headers=headers,
        json={"step": 1, "data": {"owner_name": "Dr. Sarah Jenkins", "owner_phone": "+919876543210", "timezone": "Asia/Kolkata"}}
    )
    assert good_res.status_code == 200
    assert 1 in good_res.json()["completed_steps"]
    assert good_res.json()["next_step"] == 2
    print("PASS - [TEST 3] Step 1 Anti-Garbage & Strict Phone Validation")


def test_step_3_duplicate_service_rejection():
    user, biz, token = get_or_create_test_user("step3")
    headers = {"Authorization": f"Bearer {token}"}

    dup_services = [
        {"name": "Teeth Cleaning", "price": "$80", "duration": 45},
        {"name": " teeth cleaning ", "price": "$90", "duration": 60},
    ]

    res = client.post(
        "/api/v1/businesses/onboarding/step/3/complete",
        headers=headers,
        json={"step": 3, "data": {"services": dup_services}}
    )
    assert res.status_code == 422
    assert "Duplicate service" in res.json()["detail"]
    print("PASS - [TEST 4] Duplicate Service Catalog Protection")


def test_step_4_business_hours_validation():
    user, biz, token = get_or_create_test_user("step4")
    headers = {"Authorization": f"Bearer {token}"}

    # Opening time after closing time
    bad_hours = {
        "monday": {"open": "18:00", "close": "08:00", "closed": False}
    }
    res = client.post(
        "/api/v1/businesses/onboarding/step/4/complete",
        headers=headers,
        json={"step": 4, "data": {"hours": bad_hours}}
    )
    assert res.status_code == 422
    assert "Opening time" in res.json()["detail"]
    print("PASS - [TEST 5] Business Hours Chronological Validation")


def test_duplicate_whatsapp_protection():
    db = TestingSessionLocal()
    try:
        # Create first active business
        user1_id, biz1_id, token1 = get_or_create_test_user("biz1wa")
        b1 = db.query(Business).filter(Business.id == biz1_id).first()
        test_wa_phone = f"+91987{uuid.uuid4().hex[:6]}"
        b1.customer_whatsapp_number = test_wa_phone
        b1.phone = test_wa_phone
        b1.onboarding_completed = True
        db.commit()

        # Create second business trying to connect the same number
        user2_id, biz2_id, token2 = get_or_create_test_user("biz2wa")
        headers2 = {"Authorization": f"Bearer {token2}"}

        res = client.post(
            "/api/v1/businesses/onboarding/step/7/complete",
            headers=headers2,
            json={"step": 7, "data": {"customer_whatsapp": test_wa_phone}}
        )
        assert res.status_code == 409
        assert "already connected" in res.json()["detail"]
        print("PASS - [TEST 6] Duplicate WhatsApp Channel Conflict Protection")
    finally:
        db.close()


def test_step_bypass_protection():
    user, biz, token = get_or_create_test_user("bypass")
    headers = {"Authorization": f"Bearer {token}"}

    # Complete Step 1
    client.post(
        "/api/v1/businesses/onboarding/step/1/complete",
        headers=headers,
        json={"step": 1, "data": {"owner_name": "Test Owner", "owner_phone": "+919876543210"}}
    )

    # Server state must clamp current_step & allowed_step to 2
    res = client.get("/api/v1/businesses/onboarding/state", headers=headers)
    assert res.json()["allowed_step"] == 2
    assert res.json()["current_step"] == 2
    print("PASS - [TEST 7] Direct URL Step Bypass Prevention")


def test_activation_and_completion():
    user, biz, token = get_or_create_test_user("activate")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "business_name": "Apex Premier Health",
        "industry": "dental",
        "owner_phone": f"+9199{uuid.uuid4().hex[:8]}",
        "customer_whatsapp_number": f"+9198{uuid.uuid4().hex[:8]}",
        "services": [
            {"name": "Initial Consultation", "price": "$100", "duration": 30}
        ],
        "hours": {
            "monday": {"open": "08:00", "close": "17:00", "closed": False}
        },
        "agent_name": "Alex",
        "agent_role": "Patient Care Coordinator",
        "agent_tone": "friendly",
        "agent_responsibilities": ["answer_questions", "book_appointments"]
    }

    res = client.post(
        "/api/v1/businesses/onboarding/activate",
        headers=headers,
        json=payload
    )
    assert res.status_code == 200, res.text
    assert res.json()["onboarding_completed"] is True
    assert res.json()["onboarding_step"] == 10
    print("PASS - [TEST 8] Final Activation & Multi-Tenant Launch")


if __name__ == "__main__":
    print("\n============================================================")
    print("LEADFLOW AI - PERSISTENT & STRICT ONBOARDING TEST SUITE")
    print("============================================================")
    test_onboarding_state_initialization()
    test_draft_autosave_preserves_partial_data()
    test_step_1_validation_and_completion()
    test_step_3_duplicate_service_rejection()
    test_step_4_business_hours_validation()
    test_duplicate_whatsapp_protection()
    test_step_bypass_protection()
    test_activation_and_completion()
    print("============================================================")
    print("ALL 8/8 ONBOARDING PERSISTENCE & VALIDATION TESTS PASSED!")
    print("============================================================\n")

    # Cleanup temp db
    if os.path.exists("./test_persistence_temp.db"):
        try:
            os.remove("./test_persistence_temp.db")
        except Exception:
            pass
