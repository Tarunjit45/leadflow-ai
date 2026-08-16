import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.app.core.config import settings
from apps.api.app.core.database import engine, Base
from apps.api.app.api.v1 import (
    auth,
    businesses,
    agents,
    knowledge,
    conversations,
    leads,
    appointments,
    integrations,
    webhooks,
    analytics,
    billing,
    test_console,
    widget,
    admin,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("leadflow_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LeadFlow AI Database Schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("LeadFlow AI Backend Ready.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(businesses.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(leads.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(integrations.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(test_console.router, prefix=settings.API_V1_STR)
app.include_router(widget.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": "LeadFlow AI API",
        "version": settings.VERSION,
        "status": "operational",
        "docs": f"{settings.API_V1_STR}/docs",
    }
