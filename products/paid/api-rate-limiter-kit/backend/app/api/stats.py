from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from app.core import redis as redis_module
import time

router = APIRouter()

@router.get("/")
async def get_stats() -> Dict[str, int]:
    client = redis_module.redis_client
    if not client:
        raise HTTPException(status_code=503, detail="Redis not connected")

    # Simple daily stats
    # Keys: stats:total, stats:blocked
    # In a real app, these might be time-series or per-minute keys

    total = await redis_client.get("stats:total") or 0
    blocked = await redis_client.get("stats:blocked") or 0

    return {
        "total_requests": int(total),
        "blocked_requests": int(blocked)
    }
