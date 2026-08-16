# Integrations Architecture & Provider Guide

LeadFlow AI connects to third-party services via modular integration adapters located in `apps/api/app/integrations/`.

---

## 1. Website Chat Widget
A lightweight vanilla JavaScript embed snippet that operates across any customer website without framework dependencies.

### Embed Code
```html
<script
  src="https://your-domain.com/api/v1/widget/embed.js"
  data-business-id="your_business_id"
></script>
```

### Features
- Asynchronous non-blocking loading.
- Floating responsive chat launcher with mobile view support.
- Direct connection to the unified AI Agent Runtime.

---

## 2. Meta WhatsApp Cloud API
Official WhatsApp Business Cloud API integration.

### Webhook Verification
- Verification Endpoint: `GET /api/v1/webhooks/whatsapp`
- Challenge Handshake: Verifies `hub.verify_token` against `META_VERIFY_TOKEN`.

### Inbound & Outbound Messaging
- Inbound Endpoint: `POST /api/v1/webhooks/whatsapp`
- HMAC Signature: Verifies `X-Hub-Signature-256` using `META_APP_SECRET`.
- Deduplication: Idempotent deduplication cache prevents double-processing of re-delivered webhooks.

---

## 3. Google Calendar Integration
- OAuth 2.0 Free/Busy availability checks.
- Event Creation and confirmation links.
- Respects business operating hours, 15-minute buffers, and minimum 2-hour scheduling notice.

---

## 4. Google Sheets CRM Sync
- Appends new qualified leads to connected Google Sheets with columns: `Date, Name, Phone, Email, Service, Intent, Lead Score, Status, Appointment, Source, Notes`.

---

## 5. Stripe Subscriptions & Billing
- Stripe Checkout for self-serve plans (Starter $99/mo, Growth $199/mo).
- Stripe Customer Billing Portal for managing payment methods.
- Webhook lifecycle synchronization (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`).
