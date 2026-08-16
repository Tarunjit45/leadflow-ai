import logging
from apps.api.app.integrations.payments.base import BasePaymentProvider
from apps.api.app.integrations.payments.dodo_provider import DodoPaymentsProvider
from apps.api.app.integrations.payments.stripe_provider import StripeProvider
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


def get_payment_provider(provider_override: str = None) -> BasePaymentProvider:
    """
    Factory that returns the configured payment provider instance.
    Defaults to Dodo Payments (Primary provider for international SaaS), with Stripe available as modular secondary provider.
    """
    provider_name = (provider_override or getattr(settings, "PAYMENT_PROVIDER", "dodo") or "dodo").lower()

    if provider_name == "stripe":
        return StripeProvider(
            secret_key=settings.STRIPE_SECRET_KEY,
            publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
            webhook_secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    
    # Default: Dodo Payments
    return DodoPaymentsProvider(
        api_key=settings.DODO_PAYMENTS_API_KEY,
        webhook_key=settings.DODO_PAYMENTS_WEBHOOK_KEY,
        environment=settings.DODO_PAYMENTS_ENVIRONMENT,
    )
