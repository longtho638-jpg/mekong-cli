"""
Cache Management Router (Admin)
Allows admins to view cache stats, browse keys, and invalidate entries.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel

from backend.api.auth.dependencies import get_current_active_superuser
from backend.services.cache import cache_factory

router = APIRouter(prefix="/cache", tags=["Admin Cache Management"])

class CacheStats(BaseModel):
    hits: int
    misses: int
    hit_rate_percent: float
    avg_latency_ms: float
    writes: int
    deletes: int
    ops_breakdown: dict

class InvalidationRequest(BaseModel):
    pattern: Optional[str] = None
    tags: Optional[List[str]] = None
    key: Optional[str] = None

@router.get("/stats", response_model=CacheStats)
async def get_cache_stats(
    current_user = Depends(get_current_active_superuser)
):
    """Get global cache performance metrics"""
    metrics = cache_factory.get_metrics()
    return metrics.to_dict()

@router.post("/invalidate")
async def invalidate_cache(
    request: InvalidationRequest,
    current_user = Depends(get_current_active_superuser)
):
    """Invalidate cache by key, pattern, or tags"""
    invalidator = await cache_factory.get_invalidator()
    count = 0

    if request.key:
        count += await invalidator.invalidate_key(request.key)

    if request.pattern:
        count += await invalidator.invalidate_pattern(request.pattern)

    if request.tags:
        count += await invalidator.invalidate_tags(request.tags)

    return {"message": "Invalidation complete", "keys_removed": count}

@router.post("/flush")
async def flush_cache(
    confirm: bool = Query(False, description="Must be true to proceed"),
    current_user = Depends(get_current_active_superuser)
):
    """Flush the entire cache (Dangerous)"""
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")

    redis_client = await cache_factory.get_redis()
    await redis_client.flushdb()

    # Reset metrics too
    metrics = cache_factory.get_metrics()
    metrics.reset()

    return {"message": "Cache flushed successfully"}

@router.get("/keys")
async def browse_keys(
    pattern: str = Query("*", description="Key pattern to match"),
    limit: int = Query(100, le=1000),
    cursor: int = Query(0),
    current_user = Depends(get_current_active_superuser)
):
    """Browse cache keys (Scan)"""
    redis_client = await cache_factory.get_redis()

    # Using scan for safety
    new_cursor, keys = await redis_client.scan(cursor=cursor, match=pattern, count=limit)

    return {
        "cursor": new_cursor,
        "keys": keys,
        "count": len(keys)
    }

@router.get("/keys/{key:path}")
async def get_key_details(
    key: str,
    current_user = Depends(get_current_active_superuser)
):
    """Get details for a specific key (TTL, Type, Size)"""
    redis_client = await cache_factory.get_redis()

    if not await redis_client.exists(key):
        raise HTTPException(status_code=404, detail="Key not found")

    key_type = await redis_client.type(key)
    ttl = await redis_client.ttl(key)

    # Simple value retrieval for string types
    value = None
    if key_type == "string":
        value = await redis_client.get(key)
        # Try to parse if it looks like JSON/msgpack?
        # For now just return raw string or simple indication

    return {
        "key": key,
        "type": key_type,
        "ttl": ttl,
        "value_preview": str(value)[:1000] if value else None
    }
