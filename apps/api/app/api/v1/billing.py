from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.models.models import Business, Subscription, User
from apps.api.app.schemas.schemas import (
    SubscriptionOut,
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    PortalResponse,
)
from apps.api.app.integrations.payments import get_payment_provider
from apps.api.app.core.config import settings

router = APIRouter(prefix="/billing", tags=["Billing & Subscriptions"])


@router.get("/provider-info")
def get_provider_info():
    """Returns the currently active configured payment provider and its health/configuration status."""
    provider = get_payment_provider()
    has_keys = False
    is_test = False

    if provider.provider_name == "dodo":
        has_keys = bool(
            settings.DODO_PAYMENTS_API_KEY
            and not settings.DODO_PAYMENTS_API_KEY.startswith("dodo_test_example")
        )
        is_test = (
            settings.DODO_PAYMENTS_ENVIRONMENT == "test_mode"
            or (bool(settings.DODO_PAYMENTS_API_KEY) and "test" in settings.DODO_PAYMENTS_API_KEY.lower())
        )
    else:
        has_keys = bool(
            settings.STRIPE_SECRET_KEY
            and not settings.STRIPE_SECRET_KEY.startswith("sk_test_example")
        )
        is_test = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY.startswith("sk_test"))

    tier_state = (
        "PRODUCTION CONFIGURED"
        if (has_keys and not is_test)
        else ("TEST MODE" if has_keys else "CODE IMPLEMENTED (Sandbox Simulated)")
    )

    return {
        "active_provider": provider.provider_name,
        "configured": has_keys,
        "tier_state": tier_state,
        "currency": settings.BILLING_CURRENCY,
        "trial_period_days": settings.TRIAL_PERIOD_DAYS,
        "supported_currencies": ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
        "dodo_product_starter": settings.DODO_PAYMENTS_PRODUCT_STARTER if provider.provider_name == "dodo" else None,
        "dodo_product_growth": settings.DODO_PAYMENTS_PRODUCT_GROWTH if provider.provider_name == "dodo" else None,
        "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY if provider.provider_name == "stripe" else None,
    }


@router.get("/subscription", response_model=SubscriptionOut)
def get_subscription(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    if not sub:
        now = datetime.now(timezone.utc)
        trial_days = getattr(settings, "TRIAL_PERIOD_DAYS", 7)
        sub = Subscription(
            business_id=business.id,
            provider=settings.PAYMENT_PROVIDER,
            currency=settings.BILLING_CURRENCY,
            amount=199.0,
            plan_tier="growth",
            status="active",
            trial_start=now,
            trial_end=now + timedelta(days=trial_days),
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
            messages_count=342,
            messages_limit=2500,
            leads_count=34,
            appointments_count=19,
            appointments_limit=250,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return SubscriptionOut.model_validate(sub)


@router.post("/checkout", response_model=SubscriptionCheckoutResponse)
def create_checkout(
    payload: SubscriptionCheckoutRequest,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a secure payment checkout session.
    Server validates the plan and maps it to a trusted product configuration.
    """
    provider = get_payment_provider(payload.provider)
    success_url = f"{settings.APP_URL}/dashboard/billing?status=success"
    cancel_url = f"{settings.APP_URL}/dashboard/billing?status=cancelled"

    session = provider.create_subscription_checkout(
        business_id=business.id,
        plan_tier=payload.plan_tier,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=current_user.email,
        customer_name=current_user.name,
        currency=payload.currency or settings.BILLING_CURRENCY,
    )

    # In test/simulated sandbox mode, update subscription state immediately for interactive testing
    if session.simulated:
        sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
        if not sub:
            sub = Subscription(business_id=business.id)
            db.add(sub)
        
        is_growth = payload.plan_tier.lower() == "growth"
        sub.provider = provider.provider_name
        sub.plan_tier = payload.plan_tier
        sub.status = "active"
        sub.currency = payload.currency or settings.BILLING_CURRENCY
        sub.amount = 199.0 if is_growth else 99.0
        sub.messages_limit = 2500 if is_growth else 1000
        sub.appointments_limit = 250 if is_growth else 100
        sub.provider_subscription_id = session.subscription_id or session.id
        db.commit()

    return SubscriptionCheckoutResponse(
        id=session.id,
        provider=session.provider,
        checkout_url=session.checkout_url,
        key_id=session.key_id,
        subscription_id=session.subscription_id,
        amount=session.amount,
        currency=session.currency,
        plan_tier=session.plan_tier,
        simulated=session.simulated,
    )


@router.post("/portal", response_model=PortalResponse)
def create_portal(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Generates a secure customer billing portal session."""
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    provider = get_payment_provider(sub.provider if sub else None)
    customer_id = (sub.provider_customer_id or sub.customer_id) if sub else None
    return_url = f"{settings.APP_URL}/dashboard/billing"

    portal = provider.create_portal_session(
        customer_id=customer_id or "cus_simulated",
        return_url=return_url,
    )
    return PortalResponse(
        url=portal.get("url", return_url),
        provider=provider.provider_name,
        message=portal.get("message"),
        simulated=portal.get("simulated", True),
    )


@router.post("/cancel")
def cancel_subscription(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Cancels the active subscription via the configured payment provider."""
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    provider = get_payment_provider(sub.provider)
    sub_id = sub.provider_subscription_id or sub.subscription_id
    
    if sub_id:
        provider.cancel_subscription(sub_id, cancel_at_cycle_end=True)
    
    sub.cancel_at_period_end = True
    sub.status = "cancelled"
    db.commit()

    return {
        "status": "success",
        "message": "Subscription scheduled for cancellation at the end of the billing period.",
        "plan_status": sub.status,
    }
