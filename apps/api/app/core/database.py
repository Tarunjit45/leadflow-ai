import os
import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import ArgumentError, OperationalError
from apps.api.app.core.config import settings

logger = logging.getLogger("leadflow_db")

FALLBACK_SQLITE_URL = "sqlite:///./leadflow_local.db"

def get_sanitized_db_url(raw_url: str | None) -> str:
    """Sanitizes, unquotes, strips newlines/spaces, and normalizes database connection URL."""
    if not raw_url:
        return FALLBACK_SQLITE_URL

    # Remove all whitespace, line breaks, quotes that might come from multi-line copy-pastes
    url = "".join(str(raw_url).split()).strip("'").strip('"')

    if not url or url.lower() in ("none", "null", "undefined", '""', "''"):
        return FALLBACK_SQLITE_URL

    # Normalize PostgreSQL URL scheme for SQLAlchemy 2.0+
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url


def create_safe_engine(url_str: str):
    """Creates a database engine with automatic fallback to SQLite on connection failure."""
    target_url = get_sanitized_db_url(url_str)
    engine_kwargs: Dict[str, Any] = {"pool_pre_ping": True}

    if target_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
    else:
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20
        engine_kwargs["pool_recycle"] = 300

    try:
        eng = create_engine(target_url, **engine_kwargs)
        # Test connection immediately on initialization
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database successfully connected to {'PostgreSQL' if not target_url.startswith('sqlite') else 'SQLite'}.")
        return eng, target_url
    except Exception as e:
        logger.warning(f"Failed to connect to configured DB ({target_url[:25]}...): {e}. Falling back to SQLite local database.")
        eng = create_engine(FALLBACK_SQLITE_URL, connect_args={"check_same_thread": False, "timeout": 30})
        return eng, FALLBACK_SQLITE_URL


engine, db_url = create_safe_engine(settings.DATABASE_URL)
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
