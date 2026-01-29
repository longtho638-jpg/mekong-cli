"""
Session Cache Service
Specialized cache for user sessions and authentication tokens.
Strategy: Write-Through (High availability required)
"""

import json
import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis

from backend.services.cache.metrics import MetricsContext, global_metrics

logger = logging.getLogger(__name__)


class SessionCache:
    def __init__(
        self, redis_client: redis.Redis, prefix: str = "session", default_ttl: int = 86400
    ):
        self.redis = redis_client
        self.prefix = prefix
        self.default_ttl = default_ttl

    def _make_key(self, session_id: str) -> str:
        return f"{self.prefix}:{session_id}"

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data"""
        key = self._make_key(session_id)
        with MetricsContext("get"):
            try:
                data = await self.redis.get(key)
                if data:
                    global_metrics.increment_hit()
                    # Refresh TTL on access (sliding expiration)
                    await self.redis.expire(key, self.default_ttl)
                    return json.loads(data)

                global_metrics.increment_miss()
                return None
            except Exception as e:
                logger.error(f"Error getting session {session_id}: {e}")
                global_metrics.increment_error()
                return None

    async def save_session(self, session_id: str, data: Dict[str, Any], ttl: int = None) -> bool:
        """Save or update session data"""
        key = self._make_key(session_id)
        expiry = ttl if ttl is not None else self.default_ttl

        with MetricsContext("set"):
            try:
                serialized = json.dumps(data)
                await self.redis.set(key, serialized, ex=expiry)
                global_metrics.increment_write()
                return True
            except Exception as e:
                logger.error(f"Error saving session {session_id}: {e}")
                global_metrics.increment_error()
                return False

    async def delete_session(self, session_id: str) -> bool:
        """Invalidate session"""
        key = self._make_key(session_id)
        with MetricsContext("delete"):
            try:
                await self.redis.delete(key)
                global_metrics.increment_delete()
                return True
            except Exception as e:
                logger.error(f"Error deleting session {session_id}: {e}")
                global_metrics.increment_error()
                return False

    async def exists(self, session_id: str) -> bool:
        """Check if session exists"""
        key = self._make_key(session_id)
        try:
            return await self.redis.exists(key) > 0
        except Exception:
            return False
