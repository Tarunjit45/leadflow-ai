# Stripe Payments & Subscriptions Guide

LeadFlow AI integrates directly with Stripe for automated subscription management, plan limit enforcement, and customer billing portals.

---

## 1. Stripe Dashboard Configuration

1. Create a [Stripe Account](https://dashboard.stripe.com).
2. Create two recurring products under **Product Catalog**:
   - **Starter Plan**: $99/month recurring (`STRIPE_PRICE_STARTER_MONTHLY`)
   - **Growth Plan**: $199/month recurring (`STRIPE_PRICE_GROWTH_MONTHLY`)
3. Obtain your API Keys under Developers > API Keys:
   - Secret key: `STRIPE_SECRET_KEY`
   - Publishable key: `STRIPE_PUBLISHABLE_KEY`

---

## 2. Webhook Setup

1. In Developers > Webhooks, add an endpoint:
   - **Endpoint URL**: `https://your-domain.com/api/v1/webhooks/stripe`
   - **Events to Listen to**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
2. Reveal your **Signing secret** and set `STRIPE_WEBHOOK_SECRET=whsec_...` in your `.env`.

---

## 3. Plan Limits & Quota Enforcement

LeadFlow AI enforces monthly plan quotas on message volume and appointment bookings:

| Plan Tier | Price | AI Messages / Month | Calendar Appointments | Channels |
|---|---|---|---|---|
| **Free Trial** | $0 / 7 days | 500 | 50 | Website Chat |
| **Starter** | $99 / mo | 1,000 | 100 | Website + WhatsApp |
| **Growth** | $199 / mo | 2,500 | 250 | All Channels + CRM Sync |
