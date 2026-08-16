from apps.api.app.agents.providers.base import BaseAIProvider
from apps.api.app.agents.providers.openrouter import OpenRouterProvider
from apps.api.app.core.config import settings


def get_ai_provider(provider_name: str = None) -> BaseAIProvider:
    """Factory that returns the configured AI Provider instance."""
    provider = provider_name or settings.AI_PROVIDER.lower()
    
    if provider == "openrouter":
        return OpenRouterProvider(
            api_key=settings.OPENROUTER_API_KEY,
            default_model=settings.OPENROUTER_MODEL,
            base_url=settings.OPENROUTER_BASE_URL
        )
    # Additional direct adapters can be added here without modifying agent core logic
    return OpenRouterProvider()
