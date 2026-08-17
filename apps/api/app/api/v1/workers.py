import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.workers.follow_up_engine import FollowUpEngine

logger = logging.getLogger("leadflow_workers")

router = APIRouter(prefix="/workers", tags=["Background Workers & Crons"])


@router.api_route("/tick", methods=["GET", "POST"])
async def trigger_worker_tick(
    db: Session = Depends(get_db),
    cron_token: str = Query(None),
    x_cron_secret: str = Header(None),
    x_vercel_cron: str = Header(None),
):
    """
    Cloud worker execution endpoint triggered by Vercel Cron or external schedulers.
    Runs automated follow-ups, checks stop conditions, and dispatches due sequences.
    """
    expected_secret = os.getenv("CRON_SECRET")
    
    # Optional security: If CRON_SECRET is set in environment, verify header or token
    if expected_secret:
        provided = x_cron_secret or cron_token
        if provided != expected_secret and x_vercel_cron != "1":
            raise HTTPException(status_code=401, detail="Unauthorized cron invocation.")

    now = datetime.now(timezone.utc)
    logger.info(f"Executing cloud worker tick at {now.isoformat()}...")
    
    try:
        processed_count = await FollowUpEngine.process_due_followups(db)
        return {
            "status": "success",
            "task": "follow_up_automation",
            "processed_count": processed_count,
            "executed_at": now.isoformat(),
        }
    except Exception as e:
        logger.error(f"Worker tick execution error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Worker error: {str(e)}")
