# LeadFlow AI — Autonomous AI Sales & Booking OS

> **Turn every inbound enquiry into a confirmed customer.**

LeadFlow AI is an enterprise-grade SaaS designed for home-service contractors (HVAC, plumbing, electrical, roofing, contracting) to automatically respond to inbound customer inquiries, qualify customer intent, schedule verified calendar appointments, and execute intelligent follow-ups across Web and WhatsApp 24/7.

---

## 🌟 Key Capabilities

- ⚡ **Sub-2s Instant Lead Response**: 24/7 coverage across Website Chat Widget and Meta WhatsApp Cloud API.
- 🎯 **Autonomous Lead Qualification & Scoring**: Structured parameter extraction (urgency, intent, problem description, location) with dynamic 0–100 lead scoring.
- 📅 **Google Calendar Auto-Booking**: Real-time Free/Busy availability checks with buffer and minimum-notice constraint enforcement.
- 🔁 **Scheduled Follow-Up Engine**: Multi-stage automated re-engagement (+24h, +72h, +7d) with automatic stop conditions (customer replies, books, or opts out) and quiet hours protection.
- 🧑‍💼 **1-Click Human Takeover**: Live conversation inbox with real-time agent handoff and takeover resuming.
- 📊 **Revenue Recovery Analytics**: Dynamic ROI calculation estimating recovered revenue from missed after-hours leads.
- 💳 **Dodo Payments Integration (Primary)**: Modular multi-currency recurring subscription engine with Dodo Payments (Starter $99/mo, Growth $199/mo), Standard Webhooks signature verification, customer self-service portal, and 7-day free trial lifecycle.
- 🛡️ **Anti-Prompt-Injection & Security**: Structural prompt protection, automated secret redaction, AES-256 encrypted credentials, and multi-tenant database isolation.

---

## 🛠️ Architecture & Tech Stack

```text
leadflow-ai/
│
├── apps/
│   ├── web/                     # Next.js 15+ App Router, Tailwind CSS, TypeScript
│   │   ├── app/                 # Landing page, Auth, Onboarding, Dashboard, Demo
│   │   ├── components/          # Sidebar, Header, UI widgets
│   │   └── lib/                 # Type-safe API client
│   │
│   └── api/                     # FastAPI Backend Engine (Python 3.12)
│       ├── app/
│       │   ├── api/v1/          # REST endpoints (Auth, Leads, Agent, Calendar, Billing, Webhooks)
│       │   ├── core/            # Config, Security, AES encryption, Idempotency, Database
│       │   ├── models/          # Multi-tenant SQLAlchemy models & PaymentProviderEvent
│       │   ├── schemas/         # Pydantic v2 validation & serialization
│       │   ├── agents/          # AI provider abstraction, prompt builder, safety filters, tool registry
│       │   ├── integrations/    # Dodo Payments, Stripe, WhatsApp Cloud API, Google Calendar, Sheets
│       │   └── workers/         # Background follow-up engine and scheduler
│       └── tests/               # Pytest unit & integration test suite (20/20 passing)
│
├── database/                    # Database seeds & migrations
├── docs/                        # Architecture, setup, security, billing, and deployment guides
├── docker-compose.yml           # PostgreSQL 16 & Redis 7 local services
├── .env.example                 # Environment configuration template
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-org/leadflow-ai.git
cd leadflow-ai
cp .env.example .env
```

### 2. Install Dependencies
```bash
# Python Backend
python -m pip install -r apps/api/requirements.txt

# Next.js Frontend
cd apps/web && npm install && cd ../..
```

### 3. Seed Demo Database
```bash
python -m database.seeds.seed_demo
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend API
python -m uvicorn apps.api.app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Background Follow-up Worker
python -m apps.api.app.workers.worker

# Terminal 3: Frontend Web Dashboard
cd apps/web && npm run dev
```

- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **1-Click Interactive Demo**: [http://localhost:3000/login?demo=true](http://localhost:3000/login?demo=true)
- **Customer Chat Widget Demo**: [http://localhost:3000/widget-demo](http://localhost:3000/widget-demo)

---

## 🧪 Testing

Run backend unit and integration test suite:
```bash
python -m pytest apps/api/tests -v
```

---

## 📚 Documentation

- [Architecture & Design](docs/architecture.md)
- [Local Setup Guide](docs/setup.md)
- [Environment Variables Reference](docs/environment.md)
- [Dodo Payments & Billing Guide](docs/billing.md)
- [Integrations Guide](docs/integrations.md)
- [Meta WhatsApp Cloud API Setup](docs/whatsapp.md)
- [Security & Anti-Prompt-Injection](docs/security.md)
- [Production Deployment](docs/deployment.md)
- [Troubleshooting & FAQ](docs/troubleshooting.md)

---

## 📄 License
MIT License. Built for production deployment by the LeadFlow AI Team.
