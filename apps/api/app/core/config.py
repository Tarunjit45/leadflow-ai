import os
from typing import List, Optional
from pydantic_settings import BaseSettings

DEFAULT_DB_URL = "sqlite:///./leadflow_local.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "LeadFlow AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # App & API Base URLs
    APP_URL: str = (
        os.getenv("APP_URL")
        or os.getenv("NEXT_PUBLIC_APP_URL")
        or "http://localhost:3000"
    )
    API_URL: str = (
        os.getenv("API_URL")
        or os.getenv("RENDER_EXTERNAL_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "https://leadflow-api-l23m.onrender.com"
    )

    # Dynamic CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://*.vercel.app",
        "https://*.onrender.com",
        "https://*.up.railway.app",
        "*"
    ]

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "leadflow-super-secure-master-secret-key-32-chars-minimum-prod")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "dGhpcy1pcy1hLXNlY3VyZS0zMi1ieXRlLWtleS1leGFtcGxlIQ==")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database (PostgreSQL if set, SQLite fallback)
    DATABASE_URL: str = (
        os.getenv("DATABASE_URL")
        or DEFAULT_DB_URL
    )
    
    # Redis Queue
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # AI Configuration (Default: OpenRouter)
    AI_PROVIDER: str = "openrouter"
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    AI_FALLBACK_MODEL: str = "anthropic/claude-3-haiku"

    # Google Integrations (OAuth & Calendar & Sheets)
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = (
        os.getenv("GOOGLE_REDIRECT_URI")
        or f"{os.getenv('API_URL', 'http://localhost:8000').rstrip('/')}/api/v1/integrations/google/callback"
    )

    # Meta WhatsApp Cloud API
    META_APP_ID: Optional[str] = os.getenv("META_APP_ID")
    META_APP_SECRET: Optional[str] = os.getenv("META_APP_SECRET")
    META_VERIFY_TOKEN: str = os.getenv("META_VERIFY_TOKEN", "leadflow_whatsapp_webhook_verification_token_secret")
    META_ACCESS_TOKEN: Optional[str] = os.getenv("META_ACCESS_TOKEN")
    META_PHONE_NUMBER_ID: Optional[str] = os.getenv("META_PHONE_NUMBER_ID", "1265571813306233")
    META_WABA_ID: Optional[str] = os.getenv("META_WABA_ID")

    # Payment Provider Abstraction (Dodo Payments)
    PAYMENT_PROVIDER: str = "dodo"
    BILLING_CURRENCY: str = "USD"
    TRIAL_PERIOD_DAYS: int = 7
    BILLING_GRACE_PERIOD_DAYS: int = 3

    DODO_PAYMENTS_API_KEY: Optional[str] = os.getenv("DODO_PAYMENTS_API_KEY")
    DODO_PAYMENTS_WEBHOOK_KEY: Optional[str] = os.getenv("DODO_PAYMENTS_WEBHOOK_KEY")
    DODO_PAYMENTS_ENVIRONMENT: str = "test_mode"
    DODO_PAYMENTS_PRODUCT_STARTER: str = "pdt_0NlXRdRfqoWT5NiJJsyHG"
    DODO_PAYMENTS_PRODUCT_GROWTH: str = "pdt_0NlXRdVCxD37AFYVg8DM7"

    # Stripe Provider Configuration (Optional)
    STRIPE_SECRET_KEY: Optional[str] = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: Optional[str] = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_PRICE_STARTER_MONTHLY: str = "price_starter_monthly_99"
    STRIPE_PRICE_GROWTH_MONTHLY: str = "price_growth_monthly_199"

    # Production Mode (Demo mode strictly disabled)
    ENABLE_DEMO_MODE: bool = False
    DEMO_BUSINESS_ID: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
