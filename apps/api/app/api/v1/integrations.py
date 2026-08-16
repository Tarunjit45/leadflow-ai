from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Integration
from apps.api.app.schemas.schemas import IntegrationOut
from apps.api.app.integrations.google_calendar import GoogleCalendarProvider
from apps.api.app.integrations.whatsapp import WhatsAppProvider
from apps.api.app.core.encryption import encrypt_token

router = APIRouter(prefix="/integrations", tags=["Integrations Hub"])


@router.get("/", response_model=List[IntegrationOut])
def list_integrations(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    # Standard list of supported providers
    standard_providers = [
        ("whatsapp", "messaging"),
        ("google_calendar", "calendar"),
        ("google_sheets", "crm"),
        ("website_chat", "widget"),
        ("stripe", "payments"),
    ]

    results = []
    for provider, itype in standard_providers:
        integ = db.query(Integration).filter(
            Integration.business_id == business.id,
            Integration.provider == provider
        ).first()

        if not integ:
            # Default state
            integ = Integration(
                business_id=business.id,
                provider=provider,
                type=itype,
                status="connected" if provider == "website_chat" else "disconnected",
                metadata_info={"widget_code": f"<script src=\"{business.website or 'https://leadflow.ai'}/widget.js\" data-business-id=\"{business.id}\"></script>"} if provider == "website_chat" else {},
            )
            db.add(integ)
            db.commit()
            db.refresh(integ)

        results.append(integ)

    return [IntegrationOut.model_validate(i) for i in results]


@router.post("/whatsapp/connect")
def connect_whatsapp(
    payload: Dict[str, Any],
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    integ = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "whatsapp"
    ).first()
    if not integ:
        integ = Integration(business_id=business.id, provider="whatsapp", type="messaging")
        db.add(integ)

    integ.access_token_encrypted = encrypt_token(payload.get("access_token", ""))
    integ.metadata_info = {
        "phone_number_id": payload.get("phone_number_id"),
        "waba_id": payload.get("waba_id"),
        "phone_number": payload.get("phone_number", "+1 (555) 019-2834"),
    }
    integ.status = "connected"
    integ.last_sync_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(integ)
    return IntegrationOut.model_validate(integ)


@router.get("/google/oauth-url")
def get_google_oauth_url(business: Business = Depends(get_current_business)):
    gcal = GoogleCalendarProvider()
    url = gcal.get_oauth_url(state=business.id)
    return {"url": url}


@router.post("/disconnect/{provider}")
def disconnect_integration(
    provider: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    integ = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == provider
    ).first()
    if integ:
        integ.status = "disconnected"
        integ.access_token_encrypted = None
        integ.refresh_token_encrypted = None
        db.commit()
    return {"status": "disconnected", "provider": provider}
