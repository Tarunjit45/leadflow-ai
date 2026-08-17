import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status

# In-memory sliding window rate limiter
_request_history: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 60):
    """
    Sliding window rate limit checker.
    Raises HTTP 429 if the key exceeds max_requests within window_seconds.
    """
    now = time.time()
    cutoff = now - window_seconds
    
    # Filter out timestamps older than the window
    history = [t for t in _request_history[key] if t > cutoff]
    
    if len(history) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. For security, please wait a minute before trying again.",
        )
    
    history.append(now)
    _request_history[key] = history


def rate_limit_by_ip(request: Request, action: str, max_requests: int = 5, window_seconds: int = 60):
    """Rate limits based on client IP and action name."""
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{action}"
    check_rate_limit(key, max_requests, window_seconds)
