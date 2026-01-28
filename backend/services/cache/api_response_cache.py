"""
API Response Caching
Specialized cache for API responses with User-Agent and User-ID varying.
"""

import hashlib
import json
import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis
from fastapi import Request, Response

from backend.services.cache.metrics import MetricsContext, global_metrics

logger = logging.getLogger(__name__)

class ResponseCache:
    def __init__(self, redis_client: redis.Redis, prefix: str = "api:response"):
        self.redis = redis_client
        self.prefix = prefix

    def _make_key(self, request: Request, user_id: Optional[str] = None, vary_by: list = None) -> str:
        """
        Generate cache key based on:
        - Method
        - Path
        - Query Params
        - User ID (if private)
        - Vary headers (optional)
        """
        path = request.url.path
        query = str(sorted(request.query_params.items()))

        key_parts = [request.method, path, query]

        if user_id:
            key_parts.append(f"u:{user_id}")

        if vary_by:
            for header in vary_by:
                val = request.headers.get(header, "")
                key_parts.append(f"h:{header}={val}")

        key_str = "|".join(key_parts)
        hash_digest = hashlib.sha256(key_str.encode('utf-8')).hexdigest()

        return f"{self.prefix}:{hash_digest}"

    async def get_response(self, key: str) -> Optional[Dict]:
        """Get cached response"""
        with MetricsContext("get"):
            try:
                data = await self.redis.get(key)
                if data:
                    global_metrics.increment_hit()
                    return json.loads(data)
                global_metrics.increment_miss()
                return None
            except Exception as e:
                logger.error(f"Error getting response cache: {e}")
                global_metrics.increment_error()
                return None

    async def cache_response(self, key: str, response_data: Any, status_code: int, ttl: int = 300):
        """Cache API response"""
        with MetricsContext("set"):
            try:
                payload = {
                    "content": response_data,
                    "status_code": status_code,
                    "media_type": "application/json"
                }
                serialized = json.dumps(payload)
                await self.redis.set(key, serialized, ex=ttl)
                global_metrics.increment_write()
            except Exception as e:
                logger.error(f"Error caching response: {e}")
                global_metrics.increment_error()
