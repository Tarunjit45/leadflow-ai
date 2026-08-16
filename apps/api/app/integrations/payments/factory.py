import logging
from apps.api.app.integrations.payments.base import BasePaymentProvider
from apps.api.app.integrations.payments.razorpay_provider import RazorpayProvider
from apps.api.app.integrations.payments.stripe_provider import StripeProvider
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


def get_payment_provider(provider_override: str = None) -> BasePaymentProvider:
    """
    Factory that returns the configured payment provider instance.
    Defaults to Razorpay (optimal for India & International SaaS), with Stripe available as modular secondary provider.
    """
    provider_name = (provider_override or settings.PAYMENT_PROVIDER or "razorpay").lower()

    if provider_name == "stripe":
        return StripeProvider(
            secret_key=settings.STRIPE_SECRET_KEY,
            publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
            webhook_secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    
    # Default: Razorpay
    return RazorpayProvider(
        key_id=settings.RAZORPAY_KEY_ID,
        key_secret=settings.RAZORPAY_KEY_SECRET,
        webhook_secret=settings.RAZORPAY_WEBHOOK_SECRET,
    )
