# Troubleshooting & Diagnostics Guide

This guide details resolutions for common configuration and operational scenarios.

---

## 1. Third-Party API Key Not Configured
**Symptom**: Dashboard status displays `Not Configured` for Stripe, WhatsApp, or Google Calendar.  
**Resolution**: LeadFlow AI includes built-in offline simulation engines so the dashboard and sales flows never crash when a credential is unpopulated. When ready for production, navigate to `/dashboard/status`, copy the listed environment variables, and populate them in your `.env`.

---

## 2. Meta WhatsApp Webhook Handshake Failed
**Symptom**: Meta developer portal returns `Verification token mismatch` or `Callback URL not reachable`.  
**Resolution**:
1. Ensure your public URL is accessible (use ngrok for local development: `ngrok http 8000`).
2. Verify that the Verify Token in Meta matches `META_VERIFY_TOKEN` in your `.env`.
3. Check backend logs for incoming `GET /api/v1/webhooks/whatsapp` requests.

---

## 3. Google Calendar Free/Busy Returning Empty
**Symptom**: No appointment slots appear on the calendar booking tool.  
**Resolution**:
1. Check that the connected Google account has permissions to read primary calendar events.
2. Verify business working hours are configured in `/dashboard/knowledge`.

---

## 4. Resetting Local Demo Data
To reset your local environment and seed realistic demo HVAC company data:
```bash
python -m database.seeds.seed_demo
```
