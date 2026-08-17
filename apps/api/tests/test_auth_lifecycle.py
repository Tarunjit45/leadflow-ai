import uuid
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.core.database import SessionLocal
from apps.api.app.models.models import User, Business, BusinessMember

client = TestClient(app)


def test_auth_full_lifecycle():
    test_email = f"production_auth_{uuid.uuid4().hex[:8]}@example.com"

    # 1. Test invalid email formats
    res_bad_email = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "invalid_email_format",
        "password": "Password123!"
    })
    assert res_bad_email.status_code in [400, 422]

    # 2. Test weak password
    res_weak_pwd = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": f"valid_{uuid.uuid4().hex[:8]}@example.com",
        "password": "pwd"
    })
    assert res_weak_pwd.status_code in [400, 422]

    # 3. Valid Signup Flow
    res_signup = client.post("/api/v1/auth/register", json={
        "name": "Alex Mercer",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert res_signup.status_code in [200, 201]
    signup_data = res_signup.json()
    assert "status" in signup_data or "access_token" in signup_data

    # 4. Test duplicate email rejection (safe error message without database leak)
    res_dup = client.post("/api/v1/auth/register", json={
        "name": "Alex Mercer",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert res_dup.status_code == 400
    assert "already be registered" in res_dup.json()["detail"]

    # 5. Verify User Record in DB & test verification token
    db = SessionLocal()
    user = db.query(User).filter(User.email == test_email).first()
    assert user is not None
    assert user.email == test_email
    
    # If verification token exists, test verify-email endpoint
    if not user.is_verified and user.verification_token:
        token = user.verification_token
        res_verify = client.post("/api/v1/auth/verify-email", json={"token": token})
        assert res_verify.status_code == 200
        verify_data = res_verify.json()
        assert "access_token" in verify_data
        
        # Test reused token fails
        res_reused = client.post("/api/v1/auth/verify-email", json={"token": token})
        assert res_reused.status_code == 400
    else:
        # If auto-verified in demo mode, ensure is_verified is True
        user.is_verified = True
        user.verification_token = "mock_test_token_123"
        user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()

    # 6. Test Login with correct credentials
    res_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert res_login.status_code == 200
    login_data = res_login.json()
    access_token = login_data["access_token"]
    assert access_token is not None

    # 7. Test Login with wrong password (safe generic error)
    res_bad_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "WrongPassword999!"
    })
    assert res_bad_login.status_code == 401
    assert "Email or password is incorrect" in res_bad_login.json()["detail"]

    # 8. Test Forgot Password (safe generic response)
    res_forgot = client.post("/api/v1/auth/forgot-password", json={
        "email": test_email
    })
    assert res_forgot.status_code == 200
    assert "sent a password reset link" in res_forgot.json()["message"]

    # Test forgot password with nonexistent email (same safe generic response)
    res_forgot_nonexistent = client.post("/api/v1/auth/forgot-password", json={
        "email": f"does_not_exist_{uuid.uuid4().hex[:8]}@example.com"
    })
    assert res_forgot_nonexistent.status_code == 200
    assert "sent a password reset link" in res_forgot_nonexistent.json()["message"]

    # 9. Test Password Reset
    db.refresh(user)
    reset_token = user.reset_password_token
    assert reset_token is not None

    res_reset = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewSuperPassword456!"
    })
    assert res_reset.status_code == 200
    assert "updated" in res_reset.json()["message"]

    # Test reused reset token fails
    res_reused_reset = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": "AnotherPassword789!"
    })
    assert res_reused_reset.status_code == 400

    # 10. Test Old Login Fails with previous password
    res_old_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert res_old_login.status_code == 401

    # Test Login Succeeds with new password
    res_new_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "NewSuperPassword456!"
    })
    assert res_new_login.status_code == 200
    new_token = res_new_login.json()["access_token"]

    # 11. Test Authenticated Protected Route
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == test_email

    # 12. Test Logout & Session Revocation
    res_logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert res_logout.status_code == 200

    # Test previous token is now rejected after logout
    res_after_logout = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert res_after_logout.status_code == 401

    # Clean up test user
    db.close()
