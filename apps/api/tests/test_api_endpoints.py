import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "LeadFlow AI API"
    assert data["status"] == "operational"


def test_auth_and_demo_login():
    response = client.post("/api/v1/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@leadflow.ai"
    token = data["access_token"]
    
    # Test protected /me endpoint
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "demo@leadflow.ai"


def test_analytics_summary():
    # Login demo
    login_resp = client.post("/api/v1/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/analytics/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_leads" in data
    assert "conversion_rate_pct" in data
    assert "estimated_revenue_recovered" in data


def test_agent_test_console_simulation():
    login_resp = client.post("/api/v1/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/test-console/simulate",
        json={"message": "My air conditioning stopped cooling. How much is diagnostic fee?"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 10


def test_public_chat_widget_flow():
    # Fetch business id
    login_resp = client.post("/api/v1/auth/demo-login")
    biz_id = login_resp.json()["business_id"]

    # Public widget config
    cfg_resp = client.get(f"/api/v1/widget/config/{biz_id}")
    assert cfg_resp.status_code == 200
    assert "business_name" in cfg_resp.json()

    # Public visitor sends message
    msg_resp = client.post(
        f"/api/v1/widget/message/{biz_id}",
        json={
            "customer_name": "Test Visitor",
            "message": "Hi, do you service Round Rock area?",
            "session_id": "sess_test_123"
        }
    )
    assert msg_resp.status_code == 200
    assert "reply" in msg_resp.json()
    assert "conversation_id" in msg_resp.json()
