# Payment & Subscription Architecture Guide

LeadFlow AI features a modular **Payment Provider Abstraction Layer** (`PaymentProvider`) designed specifically to support India-based and international SaaS businesses with zero friction.

```
PaymentProvider (Abstract Base Interface)
├── RazorpayProvider (Default & Primary — Built for India & International SaaS)
└── StripeProvider (Modular Secondary — Available for Global Markets)
```

---

## 1. Provider Abstraction & Configuration

The application determines the active payment provider at runtime via `PAYMENT_PROVIDER` in your `.env` file:

```env
# Default active provider: "razorpay" or "stripe"
PAYMENT_PROVIDER=razorpay
BILLING_CURRENCY=USD
```

* **Factory Function**: `get_payment_provider()` instantiates the configured adapter.
* **Zero Mutual Dependency**: 
  - When `PAYMENT_PROVIDER=razorpay`, Stripe credentials are NOT required.
  - When `PAYMENT_PROVIDER=stripe`, Razorpay credentials are NOT required.

---

## 2. Multi-Currency International SaaS Pricing

LeadFlow AI does NOT hard-code currency assumptions in the database.

The database stores:
* `currency` (e.g. `USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`)
* `amount` (e.g. `99.00`, `199.00`)
* `billing_interval` (`month`, `year`)
* `provider` (`razorpay` or `stripe`)
* `provider_product_id`
* `provider_price_id` (or `plan_id`)
* `provider_customer_id`
* `provider_subscription_id`

### Standard SaaS Tiers (International Display)
* **Starter Plan**: **$99 / month** (1,000 AI Messages, 100 Calendar Bookings, Website + WhatsApp)
* **Growth Plan**: **$199 / month** (2,500 AI Messages, 250 Calendar Bookings, CRM Sync, Revenue Recovery Analytics)

---

## 3. Normalized Internal Subscription States

Regardless of whether Razorpay or Stripe is used, LeadFlow AI normalizes external provider events into internal state machines:

| Normalized Status | Razorpay Status | Stripe Status | Meaning |
|---|---|---|---|
| `trialing` | `created` | `trialing` | Free trial or pending initial payment |
| `active` | `authenticated`, `active` | `active` | Payment successful & subscription in good standing |
| `past_due` | `pending`, `halted` | `past_due`, `unpaid`, `incomplete` | Renewal charge failed; grace period active |
| `cancelled` | `cancelled` | `canceled` | Subscription terminated by user or merchant |
| `expired` | `completed`, `expired` | `incomplete_expired` | Subscription duration concluded |
| `paused` | `paused` | `paused` | Subscription temporarily held |

---

## 4. Razorpay Implementation Guide (Primary)

### Environment Variables
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
RAZORPAY_PLAN_STARTER_MONTHLY=plan_starter_99_usd
RAZORPAY_PLAN_GROWTH_MONTHLY=plan_growth_199_usd
```

### Razorpay Webhook Configuration
1. In your **Razorpay Dashboard > Settings > Webhooks**:
   - **Webhook URL**: `https://your-api-domain.com/api/v1/webhooks/razorpay`
   - **Secret**: Set your `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**:
     - `subscription.authenticated`
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.pending`
     - `subscription.halted`
     - `subscription.cancelled`
     - `subscription.completed`
     - `payment.failed`

### Verification & Idempotency
- Incoming payloads verify HMAC-SHA256 signatures via `X-Razorpay-Signature`.
- Event IDs are cached to prevent duplicate execution.

---

## 5. CRITICAL: Razorpay International Payments Activation

> [!IMPORTANT]
> **To charge international customers (US, UK, Europe) in USD / EUR / GBP from an Indian Razorpay Account:**
>
> 1. **Enable International Payments**: Navigate to your **Razorpay Dashboard > Account & Settings > International Payments** and turn the toggle **ON**.
> 2. **KYC & Business Verification**: Razorpay requires export business verification (IEC or declaration for IT/software services under RBI guidelines).
> 3. **Supported Cards**: International Visa, MasterCard, and American Express cards are supported once enabled.
> 4. **Currency Settlement**: Charges are billed in USD ($99 / $199) and settled to your Indian bank account in INR at the applicable daily exchange rate.

---

## 6. Stripe Implementation Guide (Modular Secondary)

When ready to use Stripe:
```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
- Webhook URL: `https://your-api-domain.com/api/v1/webhooks/stripe`
