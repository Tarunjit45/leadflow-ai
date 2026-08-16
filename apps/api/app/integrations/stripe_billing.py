import logging
from typing import Any, Dict, Optional
import stripe
from apps.api.app.integrations.base import BaseIntegrationProvider
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


class StripeBillingProvider(BaseIntegrationProvider):
    def __init__(self):
        if settings.STRIPE_SECRET_KEY and not settings.STRIPE_SECRET_KEY.startswith("sk_test_example"):
            stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_checkout_session(
        self,
        business_id: str,
        plan_tier: str,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a Stripe Checkout Session for subscription."""
        price_id = (
            settings.STRIPE_PRICE_GROWTH_MONTHLY
            if plan_tier.lower() == "growth"
            else settings.STRIPE_PRICE_STARTER_MONTHLY
        )

        if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.startswith("sk_test_example"):
            # Return demo/simulated checkout URL
            return {
                "id": f"cs_simulated_{plan_tier}_{int(stripe.util.io if hasattr(stripe, 'util') else 12345)}",
                "url": f"{settings.APP_URL}/dashboard/billing?status=success&session_id=cs_simulated_{plan_tier}",
                "simulated": True,
            }

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=cancel_url,
                client_reference_id=business_id,
                customer_email=customer_email,
                metadata={"business_id": business_id, "plan_tier": plan_tier},
            )
            return {"id": session.id, "url": session.url, "simulated": False}
        except Exception as e:
            logger.error(f"Failed to create Stripe checkout session: {str(e)}")
            raise e

    def create_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Creates a Stripe Customer Portal session for managing billing."""
        if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.startswith("sk_test_example") or not customer_id:
            return {"url": f"{settings.APP_URL}/dashboard/billing", "simulated": True}

        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"url": session.url, "simulated": False}
        except Exception as e:
            logger.error(f"Failed to create customer portal session: {str(e)}")
            return {"url": return_url, "error": str(e)}

    def construct_webhook_event(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Verifies and constructs a Stripe Webhook event."""
        if not settings.STRIPE_WEBHOOK_SECRET or settings.STRIPE_WEBHOOK_SECRET.startswith("whsec_example"):
            import json
            return json.loads(payload.decode("utf-8"))

        return stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        return await self.health_check()

    async def disconnect(self) -> bool:
        return True

    async def health_check(self) -> Dict[str, Any]:
        if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.startswith("sk_test_example"):
            return {"status": "not_configured", "configured": False}
        return {"status": "healthy", "configured": True}


stripe_billing = StripeBillingProvider()
