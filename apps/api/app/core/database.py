import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from apps.api.app.core.config import settings

logger = logging.getLogger("leadflow_db")

# Normalize PostgreSQL URL scheme for SQLAlchemy 2.0
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Handle SQLite vs PostgreSQL connection specifics
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

engine = create_engine(db_url, **engine_kwargs)

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
