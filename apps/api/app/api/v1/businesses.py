import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
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


from apps.api.app.core.validators import (
    normalize_email,
    validate_owner_name,
    validate_phone_number,
    validate_business_name,
    validate_services_catalog,
    validate_business_hours_schedule,
    validate_agent_persona,
)
from apps.api.app.schemas.schemas import OnboardingDraftPayload


@router.get("/onboarding/state")
def get_onboarding_state(
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns persistent, server-authoritative onboarding wizard progress, draft data, and validated milestones."""
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

    completed = list(business.completed_steps or [])
    # Allowed step prevents jumping ahead via URL manipulation
    max_completed = max(completed) if completed else 0
    allowed_step = max_completed + 1 if max_completed < 10 else 10
    active_step = business.onboarding_step or 1
    # If active step is higher than allowed, clamp to allowed
    effective_step = min(active_step, allowed_step)

    drafts = business.onboarding_state or {}

    return {
        "business_id": business.id,
        "onboarding_completed": business.onboarding_completed,
        "current_step": effective_step,
        "allowed_step": allowed_step,
        "completed_steps": completed,
        "onboarding_version": business.onboarding_version or 1,
        "draft_data": drafts,
        "validations": {
            "step_1_owner_info": 1 in completed or bool(current_user.name and business.owner_phone),
            "step_2_business_info": 2 in completed or bool(business.name and len(business.name.strip()) > 1),
            "step_3_services": 3 in completed or bool(knowledge and knowledge.services and len(knowledge.services) > 0),
            "step_4_hours": 4 in completed or bool(knowledge and knowledge.hours and len(knowledge.hours) > 0),
            "step_5_ai_employee": 5 in completed or bool(agent and agent.name and len(agent.name.strip()) > 0),
            "step_6_owner_whatsapp": 6 in completed or bool(business.owner_phone and len(business.owner_phone.strip()) >= 7),
            "step_7_customer_whatsapp": 7 in completed or bool((business.customer_whatsapp_number or business.phone) and len((business.customer_whatsapp_number or business.phone).strip()) >= 7),
            "step_8_calendar": bool(gcal),
            "ready_for_activation": all(s in completed for s in [1, 2, 3, 4, 5, 6, 7]),
        },
        "owner_info": {
            "name": current_user.name or drafts.get("draft_step_1", {}).get("owner_name", ""),
            "email": current_user.email,
            "owner_phone": business.owner_phone or drafts.get("draft_step_1", {}).get("owner_phone", ""),
            "timezone": business.timezone or drafts.get("draft_step_1", {}).get("timezone", "Asia/Kolkata"),
        },
        "business_info": {
            "name": business.name or drafts.get("draft_step_2", {}).get("business_name", ""),
            "industry": business.industry or drafts.get("draft_step_2", {}).get("industry", "hvac"),
            "city": business.address or drafts.get("draft_step_2", {}).get("city", ""),
            "timezone": business.timezone,
            "description": business.description or drafts.get("draft_step_2", {}).get("description", ""),
        },
        "services": knowledge.services if (knowledge and knowledge.services) else drafts.get("draft_step_3", {}).get("services", []),
        "hours": knowledge.hours if (knowledge and knowledge.hours) else drafts.get("draft_step_4", {}).get("hours", {}),
        "agent": {
            "name": agent.name if agent else drafts.get("draft_step_5", {}).get("agent_name", "LeadFlow AI Assistant"),
            "role": agent.role if agent else drafts.get("draft_step_5", {}).get("agent_role", "Sales & Appointment Specialist"),
            "tone": drafts.get("draft_step_5", {}).get("tone", "friendly"),
            "responsibilities": drafts.get("draft_step_5", {}).get("responsibilities", []),
            "status": agent.status if agent else "active",
        },
        "channels": {
            "owner_phone": business.owner_phone or drafts.get("draft_step_6", {}).get("owner_phone", ""),
            "customer_whatsapp": business.customer_whatsapp_number or business.phone or drafts.get("draft_step_7", {}).get("customer_whatsapp", ""),
            "google_calendar_connected": bool(gcal),
            "whatsapp_connected": bool(wa_integ or business.owner_phone),
        },
    }


@router.patch("/onboarding/step/{step}")
def autosave_onboarding_draft(
    step: int,
    payload: OnboardingDraftPayload,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Debounced auto-save endpoint for partial drafts. Preserves form input while user is typing."""
    if step < 1 or step > 10:
        raise HTTPException(status_code=400, detail="Invalid step index.")

    current_state = dict(business.onboarding_state or {})
    current_state[f"draft_step_{step}"] = payload.data
    business.onboarding_state = current_state
    business.onboarding_version = (business.onboarding_version or 1) + 1

    data = payload.data
    # Sync safe partial values to database
    if step == 1:
        if data.get("owner_name"):
            current_user.name = data["owner_name"].strip()
        if data.get("owner_phone"):
            business.owner_phone = data["owner_phone"].strip()
        if data.get("timezone"):
            business.timezone = data["timezone"].strip()
    elif step == 2:
        if data.get("business_name"):
            business.name = data["business_name"].strip()
        if data.get("industry"):
            business.industry = data["industry"].strip()
        if data.get("city"):
            business.address = data["city"].strip()
        if data.get("description"):
            business.description = data["description"].strip()
    elif step == 5:
        agent = db.query(Agent).filter(Agent.business_id == business.id).first()
        if not agent:
            agent = Agent(business_id=business.id)
            db.add(agent)
        if data.get("agent_name"):
            agent.name = data["agent_name"].strip()
        if data.get("agent_role"):
            agent.role = data["agent_role"].strip()

    db.commit()
    return {
        "success": True,
        "step": step,
        "version": business.onboarding_version,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/onboarding/step/{step}/complete")
@router.post("/onboarding/step")
def complete_onboarding_step(
    step: int = 1,
    payload: Optional[OnboardingStepPayload] = None,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Strictly validates step data, commits changes to the database,
    marks step as completed, and increments the active onboarding step.
    """
    target_step = payload.step if payload and payload.step else step
    data = payload.data if payload else {}

    # Strict Per-Step Validation
    if target_step == 1:
        valid_name = validate_owner_name(data.get("owner_name") or current_user.name)
        valid_phone = validate_phone_number(data.get("owner_phone") or business.owner_phone, "Owner WhatsApp Number")
        current_user.name = valid_name
        business.owner_phone = valid_phone
        if data.get("timezone"):
            business.timezone = data["timezone"].strip()

    elif target_step == 2:
        valid_biz_name = validate_business_name(data.get("business_name") or business.name)
        business.name = valid_biz_name
        if data.get("industry"):
            business.industry = data["industry"].strip()
        if data.get("city"):
            business.address = data["city"].strip()
        if data.get("description"):
            business.description = data["description"].strip()

    elif target_step == 3:
        valid_services = validate_services_catalog(data.get("services"))
        knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
        if not knowledge:
            knowledge = BusinessKnowledge(business_id=business.id)
            db.add(knowledge)
        knowledge.services = valid_services

    elif target_step == 4:
        valid_hours = validate_business_hours_schedule(data.get("hours"))
        knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
        if not knowledge:
            knowledge = BusinessKnowledge(business_id=business.id)
            db.add(knowledge)
        knowledge.hours = valid_hours

    elif target_step == 5:
        persona = validate_agent_persona(
            name=data.get("agent_name"),
            role=data.get("agent_role"),
            tone=data.get("tone"),
            responsibilities=data.get("responsibilities"),
        )
        agent = db.query(Agent).filter(Agent.business_id == business.id).first()
        if not agent:
            agent = Agent(business_id=business.id)
            db.add(agent)
        agent.name = persona["name"]
        agent.role = persona["role"]

    elif target_step == 6:
        valid_owner_phone = validate_phone_number(data.get("owner_phone") or business.owner_phone, "Owner WhatsApp Number")
        business.owner_phone = valid_owner_phone

    elif target_step == 7:
        valid_customer_phone = validate_phone_number(data.get("customer_whatsapp") or business.customer_whatsapp_number or business.phone, "Customer WhatsApp Number")
        
        # Check duplicate WhatsApp connection across active businesses
        existing_other = (
            db.query(Business)
            .filter(
                Business.id != business.id,
                Business.onboarding_completed == True,
                (Business.customer_whatsapp_number == valid_customer_phone) | (Business.phone == valid_customer_phone),
            )
            .first()
        )
        if existing_other:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"This WhatsApp number ({valid_customer_phone}) is already connected to another business workspace.",
            )

        business.customer_whatsapp_number = valid_customer_phone
        business.phone = valid_customer_phone

    # Record step completion
    completed = set(business.completed_steps or [])
    completed.add(target_step)
    business.completed_steps = sorted(list(completed))

    # Update draft state
    current_state = dict(business.onboarding_state or {})
    current_state[f"step_{target_step}"] = data
    business.onboarding_state = current_state

    # Advance current step
    business.onboarding_step = max(business.onboarding_step or 1, target_step + 1)
    business.onboarding_version = (business.onboarding_version or 1) + 1

    db.commit()
    db.refresh(business)

    return {
        "success": True,
        "step": target_step,
        "next_step": target_step + 1,
        "completed_steps": business.completed_steps,
        "onboarding_version": business.onboarding_version,
    }


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
    # 1. Update and validate Core Business Information
    business.name = validate_business_name(payload.business_name)
    business.industry = payload.industry.strip()
    business.website = payload.website.strip() if payload.website else None
    
    # Validate Phone Numbers
    owner_phone_val = validate_phone_number(payload.owner_phone or business.owner_phone or payload.phone, "Owner WhatsApp Number")
    customer_phone_val = validate_phone_number(payload.customer_whatsapp_number or business.customer_whatsapp_number or payload.phone, "Customer WhatsApp Number")

    # Check WhatsApp duplication
    dup = (
        db.query(Business)
        .filter(
            Business.id != business.id,
            Business.onboarding_completed == True,
            (Business.customer_whatsapp_number == customer_phone_val) | (Business.phone == customer_phone_val),
        )
        .first()
    )
    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The customer WhatsApp number {customer_phone_val} is already connected to another business.",
        )
    
    business.owner_phone = owner_phone_val
    business.customer_whatsapp_number = customer_phone_val
    business.phone = customer_phone_val
    
    business.address = payload.address.strip() if payload.address else (business.address or "Local Service Area")
    business.timezone = payload.timezone or business.timezone or "America/New_York"
    business.description = payload.description.strip() if payload.description else business.description
    business.onboarding_completed = True
    business.onboarding_step = 10
    business.completed_steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    business.onboarding_version = (business.onboarding_version or 1) + 1

    # 2. Update Knowledge Base
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(business_id=business.id)
        db.add(knowledge)

    if payload.services:
        knowledge.services = validate_services_catalog(payload.services)
    if payload.hours:
        knowledge.hours = validate_business_hours_schedule(payload.hours)
    if payload.service_areas:
        knowledge.service_areas = payload.service_areas
    if payload.custom_knowledge:
        knowledge.custom_instructions = payload.custom_knowledge

    # 3. Update AI Agent
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(business_id=business.id)
        db.add(agent)

    persona = validate_agent_persona(
        name=payload.agent_name,
        role=payload.agent_role,
        tone=payload.agent_tone,
        responsibilities=payload.agent_responsibilities,
    )
    agent.name = persona["name"]
    agent.role = persona["role"]
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
