import pytest
import json
from apps.api.app.agents.tools.registry import tool_registry
from apps.api.app.core.database import SessionLocal, Base, engine
from apps.api.app.models.models import Business, Conversation


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.mark.asyncio
async def test_tool_permission_enforcement(db_session):
    biz = Business(name="Security HVAC", industry="HVAC")
    db_session.add(biz)
    db_session.flush()

    conv = Conversation(business_id=biz.id, customer_id="+15550099")
    db_session.add(conv)
    db_session.flush()

    # Define permission map with book_appointment DISABLED
    allowed_tools = {
        "qualify_and_update_lead": True,
        "book_appointment": False,  # Disabled
    }

    # Attempt to execute unauthorized tool
    result = await tool_registry.execute_tool(
        db=db_session,
        business_id=biz.id,
        conversation_id=conv.id,
        tool_name="book_appointment",
        arguments_json=json.dumps({"start_time": "2026-08-18T10:00:00", "customer_name": "Test"}),
        allowed_tools=allowed_tools,
    )

    # Must be denied
    assert result["success"] is False
    assert "Permission denied" in result["error"]


@pytest.mark.asyncio
async def test_authorized_tool_execution(db_session):
    biz = Business(name="Allowed HVAC", industry="HVAC")
    db_session.add(biz)
    db_session.flush()

    conv = Conversation(business_id=biz.id, customer_id="+15550098")
    db_session.add(conv)
    db_session.flush()

    allowed_tools = {
        "get_calendar_availability": True,
    }

    result = await tool_registry.execute_tool(
        db=db_session,
        business_id=biz.id,
        conversation_id=conv.id,
        tool_name="get_calendar_availability",
        arguments_json=json.dumps({"days_ahead": 2}),
        allowed_tools=allowed_tools,
    )

    assert result["success"] is True
    assert "available_slots" in result["result"]
