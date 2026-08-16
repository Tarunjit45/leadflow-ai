# Local Development & Setup Guide

This guide walks you through running LeadFlow AI locally from scratch.

## Prerequisites

- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18.0+ (tested on Node.js 24)
- **Docker** (Optional for PostgreSQL & Redis)

---

## 1. Clone & Install Dependencies

### Backend Dependencies
```bash
python -m pip install -r apps/api/requirements.txt
```

### Frontend Dependencies
```bash
cd apps/web
npm install
cd ../..
```

---

## 2. Environment Configuration

Copy the `.env.example` template:
```bash
cp .env.example .env
```

The application defaults to SQLite and local offline AI heuristics if third-party keys are not provided.

---

## 3. Database Initialization & Demo Seeding

Run the seed script to set up demo HVAC company knowledge, sample leads, conversations, and calendar bookings:
```bash
python -m database.seeds.seed_demo
```

---

## 4. Run Backend & Frontend

### Terminal 1: FastAPI API Server
```bash
python -m uvicorn apps.api.app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs: http://localhost:8000/api/v1/docs

### Terminal 2: Background Follow-Up Worker
```bash
python -m apps.api.app.workers.worker
```

### Terminal 3: Next.js Frontend
```bash
cd apps/web
npm run dev
```
- Web Application: http://localhost:3000

---

## 5. Run Automated Tests

### Python Backend Test Suite (Pytest)
```bash
python -m pytest apps/api/tests -v
```
