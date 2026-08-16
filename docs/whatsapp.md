# Meta WhatsApp Cloud API Setup Guide

This guide details how to configure the official Meta WhatsApp Business Platform for LeadFlow AI.

---

## 1. Meta Developer App Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an App of type **Business**.
2. Add the **WhatsApp** product to your App.
3. In WhatsApp > API Setup:
   - Note your **Phone Number ID** (`META_PHONE_NUMBER_ID`).
   - Note your **WhatsApp Business Account ID** (`META_WABA_ID`).
   - Generate a temporary access token for initial testing, or create a System User in Meta Business Manager for a permanent token (`META_ACCESS_TOKEN`).

---

## 2. Webhook Configuration

1. In Meta App Dashboard > WhatsApp > Configuration:
   - **Callback URL**: `https://your-domain.com/api/v1/webhooks/whatsapp`
   - **Verify Token**: Provide your configured `META_VERIFY_TOKEN` (e.g. `leadflow_whatsapp_webhook_verify_token`).
2. Click **Verify and Save**.
3. Under Webhook fields, subscribe to **messages**.

---

## 3. Environment Variables

Add the following to your `.env` file:
```env
META_APP_ID=123456789012345
META_APP_SECRET=your_app_secret_here
META_VERIFY_TOKEN=leadflow_whatsapp_webhook_verify_token
META_ACCESS_TOKEN=EAAG...
META_PHONE_NUMBER_ID=109876543210987
META_WABA_ID=109876543210986
```

---

## 4. Test Inbound Message

Send a WhatsApp message from a personal phone to your registered WhatsApp test number.
- LeadFlow AI will verify the HMAC signature, deduplicate the event ID, process the message through the Agent Runtime, and automatically dispatch a response back to the customer.
