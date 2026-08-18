from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Integration, Agent
from apps.api.app.schemas.schemas import IntegrationOut
from apps.api.app.integrations.google_calendar import GoogleCalendarProvider
from apps.api.app.integrations.whatsapp import WhatsAppProvider
from apps.api.app.core.encryption import encrypt_token

router = APIRouter(prefix="/integrations", tags=["Integrations Hub"])


@router.get("/", response_model=List[IntegrationOut])
def list_integrations(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
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
            integ = Integration(
                business_id=business.id,
                provider=provider,
                type=itype,
                status="connected" if provider in ["website_chat", "whatsapp"] else "disconnected",
                metadata_info={
                    "phone_number": business.phone or "+91 9876543210",
                    "webhook_url": f"{settings.API_URL.rstrip('/')}/api/v1/webhooks/whatsapp",
                    "verify_token": settings.META_VERIFY_TOKEN,
                } if provider == "whatsapp" else {
                    "widget_code": f"<script src=\"{settings.API_URL.rstrip('/')}/api/v1/widget/embed.js\" data-business-id=\"{business.id}\"></script>"
                } if provider == "website_chat" else {},
            )
            db.add(integ)
            db.commit()
            db.refresh(integ)

        results.append(integ)

    return [IntegrationOut.model_validate(i) for i in results]


@router.get("/whatsapp/status")
async def get_whatsapp_status(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Returns honest, diagnostic status of WhatsApp business registration and Meta Cloud API connectivity."""
    provider = WhatsAppProvider(db=db, business_id=business.id)
    health = await provider.health_check()
    is_live = provider.is_meta_api_configured()

    return {
        "registered_phone": business.phone or "Not configured",
        "is_registered_in_leadflow": bool(business.phone),
        "is_meta_cloud_api_live": is_live,
        "webhook_url": f"{settings.API_URL.rstrip('/')}/api/v1/webhooks/whatsapp",
        "webhook_verify_token": settings.META_VERIFY_TOKEN,
        "mode": "Live Meta Cloud API" if is_live else "LeadFlow Ready / Simulation Mode",
        "health": health,
    }


@router.post("/whatsapp/connect")
async def connect_whatsapp(
    payload: Dict[str, Any],
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Registers the real WhatsApp business number and optionally attaches custom Meta Cloud API credentials."""
    phone_number = payload.get("phone_number")
    if phone_number:
        business.phone = phone_number.strip()
        db.commit()

    integ = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "whatsapp"
    ).first()
    if not integ:
        integ = Integration(business_id=business.id, provider="whatsapp", type="messaging")
        db.add(integ)

    access_token = payload.get("access_token")
    phone_number_id = payload.get("phone_number_id")

    if access_token and not access_token.startswith("meta_cloud_verified"):
        integ.access_token_encrypted = encrypt_token(access_token)

    current_meta = integ.metadata_info or {}
    current_meta.update({
        "phone_number": business.phone,
        "phone_number_id": phone_number_id or current_meta.get("phone_number_id"),
        "waba_id": payload.get("waba_id") or current_meta.get("waba_id"),
        "webhook_url": f"{settings.API_URL.rstrip('/')}/api/v1/webhooks/whatsapp",
    })
    integ.metadata_info = current_meta
    integ.status = "connected"
    integ.last_sync_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(integ)

    # Test health
    provider = WhatsAppProvider(db=db, business_id=business.id)
    is_live = provider.is_meta_api_configured()

    return {
        "status": "connected",
        "registered_phone": business.phone,
        "is_meta_cloud_api_live": is_live,
        "message": "WhatsApp number registered in LeadFlow database." if not is_live else "Meta Cloud API credentials verified and live!",
    }


@router.post("/whatsapp/test-ping")
async def test_whatsapp_ping(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Sends a real test message to the registered business WhatsApp number."""
    if not business.phone:
        raise HTTPException(status_code=400, detail="No WhatsApp number registered for this business.")

    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    agent_name = agent.name if agent else "LeadFlow AI"

    provider = WhatsAppProvider(db=db, business_id=business.id)
    ping_text = (
        f"🔔 Test Ping from LeadFlow AI!\n\n"
        f"Hi! This is a test message from '{agent_name}' to confirm your WhatsApp connection for '{business.name}'.\n\n"
        f"Your AI employee is active and ready to handle customer inquiries."
    )

    result = await provider.send_text_message(business.phone, ping_text)
    return {
        "success": result.get("success", False),
        "recipient": business.phone,
        "is_meta_live": provider.is_meta_api_configured(),
        "delivery_result": result,
    }


@router.get("/google/oauth-url")
def get_google_oauth_url(business: Business = Depends(get_current_business)):
    gcal = GoogleCalendarProvider()
    url = gcal.get_oauth_url(state=business.id)
    return {"url": url}


@router.get("/google/callback")
async def google_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Handles Google OAuth authorization code redirect and stores tokens for the business."""
    from fastapi.responses import RedirectResponse
    
    redirect_target = f"{settings.APP_URL}/dashboard/settings?tab=channels"
    
    if error or not code or not state:
        logger.warning(f"Google OAuth failed or cancelled: error={error}")
        return RedirectResponse(url=f"{redirect_target}&calendar_error=true")

    business_id = state.strip()
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        logger.error(f"Business '{business_id}' from Google OAuth state not found.")
        return RedirectResponse(url=f"{redirect_target}&calendar_error=not_found")

    try:
        gcal = GoogleCalendarProvider()
        tokens = await gcal.exchange_code_for_tokens(code)
        
        integ = db.query(Integration).filter(
            Integration.business_id == business.id,
            Integration.provider == "google_calendar"
        ).first()
        if not integ:
            integ = Integration(
                business_id=business.id,
                provider="google_calendar",
                type="calendar"
            )
            db.add(integ)

        if tokens.get("access_token"):
            integ.access_token_encrypted = encrypt_token(tokens["access_token"])
        if tokens.get("refresh_token"):
            integ.refresh_token_encrypted = encrypt_token(tokens["refresh_token"])
        
        integ.status = "connected"
        integ.last_sync_at = datetime.now(timezone.utc)
        integ.metadata_info = {"calendar_id": "primary", "scope": tokens.get("scope", "")}
        db.commit()
        
        logger.info(f"✓ Google Calendar connected for business {business.name} ({business.id})")
        return RedirectResponse(url=f"{redirect_target}&calendar_connected=true")
    except Exception as e:
        logger.error(f"Failed to exchange Google OAuth code: {e}")
        return RedirectResponse(url=f"{redirect_target}&calendar_error=exchange_failed")


@router.get("/google/status")
def get_google_status(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    integ = db.query(Integration).filter(
        Integration.business_id == business.id,
        Integration.provider == "google_calendar"
    ).first()
    is_connected = bool(integ and integ.status == "connected" and integ.access_token_encrypted)
    return {
        "provider": "google_calendar",
        "status": "connected" if is_connected else "disconnected",
        "calendar_id": integ.metadata_info.get("calendar_id", "primary") if integ and integ.metadata_info else "primary",
        "last_sync_at": integ.last_sync_at.isoformat() if integ and integ.last_sync_at else None,
    }


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
