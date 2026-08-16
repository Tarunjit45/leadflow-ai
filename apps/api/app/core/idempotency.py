import time
from typing import Dict, Optional, Set
import logging

logger = logging.getLogger(__name__)

# Fast in-memory deduplication cache (LRU / TTL style)
_processed_events: Dict[str, float] = {}
_TTL_SECONDS = 86400  # 24 hours


def is_event_processed(provider: str, event_id: str) -> bool:
    """Checks if an external webhook event has already been processed within the TTL window."""
    if not event_id:
        return False
    
    key = f"{provider}:{event_id}"
    now = time.time()
    
    # Cleanup expired entries occasionally
    if len(_processed_events) > 5000:
        expired_keys = [k for k, timestamp in _processed_events.items() if now - timestamp > _TTL_SECONDS]
        for k in expired_keys:
            _processed_events.pop(k, None)

    if key in _processed_events:
        logger.info(f"Duplicate event detected for {key}, skipping redundant processing.")
        return True
    
    return False


def mark_event_processed(provider: str, event_id: str) -> None:
    """Marks an external webhook event as processed."""
    if not event_id:
        return
    key = f"{provider}:{event_id}"
    _processed_events[key] = time.time()
