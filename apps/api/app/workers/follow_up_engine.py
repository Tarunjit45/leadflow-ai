import logging
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from apps.api.app.models.models import FollowUp, Lead, Conversation, Business, Message
from apps.api.app.integrations.whatsapp import WhatsAppProvider

logger = logging.getLogger(__name__)


class FollowUpEngine:
    @staticmethod
    def schedule_initial_followups(db: Session, business_id: str, lead_id: str, conversation_id: str):
        """Schedules default 3-stage cadence for a new/contacted lead if not booked."""
        now = datetime.now(timezone.utc)
        
        # Follow-up 1: +24 hours
        f1 = FollowUp(
            business_id=business_id,
            lead_id=lead_id,
            conversation_id=conversation_id,
            scheduled_for=now + timedelta(hours=24),
            attempt_number=1,
            status="scheduled",
            message="Hi there! Just checking back from our service team. Did you still want us to get you scheduled for service this week?",
        )
        # Follow-up 2: +72 hours
        f2 = FollowUp(
            business_id=business_id,
            lead_id=lead_id,
            conversation_id=conversation_id,
            scheduled_for=now + timedelta(hours=72),
            attempt_number=2,
            status="scheduled",
            message="Hello! Following up to see if you have any questions or need a quick price estimate on your service request. Let us know how we can help!",
        )
        # Follow-up 3: +7 days
        f3 = FollowUp(
            business_id=business_id,
            lead_id=lead_id,
            conversation_id=conversation_id,
            scheduled_for=now + timedelta(days=7),
            attempt_number=3,
            status="scheduled",
            message="Hi! We're closing out this week's inquiries. If you still need assistance, simply reply here and we'll be glad to help.",
        )
        db.add_all([f1, f2, f3])
        db.commit()

    @staticmethod
    async def process_due_followups(db: Session) -> int:
        """Finds all scheduled followups that are due and processes them respecting stop conditions."""
        now = datetime.now(timezone.utc)
        due_followups: List[FollowUp] = (
            db.query(FollowUp)
            .filter(FollowUp.status == "scheduled", FollowUp.scheduled_for <= now)
            .limit(50)
            .all()
        )

        processed_count = 0
        for item in due_followups:
            lead = db.query(Lead).filter(Lead.id == item.lead_id).first()
            conv = db.query(Conversation).filter(Conversation.id == item.conversation_id).first()
            
            # Stop condition 1: Appointment already booked or lead won/lost
            if not lead or lead.status in ["booked", "won", "lost"]:
                item.status = "skipped"
                continue

            # Stop condition 2: Customer responded recently after follow-up was created
            if conv and conv.last_message_at and conv.last_message_at > item.created_at:
                item.status = "cancelled"
                continue

            # Send outbound message based on channel
            if conv and conv.channel == "whatsapp" and lead.phone:
                whatsapp = WhatsAppProvider()
                await whatsapp.send_text_message(lead.phone, item.message)
            
            # Record outbound message in message thread
            if conv:
                msg = Message(
                    conversation_id=conv.id,
                    sender_type="ai",
                    content=item.message,
                    metadata_info={"follow_up_attempt": item.attempt_number},
                )
                db.add(msg)

            item.status = "sent"
            item.sent_at = now
            processed_count += 1

        db.commit()
        return processed_count
