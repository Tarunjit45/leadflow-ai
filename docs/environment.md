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
| `PAYMENT_PROVIDER` | No | `dodo` | Primary billing provider: `dodo` (default) or `stripe` |
| `BILLING_CURRENCY` | No | `USD` | Display & billing currency (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`) |
| `TRIAL_PERIOD_DAYS` | No | `7` | Configurable free trial duration in days |
| `DODO_PAYMENTS_API_KEY` | Optional | `None` | Dodo Payments API Key (`dodo_test_...` or `dodo_live_...`) |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Optional | `None` | Dodo Payments Webhook Secret (`whsec_...`) |
| `DODO_PAYMENTS_ENVIRONMENT` | No | `test_mode` | Dodo environment (`test_mode` or `live_mode`) |
| `DODO_PAYMENTS_PRODUCT_STARTER` | No | `pdt_starter_99_usd` | Dodo Product ID for Starter ($99/mo) |
| `DODO_PAYMENTS_PRODUCT_GROWTH` | No | `pdt_growth_199_usd` | Dodo Product ID for Growth ($199/mo) |
| `STRIPE_SECRET_KEY` | Optional | `None` | Stripe Secret API Key (Optional) |
| `STRIPE_PUBLISHABLE_KEY` | Optional | `None` | Stripe Publishable Key (Optional) |
| `STRIPE_WEBHOOK_SECRET` | Optional | `None` | Stripe Webhook signing secret (Optional) |
| `META_APP_ID` | Optional | `None` | Meta Developer App ID |
| `META_APP_SECRET` | Optional | `None` | Meta App Secret for verifying webhook HMAC signatures |
| `META_VERIFY_TOKEN` | Yes | `leadflow_whatsapp...` | Webhook verification token handshake string |
| `META_ACCESS_TOKEN` | Optional | `None` | Permanent System User Token for WhatsApp Cloud API |
| `META_PHONE_NUMBER_ID` | Optional | `None` | WhatsApp Business Phone Number ID |
| `GOOGLE_CLIENT_ID` | Optional | `None` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | `None` | Google Cloud OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Yes | `http://localhost:8000/...` | Google OAuth callback redirect URL |
