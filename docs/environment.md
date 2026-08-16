# Environment Variables Reference

Below is the complete reference of all environment variables supported by LeadFlow AI.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `sqlite:///./leadflow_local.db` | PostgreSQL or SQLite database connection string |
| `REDIS_URL` | Optional | `redis://localhost:6379/0` | Redis connection URL for background jobs and cache |
| `SECRET_KEY` | Yes | `leadflow-super-secure...` | Master JWT and session signing secret key |
| `ENCRYPTION_KEY` | Yes | `dGhpcy1pcy1hLX...` | 32-byte Fernet key for encrypting OAuth tokens in DB |
| `AI_PROVIDER` | No | `openrouter` | Modular AI provider engine (`openrouter`, `openai`, `anthropic`) |
| `OPENROUTER_API_KEY` | Optional | `None` | OpenRouter API Key (e.g. `sk-or-v1-...`) |
| `OPENROUTER_MODEL` | No | `google/gemini-2.0-flash-001` | Primary model identifier |
| `AI_FALLBACK_MODEL` | No | `anthropic/claude-3.5-haiku` | Fallback model if primary fails |
| `META_APP_ID` | Optional | `None` | Meta Developer App ID |
| `META_APP_SECRET` | Optional | `None` | Meta App Secret for verifying webhook HMAC signatures |
| `META_VERIFY_TOKEN` | Yes | `leadflow_whatsapp...` | Webhook verification token handshake string |
| `META_ACCESS_TOKEN` | Optional | `None` | Permanent System User Token for WhatsApp Cloud API |
| `META_PHONE_NUMBER_ID` | Optional | `None` | WhatsApp Business Phone Number ID |
| `GOOGLE_CLIENT_ID` | Optional | `None` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | `None` | Google Cloud OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Yes | `http://localhost:8000/...` | Google OAuth callback redirect URL |
| `STRIPE_SECRET_KEY` | Optional | `None` | Stripe Secret API Key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Optional | `None` | Stripe Publishable Key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Optional | `None` | Stripe Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_STARTER_MONTHLY` | No | `price_starter_monthly_99` | Stripe Price ID for Starter ($99/mo) |
| `STRIPE_PRICE_GROWTH_MONTHLY` | No | `price_growth_monthly_199` | Stripe Price ID for Growth ($199/mo) |
