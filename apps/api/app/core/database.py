import os
import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import ArgumentError
from apps.api.app.core.config import settings

logger = logging.getLogger("leadflow_db")

FALLBACK_SQLITE_URL = "sqlite:///./leadflow_local.db"

def get_sanitized_db_url(raw_url: str | None) -> str:
    """Sanitizes, unquotes, and normalizes database connection URL."""
    if not raw_url:
        return FALLBACK_SQLITE_URL

    url = str(raw_url).strip().strip("'").strip('"')

    if not url or url.lower() in ("none", "null", "undefined", '""', "''"):
        return FALLBACK_SQLITE_URL

    # Normalize PostgreSQL URL scheme for SQLAlchemy 2.0+
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url


db_url = get_sanitized_db_url(settings.DATABASE_URL)

# Configure connection args & pool settings
connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {
    "pool_pre_ping": True,
}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL production pooling settings
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 300

try:
    engine = create_engine(db_url, **engine_kwargs)
except ArgumentError as e:
    logger.warning(f"Failed to parse DB URL '{db_url}': {e}. Falling back to SQLite.")
    db_url = FALLBACK_SQLITE_URL
    engine = create_engine(db_url, connect_args={"check_same_thread": False, "timeout": 30})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that creates and closes a database session for requests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> Dict[str, Any]:
    """Checks database connectivity and latency."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            is_postgres = not db_url.startswith("sqlite")
            return {
                "healthy": result == 1,
                "engine": "PostgreSQL" if is_postgres else "SQLite",
                "database_url_configured": bool(settings.DATABASE_URL),
                "is_persistent": is_postgres,
            }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "healthy": False,
            "error": str(e),
            "engine": "Unknown",
            "is_persistent": False,
        }
