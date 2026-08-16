# Production Deployment Guide

LeadFlow AI is engineered for rapid, scalable production deployment across modern cloud platforms.

---

## 1. Architecture Overview

- **Frontend**: Next.js 15+ App Router deployed on [Vercel](https://vercel.com) or [Render](https://render.com).
- **Backend API**: FastAPI Python application deployed on [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io).
- **Database**: Managed PostgreSQL on [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app).
- **Queue / Cache**: Managed Redis on [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com).

---

## 2. Deploying Backend on Render / Railway

### Render `render.yaml` Blueprint Example:
```yaml
services:
  - type: web
    name: leadflow-api
    env: python
    buildCommand: python -m pip install -r apps/api/requirements.txt
    startCommand: python -m uvicorn apps.api.app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: leadflow-postgres
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ENCRYPTION_KEY
        generateValue: true
```

---

## 3. Deploying Frontend on Vercel

1. Import your Git repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.com`
   - `NEXT_PUBLIC_API_URL`: `https://api.your-domain.com`
4. Deploy.

---

## 4. Post-Deployment Verification Checklist

- [ ] Execute database migrations / seed script.
- [ ] Verify `GET /api/v1/admin/status` returns operational health.
- [ ] Configure Meta WhatsApp Webhook Callback URL and verify handshake.
- [ ] Configure Dodo Payments Webhook endpoint (`/api/v1/webhooks/dodo`) with Webhook Secret.
- [ ] Test website chat widget embed script.
