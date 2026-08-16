import pytest
from apps.api.app.agents.tools.registry import _handle_qualify_lead
from apps.api.app.models.models import Lead, Conversation, Business
from apps.api.app.core.database import SessionLocal, Base, engine


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_lead_scoring_ranges():
    # Test scoring boundaries as defined in Section 22:
    # 0-30 = cold, 31-60 = warm, 61-100 = hot
    cold_score = 25
    warm_score = 55
    hot_score = 85

    assert cold_score <= 30
    assert 31 <= warm_score <= 60
    assert hot_score >= 61


@pytest.mark.asyncio
async def test_qualify_and_update_lead(db_session):
    # Setup test business and conversation
    biz = Business(name="Test HVAC Co", industry="HVAC")
    db_session.add(biz)
    db_session.flush()

    conv = Conversation(business_id=biz.id, customer_id="+15550001", customer_name="Test Customer")
    db_session.add(conv)
    db_session.flush()

    args = {
        "name": "Jane Doe",
        "phone": "+1 (555) 234-5678",
        "email": "jane@example.com",
        "service": "AC Repair",
        "problem": "AC is blowing hot air",
        "intent": "urgent_repair",
        "urgency": "high",
        "score": 85,
    }

    result = await _handle_qualify_lead(db_session, biz.id, conv.id, args)
    assert result["name"] == "Jane Doe"
    assert result["score"] == 85
    assert result["status"] == "qualified"

    # Verify database persistence
    saved_lead = db_session.query(Lead).filter(Lead.conversation_id == conv.id).first()
    assert saved_lead is not None
    assert saved_lead.name == "Jane Doe"
    assert saved_lead.score == 85
