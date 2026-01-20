"""
In-memory rate limiting logic.
"""
import os
import time
from typing import Any, Dict

RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

# In-memory rate limiting store
rate_limit_store: Dict[str, Dict[str, Any]] = {}

def check_rate_limit(client_ip: str, endpoint: str = None) -> bool:
    """Check if client has exceeded rate limit."""
    current_time = int(time.time())
    key = f"{client_ip}:{endpoint or 'global'}"

    if key not in rate_limit_store:
        rate_limit_store[key] = {"requests": [], "count": 0}

    rate_limit_store[key]["requests"] = [
        req_time
        for req_time in rate_limit_store[key]["requests"]
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]

    if len(rate_limit_store[key]["requests"]) >= RATE_LIMIT_REQUESTS:
        return False

    rate_limit_store[key]["requests"].append(current_time)
    return True

def get_rate_limit_headers(client_ip: str, endpoint: str = None) -> Dict[str, str]:
    """Get rate limit headers for response."""
    key = f"{client_ip}:{endpoint or 'global'}"

    if key not in rate_limit_store:
        return {
            "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
            "X-RateLimit-Remaining": str(RATE_LIMIT_REQUESTS),
        }

    current_count = len(rate_limit_store[key]["requests"])
    remaining = max(0, RATE_LIMIT_REQUESTS - current_count)

    return {"X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS), "X-RateLimit-Remaining": str(remaining)}
