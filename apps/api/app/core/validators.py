import re
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
GARBAGE_PATTERNS = [
    re.compile(r"^(.)\1{4,}$"),  # repeated single characters like aaaaa, 11111, -----
    re.compile(r"^(asdf|test|qwerty|12345|dummy)$", re.IGNORECASE),
]


def normalize_email(email: Optional[str]) -> str:
    if not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email address is required.",
        )
    cleaned = email.strip().lower()
    if len(cleaned) < 5 or len(cleaned) > 254 or not EMAIL_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{email}' is not a valid email address format.",
        )
    return cleaned


def validate_owner_name(name: Optional[str]) -> str:
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name is required.",
        )
    cleaned = name.strip()
    if len(cleaned) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name must be at least 2 characters long.",
        )
    if len(cleaned) > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot exceed 100 characters.",
        )
    # Check for garbage
    for pat in GARBAGE_PATTERNS:
        if pat.match(cleaned):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide a valid full name.",
            )
    return cleaned


def validate_phone_number(phone: Optional[str], field_name: str = "Phone number") -> str:
    if not phone or not phone.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is required.",
        )
    cleaned = phone.strip()
    digits = re.sub(r"[^\d]", "", cleaned)

    if len(digits) < 7:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must contain at least 7 digits.",
        )
    if len(digits) > 16:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} contains too many digits.",
        )

    # Reject obvious garbage numbers (all identical digits like 0000000, 1111111, 1234567)
    if len(set(digits)) == 1 or digits in ["1234567", "12345678", "123456789", "1234567890"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{phone}' is not a valid international phone number.",
        )

    # Standardize format with leading + if not present
    if not cleaned.startswith("+"):
        cleaned = f"+{cleaned}"

    return cleaned


def validate_business_name(name: Optional[str]) -> str:
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Business name is required.",
        )
    cleaned = name.strip()
    if len(cleaned) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Business name must be at least 2 characters.",
        )
    if len(cleaned) > 120:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Business name cannot exceed 120 characters.",
        )
    for pat in GARBAGE_PATTERNS:
        if pat.match(cleaned):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide a valid business name.",
            )
    return cleaned


def validate_services_catalog(services: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    if not services or not isinstance(services, list) or len(services) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one valid business service is required.",
        )

    seen_names = set()
    cleaned_services = []

    for idx, srv in enumerate(services):
        if not isinstance(srv, dict):
            continue
        raw_name = srv.get("name", "")
        if not raw_name or len(raw_name.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Service #{idx + 1} has an invalid or empty name.",
            )
        
        srv_name = raw_name.strip()
        normalized_name = srv_name.lower()

        # Duplicate service detection within the business
        if normalized_name in seen_names:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate service '{srv_name}' detected. Each service name must be unique.",
            )
        seen_names.add(normalized_name)

        raw_price = str(srv.get("price", "")).strip()
        if not raw_price:
            raw_price = "$80"

        duration = srv.get("duration", 60)
        try:
            duration_int = int(duration)
            if duration_int <= 0 or duration_int > 1440:
                duration_int = 60
        except Exception:
            duration_int = 60

        cleaned_services.append({
            "name": srv_name,
            "price": raw_price,
            "duration": duration_int,
            "description": srv.get("description", "Standard professional service").strip(),
        })

    return cleaned_services


def validate_business_hours_schedule(hours: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    default_schedule = {
        "monday": {"open": "08:00", "close": "18:00", "closed": False},
        "tuesday": {"open": "08:00", "close": "18:00", "closed": False},
        "wednesday": {"open": "08:00", "close": "18:00", "closed": False},
        "thursday": {"open": "08:00", "close": "18:00", "closed": False},
        "friday": {"open": "08:00", "close": "18:00", "closed": False},
        "saturday": {"open": "09:00", "close": "16:00", "closed": False},
        "sunday": {"open": "10:00", "close": "14:00", "closed": True},
    }

    if not hours or not isinstance(hours, dict):
        return default_schedule

    cleaned_hours = {}
    time_regex = re.compile(r"^\d{1,2}:\d{2}$")

    for day in valid_days:
        day_data = hours.get(day, default_schedule[day])
        if not isinstance(day_data, dict):
            cleaned_hours[day] = default_schedule[day]
            continue

        is_closed = bool(day_data.get("closed", False))
        open_time = str(day_data.get("open", "08:00")).strip()
        close_time = str(day_data.get("close", "18:00")).strip()

        if not is_closed:
            if not time_regex.match(open_time) or not time_regex.match(close_time):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid time format for {day.capitalize()}. Use HH:MM.",
                )
            if open_time >= close_time:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Opening time ({open_time}) must be earlier than closing time ({close_time}) on {day.capitalize()}.",
                )

        cleaned_hours[day] = {
            "open": open_time,
            "close": close_time,
            "closed": is_closed,
        }

    return cleaned_hours


def validate_agent_persona(
    name: Optional[str],
    role: Optional[str],
    tone: Optional[str],
    responsibilities: Optional[List[str]],
) -> Dict[str, Any]:
    if not name or len(name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI Assistant name must be at least 2 characters.",
        )
    valid_tones = ["friendly", "professional", "casual", "formal"]
    chosen_tone = tone.lower().strip() if tone else "friendly"
    if chosen_tone not in valid_tones:
        chosen_tone = "friendly"

    allowed_resp = {
        "answer_questions",
        "explain_services",
        "share_pricing",
        "collect_leads",
        "book_appointments",
        "follow_up",
    }
    cleaned_resp = [r for r in (responsibilities or []) if r in allowed_resp]
    if not cleaned_resp:
        cleaned_resp = list(allowed_resp)

    return {
        "name": name.strip(),
        "role": (role or "AI Sales & Appointment Specialist").strip(),
        "tone": chosen_tone,
        "responsibilities": cleaned_resp,
    }
