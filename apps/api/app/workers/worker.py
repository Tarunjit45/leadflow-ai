import asyncio
import logging
from apps.api.app.core.database import SessionLocal
from apps.api.app.workers.follow_up_engine import FollowUpEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("leadflow_worker")


async def run_worker_loop():
    logger.info("Starting LeadFlow AI Background Follow-Up & Task Worker...")
    while True:
        try:
            db = SessionLocal()
            try:
                processed = await FollowUpEngine.process_due_followups(db)
                if processed > 0:
                    logger.info(f"Processed {processed} due follow-up tasks successfully.")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error during worker tick: {str(e)}", exc_info=True)

        # Poll interval 30 seconds
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(run_worker_loop())
