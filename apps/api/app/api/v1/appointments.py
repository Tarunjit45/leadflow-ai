from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    db: Session = Depends(get_db),
):
    """Calculates open appointment slots by dynamically filtering out confirmed bookings."""
    now = datetime.now(timezone.utc)
    
    # Query all active confirmed appointments for this business in the window
    window_end = now + timedelta(days=days_ahead + 1)
    confirmed_appts = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business.id,
            Appointment.status == "confirmed",
            Appointment.start_time >= now,
            Appointment.start_time <= window_end,
        )
        .all()
    )

    slots = []
    for i in range(1, days_ahead + 1):
        day = now + timedelta(days=i)
        for hour in [9, 11, 14, 16]:
            s_time = day.replace(hour=hour, minute=0, second=0, microsecond=0)
            e_time = day.replace(hour=hour+1, minute=0, second=0, microsecond=0)
            
            # Check if this slot conflicts with any existing confirmed appointment
            is_occupied = False
            for appt in confirmed_appts:
                # Overlap condition: slot_start < appt_end AND slot_end > appt_start
                appt_s = appt.start_time.replace(tzinfo=timezone.utc) if appt.start_time.tzinfo is None else appt.start_time
                appt_e = appt.end_time.replace(tzinfo=timezone.utc) if appt.end_time.tzinfo is None else appt.end_time
                if s_time < appt_e and e_time > appt_s:
                    is_occupied = True
                    break
            
            if not is_occupied:
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
    """Creates a new appointment with concurrency-safe slot overlap checking."""
    if payload.start_time >= payload.end_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment end time must be after start time.",
        )

    # Concurrency-safe overlap check: (start_time < existing.end_time AND end_time > existing.start_time)
    conflicting_query = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business.id,
            Appointment.status == "confirmed",
            Appointment.start_time < payload.end_time,
            Appointment.end_time > payload.start_time,
        )
    )

    try:
        conflict = conflicting_query.with_for_update().first()
    except Exception:
        conflict = conflicting_query.first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment time slot is already booked. Please choose an alternative slot.",
        )

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
        lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.business_id == business.id).first()
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

    # If rescheduling, verify no overlap with other appointments
    if payload.start_time or payload.end_time:
        new_start = appt.start_time
        new_end = appt.end_time
        conflict = db.query(Appointment).filter(
            Appointment.business_id == business.id,
            Appointment.id != appointment_id,
            Appointment.status == "confirmed",
            Appointment.start_time < new_end,
            Appointment.end_time > new_start,
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The requested rescheduled slot conflicts with an existing booking.",
            )

    db.commit()
    db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.business_id == business.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appt.status = "cancelled"
    db.commit()
    return {"status": "success", "message": "Appointment cancelled successfully."}
