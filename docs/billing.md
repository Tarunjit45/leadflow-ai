# Payment & Subscription Architecture — Dodo Payments Integration

LeadFlow AI is engineered for global SaaS distribution using a modular **Payment Provider Abstraction Layer** (`PaymentProvider`), with **Dodo Payments as the primary default payment provider** (`PAYMENT_PROVIDER=dodo`) and **Stripe preserved as an optional modular secondary provider**.

```
PaymentProvider (Abstract Interface)
├── DodoPaymentsProvider (Default & Primary — Built for International SaaS from India)
└── StripeProvider (Optional Secondary — Zero mutual dependency)
```

---

## 1. Provider Architecture & Factory

The payment provider is decoupled from business logic. The application instantiates the configured provider at runtime via `get_payment_provider()`:

```env
# Default active provider: "dodo" (Primary) or "stripe" (Optional)
PAYMENT_PROVIDER=dodo
BILLING_CURRENCY=USD
```

* **Zero Mutual Dependency**:
  - When `PAYMENT_PROVIDER=dodo`, Stripe credentials are **NOT** required.
  - When `PAYMENT_PROVIDER=stripe`, Dodo credentials are **NOT** required.

---

## 2. Dodo Payments Official Integration

LeadFlow AI integrates directly with the official **Dodo Payments Python SDK** (`dodopayments>=1.112.0`) and the **Standard Webhooks** specification (`standardwebhooks>=1.1.0`).

### Authentication & Environments
- **API Key**: Bearer token authentication (`DODO_PAYMENTS_API_KEY`).
- **Environments**:
  - `test_mode` (Sandbox): Uses `https://test.dodopayments.com` with test cards.
  - `live_mode` (Production): Uses `https://live.dodopayments.com`.

### Products & Server-Side Plan Resolution
To prevent client-side price tampering, the frontend passes plan names (e.g. `starter` or `growth`), which the backend resolves into trusted server-side Product IDs:
- **Starter Plan**: `$99 / month` (`DODO_PAYMENTS_PRODUCT_STARTER`)
- **Growth Plan**: `$199 / month` (`DODO_PAYMENTS_PRODUCT_GROWTH`)

### Multi-Currency International SaaS
The database stores:
* `amount` (e.g. `99.00`, `199.00`)
* `currency` (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`)
* `billing_interval` (`month`, `year`)
* `provider` (`dodo` or `stripe`)
* `provider_product_id`
* `provider_customer_id`
* `provider_subscription_id`

---

## 3. Subscription Status Normalization

External provider statuses are mapped to LeadFlow internal normalized states:

| Normalized Status | Dodo Payments Status | Stripe Status | Meaning |
|---|---|---|---|
| `trialing` | `pending` | `trialing` | Active free trial or pending initial payment |
| `active` | `active`, `renewed` | `active` | Payment verified & subscription in good standing |
| `past_due` | `on_hold`, `failed` | `past_due`, `unpaid`, `incomplete` | Renewal failed; grace period active |
| `cancelled` | `cancelled` | `canceled` | Subscription terminated by customer or merchant |
| `expired` | `expired` | `incomplete_expired` | Subscription duration concluded |
| `paused` | `paused` | `paused` | Subscription temporarily held |

---

## 4. Webhook Security & Idempotency

### Webhook Endpoint
```text
POST https://your-api-domain.com/api/v1/webhooks/dodo
```

### Signature Verification
Dodo Payments webhooks use the **Standard Webhooks** specification. Incoming requests verify:
- `webhook-id`: Unique message ID.
- `webhook-signature`: HMAC SHA-256 signature.
- `webhook-timestamp`: Request timestamp (replay attack prevention).
- Verified using `DODO_PAYMENTS_WEBHOOK_KEY` (format: `whsec_...`).

### Idempotency & Database Audit
All received events are recorded in the `payment_provider_events` table:
* Columns: `id`, `provider`, `provider_event_id`, `event_type`, `payload_hash`, `status`, `processed_at`, `error`.
* Unique Constraint: `(provider, provider_event_id)` ensures no payment event is ever processed twice.

### Supported Dodo Webhook Events
* `payment.succeeded`: Initial payment or renewal succeeded $\rightarrow$ unlocks full plan entitlements.
* `payment.failed`: Charge failed $\rightarrow$ updates status to `past_due`, records error without deleting customer data.
* `subscription.active`: Subscription activated $\rightarrow$ updates status to `active`.
* `subscription.renewed`: Billing cycle renewed $\rightarrow$ resets monthly quota.
* `subscription.updated` / `subscription.plan_changed`: Plan upgrade/downgrade $\rightarrow$ adjusts limits dynamically.
* `subscription.cancelled`: Cancellation recorded $\rightarrow$ remains accessible until `cancel_at_next_billing_date`.
* `subscription.on_hold` / `subscription.failed`: Dunning / payment issue $\rightarrow$ status `past_due`.
* `subscription.expired`: Subscription terminated $\rightarrow$ restricts usage.

---

## 5. Dodo Setup & Credential Instructions

1. **Create an Account**: Sign up at [app.dodopayments.com](https://app.dodopayments.com).
2. **Obtain API Keys**:
   - In **Developer > API Keys**, generate a Restricted or Full Access key.
   - For testing: Copy your test key (e.g. `dodo_test_...`).
   - For live production: Copy your live key (e.g. `dodo_live_...`).
3. **Create Products in Dodo Dashboard**:
   - Create a recurring product for **Starter ($99/mo)** $\rightarrow$ Copy Product ID into `DODO_PAYMENTS_PRODUCT_STARTER`.
   - Create a recurring product for **Growth ($199/mo)** $\rightarrow$ Copy Product ID into `DODO_PAYMENTS_PRODUCT_GROWTH`.
4. **Configure Webhook**:
   - In **Developer > Webhooks**, add endpoint:
     ```text
     https://your-api-domain.com/api/v1/webhooks/dodo
     ```
   - Subscribe to all payment and subscription events.
   - Copy the Webhook Secret (`whsec_...`) into `DODO_PAYMENTS_WEBHOOK_KEY`.
5. **Environment Configuration**:
   ```env
   PAYMENT_PROVIDER=dodo
   DODO_PAYMENTS_API_KEY=dodo_test_...
   DODO_PAYMENTS_WEBHOOK_KEY=whsec_...
   DODO_PAYMENTS_ENVIRONMENT=test_mode
   DODO_PAYMENTS_PRODUCT_STARTER=pdt_starter_99_usd
   DODO_PAYMENTS_PRODUCT_GROWTH=pdt_growth_199_usd
   TRIAL_PERIOD_DAYS=7
   ```
