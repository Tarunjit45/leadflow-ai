# LeadFlow AI — System Architecture & Design

LeadFlow AI is an enterprise-grade SaaS designed for home-service contractors (HVAC, plumbing, electrical, roofing) to autonomously respond to inbound inquiries, qualify leads, schedule calendar appointments, and execute scheduled follow-ups.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT SURFACES                                   |
|   +--------------------------+  +--------------------------+  +-----------------+ |
|   |  Landing & Marketing Site|  | Business Ops Dashboard   |  | Chat Widget     | |
|   |  (Next.js 15 App Router) |  | (Inbox / Leads / AI CRM) |  | (Vanilla JS tag)| |
|   +--------------------------+  +--------------------------+  +-----------------+ |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JWT Auth)
                                           v
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND ENGINE                               |
|                                                                                   |
|  +--------------------+  +----------------------+  +----------------------------+ |
|  | Multi-Tenant Auth  |  | Lead Extraction & CRM|  | Scheduled Follow-Up Engine | |
|  | & Permissions      |  | Scoring Engine (0-100|  | (+24h, +72h, +7d cadences) | |
|  +--------------------+  +----------------------+  +----------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                             AI AGENT RUNTIME                                 | |
|  |  * Anti-Prompt-Injection & Safety Filter (Adversarial Regex & Redaction)    | |
|  |  * Structured Dynamic Context Compiler (Hours, Pricing, SLAs, FAQs)          | |
|  |  * Strict Backend Tool Execution Registry & Permissions Guardrail           | |
|  |  * Multi-Model Fallback Abstraction (OpenRouter -> Direct Providers)        | |
|  +------------------------------------------------------------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                          INTEGRATION ABSTRACTION                             | |
|  |  * Meta WhatsApp Cloud API (HMAC-SHA256 Idempotent Webhook & Messaging)      | |
|  |  * Google Calendar (Free/Busy Availability & Event Dispatch)                  | |
|  |  * Google Sheets (Real-time Lead Row Append)                                 | |
|  |  * Stripe Billing (Checkout, Customer Portal & Tier Limits)                  | |
|  +------------------------------------------------------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+--------------------------------------+      +-------------------------------------+
|        POSTGRESQL / SQLITE           |      |           REDIS QUEUE               |
|  * users                             |      |  * Celery / Async Workers           |
|  * businesses (Multi-tenant tenant ID)|     |  * Webhook Idempotency Cache        |
|  * conversations & messages          |      |  * Scheduled Follow-Up Processor    |
|  * leads, appointments, follow_ups   |      +-------------------------------------+
|  * agent_tools & business_knowledge  |
+--------------------------------------+
```

## Core Modules

1. **Multi-Tenant Database (`apps/api/app/models/`)**:
   All entities (conversations, messages, leads, appointments, subscriptions, knowledge) are explicitly linked to a tenant `business_id`. Authentication derives identity from verified JWT claims rather than untrusted client headers.

2. **AI Provider Abstraction (`apps/api/app/agents/providers/`)**:
   Clean separation between agent logic and provider APIs. Default is OpenRouter (`google/gemini-2.0-flash-001`, `anthropic/claude-3.5-haiku`) with automatic offline simulation fallback.

3. **Tool Registry & Permissions (`apps/api/app/agents/tools/registry.py`)**:
   Every capability (`qualify_and_update_lead`, `get_calendar_availability`, `book_appointment`, `human_handoff`, `notify_owner`) executes with strict backend permission verification.

4. **Scheduled Follow-Up Engine (`apps/api/app/workers/follow_up_engine.py`)**:
   Multi-stage automated cadences (+24h, +72h, +7d) that automatically abort if the customer responds, books an appointment, or opts out.
