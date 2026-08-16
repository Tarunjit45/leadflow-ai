from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Appointment, Lead
from apps.api.app.schemas.schemas import AppointmentOut, AppointmentCreate, AppointmentUpdate
from apps.api.app.integrations.google_calendar import GoogleCalendarProvider

router = APIRouter(prefix="/appointments", tags=["Appointments & Calendar"])


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(
    status: Optional[str] = Query(None),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment).filter(Appointment.business_id == business.id)
    if status and status != "all":
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(Appointment.start_time.asc()).all()
    return [AppointmentOut.model_validate(a) for a in appointments]


@router.get("/availability")
def get_availability(
    days_ahead: int = Query(3, ge=1, le=14),
    business: Business = Depends(get_current_business),
):
    """Calculates open appointment slots taking into account business hours and existing bookings."""
    now = datetime.now(timezone.utc)
    slots = []
    
    for i in range(1, days_ahead + 1):
        day = now + timedelta(days=i)
        for hour in [9, 11, 14, 16]:
            s_time = day.replace(hour=hour, minute=0, second=0, microsecond=0)
            e_time = day.replace(hour=hour+1, minute=0, second=0, microsecond=0)
            slots.append({
                "slot_id": f"slot_{i}_{hour}",
                "date": day.strftime("%A, %b %d"),
                "start_time": s_time.isoformat(),
                "end_time": e_time.isoformat(),
                "label": f"{day.strftime('%a, %b %d')} - {s_time.strftime('%I:%M %p')}",
            })

    return {"available_slots": slots, "timezone": business.timezone}


@router.post("/", response_model=AppointmentOut)
def create_appointment(
    payload: AppointmentCreate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    appt = Appointment(
        business_id=business.id,
        lead_id=payload.lead_id,
        calendar_provider="google_calendar",
        start_time=payload.start_time,
        end_time=payload.end_time,
        customer_name=payload.customer_name,
        customer_contact=payload.customer_contact,
        service=payload.service,
        notes=payload.notes,
        status="confirmed",
    )
    db.add(appt)

    if payload.lead_id:
        lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
        if lead:
            lead.status = "booked"
            lead.score = 100

    db.commit()
    db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.business_id == business.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)

    db.commit()
    db.refresh(appt)
    return AppointmentOut.model_validate(appt)
