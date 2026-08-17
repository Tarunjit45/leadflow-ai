import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "LeadFlow AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # App & CORS
    APP_URL: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Security & JWT
    SECRET_KEY: str = "leadflow-super-secure-master-secret-key-32-chars-minimum-prod"
    ENCRYPTION_KEY: str = "dGhpcy1pcy1hLXNlY3VyZS0zMi1ieXRlLWtleS1leGFtcGxlIQ=="
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database (PostgreSQL in production / SQLite local fallback)
    DATABASE_URL: str = (
        "sqlite:////tmp/leadflow_local.db"
        if os.getenv("VERCEL")
        else "sqlite:///./leadflow_local.db"
    )
    
    # Redis Queue
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Configuration (Default: OpenRouter)
    AI_PROVIDER: str = "openrouter"
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-001"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    AI_FALLBACK_MODEL: str = "anthropic/claude-3.5-haiku"

    # Google Integrations (OAuth & Calendar & Sheets)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/google/callback"

    # Meta WhatsApp Cloud API
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_VERIFY_TOKEN: str = "leadflow_whatsapp_webhook_verify_token"
    META_ACCESS_TOKEN: Optional[str] = None
    META_PHONE_NUMBER_ID: Optional[str] = None
    META_WABA_ID: Optional[str] = None

    # =========================================================================
    # PAYMENT PROVIDER ABSTRACTION (Primary: Dodo Payments)
    # =========================================================================
    PAYMENT_PROVIDER: str = "dodo"      # "dodo" (Primary default) or "stripe" (optional)
    BILLING_CURRENCY: str = "USD"       # Default international display currency (USD)
    TRIAL_PERIOD_DAYS: int = 7          # Configurable trial period in days
    BILLING_GRACE_PERIOD_DAYS: int = 3  # Grace period for past_due / on_hold status

    # Dodo Payments Configuration (Primary for India & International SaaS)
    DODO_PAYMENTS_API_KEY: Optional[str] = None
    DODO_PAYMENTS_WEBHOOK_KEY: Optional[str] = None
    DODO_PAYMENTS_ENVIRONMENT: str = "test_mode"  # "test_mode" or "live_mode"
    DODO_PAYMENTS_PRODUCT_STARTER: str = "pdt_starter_99_usd"
    DODO_PAYMENTS_PRODUCT_GROWTH: str = "pdt_growth_199_usd"

    # Stripe Provider Configuration (Optional modular secondary provider)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_STARTER_MONTHLY: str = "price_starter_monthly_99"
    STRIPE_PRICE_GROWTH_MONTHLY: str = "price_growth_monthly_199"

    # Demo Mode
    ENABLE_DEMO_MODE: bool = True
    DEMO_BUSINESS_ID: str = "biz_demo_hvac_001"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
