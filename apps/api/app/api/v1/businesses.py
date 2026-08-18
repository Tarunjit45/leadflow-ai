import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.core.email import EmailService
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.integrations.whatsapp import WhatsAppProvider
from apps.api.app.models.models import Business, BusinessKnowledge, Agent, User, Conversation, Message, Integration
from apps.api.app.schemas.schemas import (
    BusinessOut,
    BusinessUpdate,
    OnboardingPayload,
    OnboardingStepPayload,
)

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


@router.get("/onboarding/state")
def get_onboarding_state(
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns persistent onboarding wizard progress, draft data, and step completion statuses."""
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    gcal = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "google_calendar",
        Integration.status == "connected"
    ).first()
    wa_integ = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "whatsapp",
        Integration.status == "connected"
    ).first()

    # Step completion evaluations
    step_1_valid = bool(current_user.name and (business.owner_phone or current_user.email))
    step_2_valid = bool(business.name and len(business.name.strip()) > 1)
    step_3_valid = bool(knowledge and knowledge.services and len(knowledge.services) > 0)
    step_4_valid = bool(knowledge and knowledge.hours and len(knowledge.hours) > 0)
    step_5_valid = bool(agent and agent.name and len(agent.name.strip()) > 0)
    step_6_valid = bool(business.owner_phone and len(business.owner_phone.strip()) >= 7)
    step_7_valid = bool((business.customer_whatsapp_number or business.phone) and len((business.customer_whatsapp_number or business.phone).strip()) >= 7)
    step_8_valid = True  # Optional / Recommended
    step_9_valid = step_1_valid and step_2_valid and step_3_valid and step_4_valid and step_5_valid and step_6_valid and step_7_valid

    return {
        "business_id": business.id,
        "onboarding_completed": business.onboarding_completed,
        "current_step": business.onboarding_step or 1,
        "state_data": business.onboarding_state or {},
        "validations": {
            "step_1_owner_info": step_1_valid,
            "step_2_business_info": step_2_valid,
            "step_3_services": step_3_valid,
            "step_4_hours": step_4_valid,
            "step_5_ai_employee": step_5_valid,
            "step_6_owner_whatsapp": step_6_valid,
            "step_7_customer_whatsapp": step_7_valid,
            "step_8_calendar": bool(gcal),
            "ready_for_activation": step_9_valid,
        },
        "owner_info": {
            "name": current_user.name,
            "email": current_user.email,
            "owner_phone": business.owner_phone,
            "timezone": business.timezone,
        },
        "business_info": {
            "name": business.name,
            "industry": business.industry,
            "city": business.address,
            "timezone": business.timezone,
            "description": business.description,
        },
        "services": knowledge.services if knowledge else [],
        "hours": knowledge.hours if knowledge else {},
        "agent": {
            "name": agent.name if agent else "LeadFlow AI Assistant",
            "role": agent.role if agent else "Sales & Appointment Specialist",
            "status": agent.status if agent else "active",
        },
        "channels": {
            "owner_phone": business.owner_phone,
            "customer_whatsapp": business.customer_whatsapp_number or business.phone,
            "google_calendar_connected": bool(gcal),
            "whatsapp_connected": bool(wa_integ or business.owner_phone),
        },
    }


@router.post("/onboarding/step")
def save_onboarding_step(
    payload: OnboardingStepPayload,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Saves partial onboarding step draft to database so user never loses progress on reload."""
    current_state = dict(business.onboarding_state or {})
    current_state[f"step_{payload.step}"] = payload.data
    business.onboarding_state = current_state
    business.onboarding_step = max(business.onboarding_step or 1, payload.step)

    data = payload.data
    # Apply step updates immediately to core database models
    if payload.step == 1:
        if data.get("owner_name"):
            current_user.name = data["owner_name"].strip()
        if data.get("owner_phone"):
            business.owner_phone = data["owner_phone"].strip()
        if data.get("timezone"):
            business.timezone = data["timezone"].strip()

    elif payload.step == 2:
        if data.get("business_name"):
            business.name = data["business_name"].strip()
        if data.get("industry"):
            business.industry = data["industry"].strip()
        if data.get("city"):
            business.address = data["city"].strip()
        if data.get("description"):
            business.description = data["description"].strip()

    elif payload.step == 3:
        if "services" in data:
            knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
            if not knowledge:
                knowledge = BusinessKnowledge(business_id=business.id)
                db.add(knowledge)
            knowledge.services = data["services"]

    elif payload.step == 4:
        if "hours" in data:
            knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
            if not knowledge:
                knowledge = BusinessKnowledge(business_id=business.id)
                db.add(knowledge)
            knowledge.hours = data["hours"]

    elif payload.step == 5:
        agent = db.query(Agent).filter(Agent.business_id == business.id).first()
        if not agent:
            agent = Agent(business_id=business.id)
            db.add(agent)
        if data.get("agent_name"):
            agent.name = data["agent_name"].strip()
        if data.get("agent_role"):
            agent.role = data["agent_role"].strip()

    elif payload.step == 6:
        if data.get("owner_phone"):
            business.owner_phone = data["owner_phone"].strip()

    elif payload.step == 7:
        if data.get("customer_whatsapp"):
            business.customer_whatsapp_number = data["customer_whatsapp"].strip()
            business.phone = data["customer_whatsapp"].strip()

    db.commit()
    return {"status": "saved", "step": payload.step, "next_step": payload.step + 1}


@router.post("/onboarding/activate", response_model=BusinessOut)
@router.post("/onboarding", response_model=BusinessOut)
async def complete_onboarding(
    payload: OnboardingPayload,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validates all mandatory onboarding criteria, activates the AI employee,
    dispatches genuine WhatsApp Welcome message to the Owner phone, and sends onboarding email.
    """
    # 1. Update Core Business Information
    business.name = payload.business_name.strip()
    business.industry = payload.industry.strip()
    business.website = payload.website.strip() if payload.website else None
    
    # Store both Owner Phone and Customer WhatsApp Number
    owner_phone_val = (payload.owner_phone or payload.phone or "").strip()
    customer_phone_val = (payload.customer_whatsapp_number or payload.phone or "").strip()
    
    business.owner_phone = owner_phone_val or business.owner_phone
    business.customer_whatsapp_number = customer_phone_val or business.customer_whatsapp_number or owner_phone_val
    business.phone = customer_phone_val or owner_phone_val or business.phone
    
    business.address = payload.address.strip() if payload.address else business.address
    business.timezone = payload.timezone or business.timezone or "America/New_York"
    business.description = payload.description.strip() if payload.description else business.description
    business.onboarding_completed = True
    business.onboarding_step = 10

    # 2. Update Knowledge Base
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
    if payload.custom_knowledge:
        knowledge.custom_instructions = payload.custom_knowledge

    # 3. Update AI Agent
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(business_id=business.id)
        db.add(agent)

    agent.name = payload.agent_name.strip()
    agent.role = payload.agent_role.strip()
    agent.status = "active"

    db.commit()
    db.refresh(business)

    # 4. Dispatch Automated WhatsApp Welcome & Command Center introduction to OWNER phone
    target_owner_number = business.owner_phone or business.phone
    if target_owner_number and len(target_owner_number.strip()) >= 7:
        whatsapp = WhatsAppProvider(db=db, business_id=business.id)
        welcome_whatsapp_msg = (
            f"👋 Welcome to LeadFlow AI, {current_user.name or 'Business Owner'}!\n\n"
            f"I am {agent.name}, your new 24/7 AI employee for {business.name}.\n\n"
            f"✅ I am now actively connected and ready to respond to incoming customer inquiries, quote prices, and book appointments.\n\n"
            f"🎮 Owner WhatsApp Control Center:\n"
            f"You can control me and check business status anytime directly from this chat! Try texting:\n"
            f"• 'Show today's appointments'\n"
            f"• 'How many leads did we get today?'\n"
            f"• 'Show my latest leads'\n"
            f"• 'Pause AI' or 'Resume AI'\n\n"
            f"I'll keep you updated whenever high-value leads or bookings arrive!"
        )
        try:
            await whatsapp.send_text_message(target_owner_number, welcome_whatsapp_msg)
            logger.info(f"✓ Welcome WhatsApp message dispatched to Owner number {target_owner_number}")
        except Exception as e:
            logger.warning(f"Failed to dispatch welcome WhatsApp message: {e}")

    # 5. Dispatch Automated Welcome Email to owner
    if current_user.email:
        try:
            EmailService.send_onboarding_welcome_email(
                to_email=current_user.email,
                name=current_user.name or "Business Owner",
                business_name=business.name,
                agent_name=agent.name,
                phone_number=target_owner_number or "Your WhatsApp Number",
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
    gcal = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "google_calendar",
        Integration.status == "connected"
    ).first()

    has_business_info = bool(business.name and len(business.name.strip()) > 0)
    has_services = bool(knowledge and knowledge.services and len(knowledge.services) > 0)
    has_agent = bool(agent and agent.name and len(agent.name.strip()) > 0)
    has_hours = bool(knowledge and knowledge.hours and len(knowledge.hours) > 0)
    has_owner_wa = bool(business.owner_phone and len(business.owner_phone.strip()) >= 7)
    has_gcal = bool(gcal)

    steps = [
        {"id": "business", "label": "Business Details", "completed": has_business_info},
        {"id": "services", "label": "Services & Prices", "completed": has_services},
        {"id": "hours", "label": "Business Hours", "completed": has_hours},
        {"id": "agent", "label": "AI Employee Setup", "completed": has_agent},
        {"id": "owner_wa", "label": "Owner WhatsApp Alerts", "completed": has_owner_wa},
        {"id": "calendar", "label": "Google Calendar Sync", "completed": has_gcal},
    ]

    completed_count = sum(1 for s in steps if s["completed"])
    percentage = int((completed_count / len(steps)) * 100)

    return {
        "completed_count": completed_count,
        "total_count": len(steps),
        "percentage": percentage,
        "steps": steps,
        "is_ready_for_production": completed_count >= 5,
    }
