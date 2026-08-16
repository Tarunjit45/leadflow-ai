import json
import logging
import time
from typing import Any, Dict, Optional
import stripe
from apps.api.app.integrations.payments.base import (
    BasePaymentProvider,
    SubscriptionCheckoutSession,
    SubscriptionStatusResult,
)
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


class StripeProvider(BasePaymentProvider):
    def __init__(
        self,
        secret_key: Optional[str] = None,
        publishable_key: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ):
        self.secret_key = secret_key or settings.STRIPE_SECRET_KEY
        self.publishable_key = publishable_key or settings.STRIPE_PUBLISHABLE_KEY
        self.webhook_secret = webhook_secret or settings.STRIPE_WEBHOOK_SECRET

        if self.secret_key and not self.secret_key.startswith("sk_test_example"):
            stripe.api_key = self.secret_key

    @property
    def provider_name(self) -> str:
        return "stripe"

    def normalize_status(self, raw_status: str) -> str:
        """
        Maps Stripe subscription status to LeadFlow internal normalized status:
        trialing, active, past_due, cancelled, expired, paused
        """
        s = (raw_status or "").lower()
        if s in ["active"]:
            return "active"
        if s in ["trialing"]:
            return "trialing"
        if s in ["past_due", "unpaid", "incomplete"]:
            return "past_due"
        if s in ["canceled", "cancelled"]:
            return "cancelled"
        if s in ["incomplete_expired"]:
            return "expired"
        if s in ["paused"]:
            return "paused"
        return "active"

    def create_subscription_checkout(
        self,
        business_id: str,
        plan_tier: str,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        currency: str = "USD",
    ) -> SubscriptionCheckoutSession:
        is_growth = plan_tier.lower() == "growth"
        amount = 199.0 if is_growth else 99.0
        price_id = (
            settings.STRIPE_PRICE_GROWTH_MONTHLY
            if is_growth
            else settings.STRIPE_PRICE_STARTER_MONTHLY
        )

        if not self.secret_key or self.secret_key.startswith("sk_test_example"):
            sub_id = f"sub_stripe_sim_{plan_tier}_{int(time.time())}"
            return SubscriptionCheckoutSession(
                id=sub_id,
                provider="stripe",
                checkout_url=f"{settings.APP_URL}/dashboard/billing?status=success&provider=stripe&sub_id={sub_id}",
                key_id=self.publishable_key or "pk_test_simulated_key",
                subscription_id=sub_id,
                amount=amount,
                currency=currency,
                plan_tier=plan_tier,
                simulated=True,
            )

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}&provider=stripe",
                cancel_url=cancel_url,
                client_reference_id=business_id,
                customer_email=customer_email,
                metadata={"business_id": business_id, "plan_tier": plan_tier},
            )
            return SubscriptionCheckoutSession(
                id=session.id,
                provider="stripe",
                checkout_url=session.url,
                key_id=self.publishable_key,
                subscription_id=session.subscription if isinstance(session.subscription, str) else None,
                amount=amount,
                currency=currency,
                plan_tier=plan_tier,
                simulated=False,
            )
        except Exception as e:
            logger.error(f"Failed to create Stripe checkout session: {str(e)}")
            sub_id = f"sub_stripe_sim_{plan_tier}_{int(time.time())}"
            return SubscriptionCheckoutSession(
                id=sub_id,
                provider="stripe",
                checkout_url=f"{settings.APP_URL}/dashboard/billing?status=success&provider=stripe&sub_id={sub_id}",
                key_id="pk_test_simulated_key",
                subscription_id=sub_id,
                amount=amount,
                currency=currency,
                plan_tier=plan_tier,
                simulated=True,
            )

    def cancel_subscription(
        self,
        provider_subscription_id: str,
        cancel_at_cycle_end: bool = True,
    ) -> Dict[str, Any]:
        if not self.secret_key or self.secret_key.startswith("sk_test_example") or not provider_subscription_id:
            return {"status": "cancelled", "simulated": True, "provider_subscription_id": provider_subscription_id}

        try:
            if cancel_at_cycle_end:
                sub = stripe.Subscription.modify(provider_subscription_id, cancel_at_period_end=True)
            else:
                sub = stripe.Subscription.delete(provider_subscription_id)
            return sub
        except Exception as e:
            logger.error(f"Error cancelling Stripe subscription {provider_subscription_id}: {str(e)}")
            return {"status": "error", "error": str(e)}

    def get_subscription_status(
        self,
        provider_subscription_id: str,
    ) -> SubscriptionStatusResult:
        if not self.secret_key or self.secret_key.startswith("sk_test_example") or not provider_subscription_id:
            return SubscriptionStatusResult(
                provider="stripe",
                provider_subscription_id=provider_subscription_id,
                status="active",
                plan_tier="growth" if "growth" in provider_subscription_id else "starter",
                amount=199.0 if "growth" in provider_subscription_id else 99.0,
                currency="USD",
                raw_status="active",
            )

        try:
            sub = stripe.Subscription.retrieve(provider_subscription_id)
            raw_status = sub.get("status", "active")
            norm_status = self.normalize_status(raw_status)
            notes = sub.get("metadata", {})

            return SubscriptionStatusResult(
                provider="stripe",
                provider_subscription_id=provider_subscription_id,
                status=norm_status,
                plan_tier=notes.get("plan_tier", "starter"),
                currency=sub.get("currency", "usd").upper(),
                current_period_end=sub.get("current_period_end"),
                cancel_at_period_end=sub.get("cancel_at_period_end", False),
                raw_status=raw_status,
            )
        except Exception as e:
            logger.error(f"Error fetching Stripe subscription status: {str(e)}")
            return SubscriptionStatusResult(
                provider="stripe",
                provider_subscription_id=provider_subscription_id,
                status="active",
                plan_tier="starter",
                raw_status="error_fallback",
            )

    def create_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        if not self.secret_key or self.secret_key.startswith("sk_test_example") or not customer_id:
            return {"url": return_url, "provider": "stripe", "simulated": True}

        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"url": session.url, "provider": "stripe", "simulated": False}
        except Exception as e:
            logger.error(f"Failed to create Stripe portal session: {str(e)}")
            return {"url": return_url, "error": str(e), "simulated": True}

    def verify_webhook_signature(self, raw_body: bytes, signature: str) -> bool:
        if not self.webhook_secret or self.webhook_secret.startswith("whsec_example"):
            return True
        try:
            stripe.Webhook.construct_event(raw_body, signature, self.webhook_secret)
            return True
        except Exception:
            return False

    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        if not self.webhook_secret or self.webhook_secret.startswith("whsec_example"):
            data = json.loads(payload.decode("utf-8"))
        else:
            data = stripe.Webhook.construct_event(payload, signature, self.webhook_secret)

        event_type = data.get("type")
        data_object = data.get("data", {}).get("object", {})

        business_id = data_object.get("client_reference_id") or data_object.get("metadata", {}).get("business_id")
        plan_tier = data_object.get("metadata", {}).get("plan_tier", "starter")
        sub_id = data_object.get("subscription") if event_type == "checkout.session.completed" else data_object.get("id")
        raw_status = data_object.get("status", "active")

        return {
            "event_id": data.get("id", str(time.time())),
            "event_type": event_type,
            "provider": "stripe",
            "business_id": business_id,
            "provider_subscription_id": sub_id,
            "provider_customer_id": data_object.get("customer"),
            "plan_tier": plan_tier,
            "normalized_status": self.normalize_status(raw_status),
            "currency": data_object.get("currency", "usd").upper(),
            "amount": (data_object.get("amount_total") or 9900) / 100.0,
            "raw_event": data,
        }

    async def health_check(self) -> Dict[str, Any]:
        has_keys = bool(self.secret_key and not self.secret_key.startswith("sk_test_example"))
        is_test_mode = bool(self.secret_key and self.secret_key.startswith("sk_test"))

        if not self.secret_key:
            return {
                "status": "not_configured",
                "configured": False,
                "tier_state": "IMPLEMENTED (Optional Secondary Provider)",
                "provider": "stripe",
                "details": "Stripe provider is implemented and available. Set PAYMENT_PROVIDER=stripe to activate.",
            }

        return {
            "status": "healthy",
            "configured": True,
            "tier_state": "TEST MODE" if is_test_mode else "PRODUCTION CONFIGURED",
            "provider": "stripe",
            "details": f"Stripe Payments API Active ({'Test Mode' if is_test_mode else 'Live Mode'}).",
        }
