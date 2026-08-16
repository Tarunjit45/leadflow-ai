from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.models.models import Business, BusinessKnowledge, Agent, User
from apps.api.app.schemas.schemas import BusinessOut, BusinessUpdate, OnboardingPayload

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
def complete_onboarding(
    payload: OnboardingPayload,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Processes the full multi-step onboarding wizard in a single atomic operation."""
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
    return BusinessOut.model_validate(business)
