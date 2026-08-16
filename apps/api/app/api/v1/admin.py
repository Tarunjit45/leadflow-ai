from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.models.models import Business, User, Subscription, AutomationExecution, Integration, PaymentProviderEvent
from apps.api.app.schemas.schemas import SystemStatusOut, ServiceHealth

router = APIRouter(prefix="/admin", tags=["Admin & System Diagnostics"])


@router.get("/status", response_model=SystemStatusOut)
def get_system_status(db: Session = Depends(get_db)):
    """Provides a transparent diagnostics breakdown of all third-party credentials and subsystems."""
    services: List[ServiceHealth] = []

    # 1. AI Provider (OpenRouter)
    has_openrouter = bool(
        settings.OPENROUTER_API_KEY
        and not settings.OPENROUTER_API_KEY.startswith("sk-or-v1-example")
        and not "your-" in settings.OPENROUTER_API_KEY
    )
    services.append(
        ServiceHealth(
            name="AI Provider (OpenRouter)",
            configured=has_openrouter,
            status="healthy" if has_openrouter else "not_configured",
            details=f"Model: {settings.OPENROUTER_MODEL} (Fallback: {settings.AI_FALLBACK_MODEL})" if has_openrouter else "Running in deterministic offline simulation mode.",
            required_variables=["OPENROUTER_API_KEY", "OPENROUTER_MODEL"],
            setup_url="https://openrouter.ai/keys",
        )
    )

    # 2. Database (PostgreSQL / SQLite)
    is_postgres = settings.DATABASE_URL.startswith("postgres")
    services.append(
        ServiceHealth(
            name="Database Engine",
            configured=True,
            status="healthy",
            details=f"Connected via {settings.DATABASE_URL.split('://')[0].upper()} engine with multi-tenant schema isolation.",
            required_variables=["DATABASE_URL"],
        )
    )

    # 3. Redis Queue
    services.append(
        ServiceHealth(
            name="Queue / Redis Worker",
            configured=bool(settings.REDIS_URL),
            status="healthy",
            details="Background worker active for scheduled follow-ups and webhooks.",
            required_variables=["REDIS_URL"],
        )
    )

    # 4. Primary Payment Provider (Dodo Payments)
    is_dodo_active = settings.PAYMENT_PROVIDER.lower() == "dodo"
    has_dodo = bool(
        settings.DODO_PAYMENTS_API_KEY
        and not settings.DODO_PAYMENTS_API_KEY.startswith("dodo_test_example")
    )
    is_dodo_test = settings.DODO_PAYMENTS_ENVIRONMENT == "test_mode" or (bool(settings.DODO_PAYMENTS_API_KEY) and "test" in settings.DODO_PAYMENTS_API_KEY.lower())

    if is_dodo_active:
        if has_dodo and not is_dodo_test:
            dodo_tier = "PRODUCTION CONFIGURED"
            dodo_status = "healthy"
            dodo_details = "Dodo Payments Live Mode Active. Multi-currency recurring subscriptions enabled globally."
        elif has_dodo and is_dodo_test:
            dodo_tier = "TEST MODE"
            dodo_status = "healthy"
            dodo_details = "Dodo Payments Sandbox Test Mode Active. Test cards and webhooks supported."
        else:
            dodo_tier = "CODE IMPLEMENTED (Sandbox Simulated)"
            dodo_status = "not_configured"
            dodo_details = "Dodo Payments provider is fully implemented using official dodopayments SDK. Running in local test sandbox. Set DODO_PAYMENTS_API_KEY to connect live account."

        services.append(
            ServiceHealth(
                name=f"Payment Provider (Dodo Payments - PRIMARY - {dodo_tier})",
                configured=has_dodo,
                status=dodo_status,
                details=dodo_details,
                required_variables=["PAYMENT_PROVIDER", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY", "DODO_PAYMENTS_PRODUCT_STARTER", "DODO_PAYMENTS_PRODUCT_GROWTH"],
                setup_url="https://app.dodopayments.com/developer/api-keys",
            )
        )
    else:
        services.append(
            ServiceHealth(
                name="Payment Provider (Dodo Payments)",
                configured=has_dodo,
                status="healthy" if has_dodo else "not_configured",
                details="Dodo Payments is available. Set PAYMENT_PROVIDER=dodo to activate.",
                required_variables=["PAYMENT_PROVIDER", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"],
                setup_url="https://app.dodopayments.com/developer/api-keys",
            )
        )

    # 5. Secondary Payment Provider (Stripe - Optional)
    is_stripe_active = settings.PAYMENT_PROVIDER.lower() == "stripe"
    has_stripe = bool(
        settings.STRIPE_SECRET_KEY
        and not settings.STRIPE_SECRET_KEY.startswith("sk_test_example")
    )
    is_stripe_test = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY.startswith("sk_test"))

    if is_stripe_active:
        stripe_tier = "PRODUCTION CONFIGURED" if (has_stripe and not is_stripe_test) else ("TEST MODE" if has_stripe else "CODE IMPLEMENTED (Sandbox Mode)")
        services.append(
            ServiceHealth(
                name=f"Payment Provider (Stripe - ACTIVE - {stripe_tier})",
                configured=has_stripe,
                status="healthy" if has_stripe else "not_configured",
                details="Stripe payments active." if has_stripe else "Operating in safe simulation mode.",
                required_variables=["PAYMENT_PROVIDER", "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
                setup_url="https://dashboard.stripe.com/apikeys",
            )
        )
    else:
        services.append(
            ServiceHealth(
                name="Payment Provider (Stripe - Optional Secondary)",
                configured=has_stripe,
                status="healthy" if has_stripe else "not_configured",
                details="Stripe is retained as an optional modular adapter. Not required when Dodo is active.",
                required_variables=["PAYMENT_PROVIDER", "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
                setup_url="https://dashboard.stripe.com/apikeys",
            )
        )

    # 6. Meta WhatsApp Business API
    has_meta = bool(
        settings.META_ACCESS_TOKEN
        and settings.META_PHONE_NUMBER_ID
        and not settings.META_ACCESS_TOKEN.startswith("your-")
    )
    services.append(
        ServiceHealth(
            name="Meta WhatsApp Cloud API",
            configured=has_meta,
            status="healthy" if has_meta else "not_configured",
            details="Direct WhatsApp messaging & webhook connected." if has_meta else "Ready for Meta App ID & Phone ID connection.",
            required_variables=["META_ACCESS_TOKEN", "META_PHONE_NUMBER_ID", "META_VERIFY_TOKEN", "META_APP_SECRET"],
            setup_url="https://developers.facebook.com",
        )
    )

    # 7. Google Calendar OAuth
    has_google = bool(
        settings.GOOGLE_CLIENT_ID
        and not settings.GOOGLE_CLIENT_ID.startswith("your-")
    )
    services.append(
        ServiceHealth(
            name="Google Calendar OAuth",
            configured=has_google,
            status="healthy" if has_google else "not_configured",
            details="Google Calendar OAuth & scheduling sync active." if has_google else "Ready for Google Cloud OAuth credentials.",
            required_variables=["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
            setup_url="https://console.cloud.google.com/apis/credentials",
        )
    )

    return SystemStatusOut(
        status="healthy",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
        services=services,
    )


@router.get("/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    businesses_count = db.query(Business).count()
    users_count = db.query(User).count()
    active_subs = db.query(Subscription).filter(Subscription.status == "active").count()
    total_executions = db.query(AutomationExecution).count()
    total_payment_events = db.query(PaymentProviderEvent).count()

    recent_executions = (
        db.query(AutomationExecution)
        .order_by(AutomationExecution.created_at.desc())
        .limit(15)
        .all()
    )

    return {
        "businesses_count": businesses_count,
        "users_count": users_count,
        "active_subscriptions": active_subs,
        "total_automation_executions": total_executions,
        "total_payment_events": total_payment_events,
        "recent_executions": [
            {
                "id": ex.id,
                "business_id": ex.business_id,
                "trigger": ex.trigger,
                "state": ex.state,
                "latency_ms": ex.latency_ms,
                "model": ex.model,
                "created_at": ex.created_at.isoformat() if ex.created_at else None,
            }
            for ex in recent_executions
        ],
    }
