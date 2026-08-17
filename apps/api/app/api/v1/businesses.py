import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.core.email import EmailService
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.integrations.whatsapp import WhatsAppProvider
from apps.api.app.models.models import Business, BusinessKnowledge, Agent, User, Conversation, Message
from apps.api.app.schemas.schemas import BusinessOut, BusinessUpdate, OnboardingPayload

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("/current", response_model=BusinessOut)
def get_business(business: Business = Depends(get_current_business)):
    return BusinessOut.model_validate(business)


@router.patch("/current", response_model=BusinessOut)
def update_business(
    payload: BusinessUpdate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return BusinessOut.model_validate(business)


@router.post("/onboarding", response_model=BusinessOut)
async def complete_onboarding(
    payload: OnboardingPayload,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Processes the full multi-step onboarding wizard in a single atomic operation and dispatches welcome notifications."""
    business.name = payload.business_name
    business.industry = payload.industry
    business.website = payload.website
    business.phone = payload.phone
    business.address = payload.address
    business.timezone = payload.timezone
    business.description = payload.description
    business.onboarding_completed = True

    # Update or create knowledge base
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(business_id=business.id)
        db.add(knowledge)

    if payload.services:
        knowledge.services = payload.services
    if payload.hours:
        knowledge.hours = payload.hours
    if payload.service_areas:
        knowledge.service_areas = payload.service_areas

    # Update or create agent
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(business_id=business.id)
        db.add(agent)

    agent.name = payload.agent_name
    agent.role = payload.agent_role
    agent.status = "active"

    db.commit()
    db.refresh(business)

    # 1. Dispatch Automated WhatsApp Welcome & Command Center introduction to owner's number
    if business.phone and len(business.phone.strip()) > 3:
        whatsapp = WhatsAppProvider()
        welcome_whatsapp_msg = (
            f"👋 Welcome to LeadFlow AI, {current_user.name}!\n\n"
            f"I am {agent.name}, your new 24/7 AI employee for {business.name}.\n\n"
            f"✅ I am now actively connected and ready to respond to incoming customer inquiries, quote prices, and book appointments in under 2 seconds.\n\n"
            f"🎮 WhatsApp Owner Control Center:\n"
            f"You can control me and manage your entire business directly from this WhatsApp chat! Just message me tasks like:\n"
            f"• 'How many leads did we get today?'\n"
            f"• 'What appointments are booked for tomorrow?'\n"
            f"• 'Pause the AI' or 'Resume the AI'\n"
            f"• 'Add a new service: AC Deep Cleaning for $140'\n"
            f"• 'Change business hours to 8 AM - 8 PM'\n\n"
            f"Whenever you need anything updated, just message me right here anytime!"
        )
        try:
            await whatsapp.send_text_message(business.phone, welcome_whatsapp_msg)
            logger.info(f"✓ Welcome WhatsApp message dispatched to {business.phone}")
        except Exception as e:
            logger.warning(f"Failed to dispatch welcome WhatsApp message: {e}")

    # 2. Dispatch Automated Welcome Email to owner
    if current_user.email:
        try:
            EmailService.send_onboarding_welcome_email(
                to_email=current_user.email,
                name=current_user.name or "Business Owner",
                business_name=business.name,
                agent_name=agent.name,
                phone_number=business.phone or "Your WhatsApp Number",
                app_url=settings.APP_URL,
            )
            logger.info(f"✓ Welcome Email dispatched to {current_user.email}")
        except Exception as e:
            logger.warning(f"Failed to dispatch welcome email: {e}")

    return BusinessOut.model_validate(business)


@router.post("/toggle-automation")
def toggle_automation(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Toggle agent status between active and paused."""
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(business_id=business.id, status="active")
        db.add(agent)
        db.commit()
        db.refresh(agent)

    new_status = "paused" if agent.status == "active" else "active"
    agent.status = new_status
    db.commit()
    db.refresh(agent)

    return {
        "status": agent.status,
        "is_active": agent.status == "active",
        "message": "AI Employee is working" if agent.status == "active" else "AI Employee is paused",
    }


@router.get("/setup-progress")
def get_setup_progress(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Calculates non-technical setup milestone progress for business owners."""
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()

    has_business_info = bool(business.name and len(business.name.strip()) > 0)
    has_services = bool(knowledge and knowledge.services and len(knowledge.services) > 0)
    has_agent = bool(agent and agent.name and len(agent.name.strip()) > 0)
    has_hours = bool(knowledge and knowledge.hours and len(knowledge.hours) > 0)
    is_active = bool(agent and agent.status == "active")

    steps = [
        {"id": "business", "label": "Business Details", "completed": has_business_info},
        {"id": "services", "label": "Services & Prices", "completed": has_services},
        {"id": "agent", "label": "AI Employee Setup", "completed": has_agent},
        {"id": "hours", "label": "Business Hours", "completed": has_hours},
        {"id": "automation", "label": "Automation Active", "completed": is_active},
    ]

    completed_count = sum(1 for s in steps if s["completed"])
    total_count = len(steps)

    return {
        "completed_count": completed_count,
        "total_count": total_count,
        "percentage": round((completed_count / total_count) * 100),
        "steps": steps,
        "is_ready": completed_count >= 4,
    }
