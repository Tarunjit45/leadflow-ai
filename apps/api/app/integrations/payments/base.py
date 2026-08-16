from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel


class SubscriptionCheckoutSession(BaseModel):
    id: str
    provider: str
    checkout_url: Optional[str] = None
    key_id: Optional[str] = None
    subscription_id: Optional[str] = None
    amount: float = 99.0
    currency: str = "USD"
    plan_tier: str = "starter"
    simulated: bool = False


class SubscriptionStatusResult(BaseModel):
    provider: str
    provider_subscription_id: str
    status: str  # normalized: trialing, active, past_due, cancelled, expired, paused
    plan_tier: str
    currency: str = "USD"
    amount: float = 99.0
    current_period_end: Optional[int] = None
    cancel_at_period_end: bool = False
    raw_status: Optional[str] = None


class BasePaymentProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the provider name ('razorpay' or 'stripe')."""
        pass

    @abstractmethod
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
        """Initiates a subscription checkout session."""
        pass

    @abstractmethod
    def cancel_subscription(
        self,
        provider_subscription_id: str,
        cancel_at_cycle_end: bool = True,
    ) -> Dict[str, Any]:
        """Cancels an active subscription."""
        pass

    @abstractmethod
    def get_subscription_status(
        self,
        provider_subscription_id: str,
    ) -> SubscriptionStatusResult:
        """Retrieves and normalizes the subscription status."""
        pass

    @abstractmethod
    def create_portal_session(
        self,
        customer_id: str,
        return_url: str,
    ) -> Dict[str, Any]:
        """Returns a customer billing portal URL or self-service link."""
        pass

    @abstractmethod
    def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature: str,
    ) -> bool:
        """Verifies the webhook payload signature."""
        pass

    @abstractmethod
    def parse_webhook_event(
        self,
        payload: bytes,
        signature: str,
    ) -> Dict[str, Any]:
        """Parses and normalizes external webhook events."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Checks configuration validity and credentials presence."""
        pass
