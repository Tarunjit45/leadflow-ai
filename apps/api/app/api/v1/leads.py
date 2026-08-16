from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Lead
from apps.api.app.schemas.schemas import LeadOut, LeadCreate, LeadUpdate

router = APIRouter(prefix="/leads", tags=["Leads & Qualification"])


@router.get("/", response_model=List[LeadOut])
def list_leads(
    status: Optional[str] = Query(None, description="Filter by status (new, qualified, booked, won, lost)"),
    urgency: Optional[str] = Query(None, description="Filter by urgency (low, medium, high, emergency)"),
    search: Optional[str] = Query(None, description="Search name, phone, email, or service"),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    query = db.query(Lead).filter(Lead.business_id == business.id)

    if status and status != "all":
        query = query.filter(Lead.status == status)
    if urgency and urgency != "all":
        query = query.filter(Lead.urgency == urgency)
    if search:
        query = query.filter(
            (Lead.name.ilike(f"%{search}%")) |
            (Lead.phone.ilike(f"%{search}%")) |
            (Lead.email.ilike(f"%{search}%")) |
            (Lead.service.ilike(f"%{search}%"))
        )

    leads = query.order_by(Lead.created_at.desc()).all()
    return [LeadOut.model_validate(l) for l in leads]


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.business_id == business.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return LeadOut.model_validate(lead)


@router.post("/", response_model=LeadOut)
def create_lead(
    payload: LeadCreate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    lead = Lead(
        business_id=business.id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        service=payload.service,
        problem=payload.problem,
        location=payload.location,
        preferred_time=payload.preferred_time,
        intent=payload.intent or "inquiry",
        urgency=payload.urgency or "medium",
        score=payload.score or 50,
        status=payload.status or "new",
        source=payload.source or "manual",
        notes=payload.notes,
        estimated_value=business.average_job_value or 850.0,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.business_id == business.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return LeadOut.model_validate(lead)
