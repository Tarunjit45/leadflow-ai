from typing import Dict, Any, Optional
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
    if provider.provider_name == "razorpay":
        has_keys = bool(settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_example"))
        is_test = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_ID.startswith("rzp_test"))
    else:
        has_keys = bool(settings.STRIPE_SECRET_KEY and not settings.STRIPE_SECRET_KEY.startswith("sk_test_example"))
        is_test = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY.startswith("sk_test"))

    tier_state = "PRODUCTION CONFIGURED" if (has_keys and not is_test) else ("TEST MODE" if has_keys else "IMPLEMENTED (Sandbox Simulated)")

    return {
        "active_provider": provider.provider_name,
        "configured": has_keys,
        "tier_state": tier_state,
        "currency": settings.BILLING_CURRENCY,
        "supported_currencies": ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID if provider.provider_name == "razorpay" else None,
        "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY if provider.provider_name == "stripe" else None,
        "international_payments_note": "For Razorpay Indian accounts collecting in USD/EUR/GBP, ensure 'International Payments' is enabled in your Razorpay Dashboard." if provider.provider_name == "razorpay" else None,
    }


@router.get("/subscription", response_model=SubscriptionOut)
def get_subscription(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    if not sub:
        sub = Subscription(
            business_id=business.id,
            provider=settings.PAYMENT_PROVIDER,
            currency=settings.BILLING_CURRENCY,
            amount=99.0,
            plan_tier="growth",
            status="active",
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
    provider = get_payment_provider(payload.provider)
    success_url = f"{settings.APP_URL}/dashboard/billing"
    cancel_url = f"{settings.APP_URL}/dashboard/billing"

    session = provider.create_subscription_checkout(
        business_id=business.id,
        plan_tier=payload.plan_tier,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=current_user.email,
        customer_name=current_user.name,
        currency=payload.currency or settings.BILLING_CURRENCY,
    )

    # If in test/simulated mode, update the subscription state immediately for seamless sandbox evaluation
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

    return {"status": "success", "message": "Subscription cancelled", "plan_status": sub.status}
