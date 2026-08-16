from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.models.models import Business, Subscription, User
from apps.api.app.schemas.schemas import SubscriptionOut
from apps.api.app.integrations.stripe_billing import stripe_billing
from apps.api.app.core.config import settings

router = APIRouter(prefix="/billing", tags=["Billing & Subscriptions"])


@router.get("/subscription", response_model=SubscriptionOut)
def get_subscription(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    if not sub:
        sub = Subscription(
            business_id=business.id,
            plan_tier="trial",
            status="trialing",
            messages_count=18,
            messages_limit=500,
            leads_count=8,
            appointments_count=3,
            appointments_limit=50,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return SubscriptionOut.model_validate(sub)


@router.post("/checkout")
def create_checkout(
    payload: Dict[str, str],
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
):
    plan_tier = payload.get("plan_tier", "starter")
    success_url = f"{settings.APP_URL}/dashboard/billing"
    cancel_url = f"{settings.APP_URL}/dashboard/billing"

    session = stripe_billing.create_checkout_session(
        business_id=business.id,
        plan_tier=plan_tier,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=current_user.email,
    )
    return session


@router.post("/portal")
def create_portal(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    customer_id = sub.customer_id if sub else None
    return_url = f"{settings.APP_URL}/dashboard/billing"

    portal = stripe_billing.create_portal_session(
        customer_id=customer_id or "cus_simulated",
        return_url=return_url,
    )
    return portal
