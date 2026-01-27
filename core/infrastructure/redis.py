"""
Redis Client Infrastructure
===========================

Centralized Redis client provider.
"""
import logging
from typing import Optional

try:
    from redis import ConnectionError, Redis
except ImportError:
    Redis = None
    ConnectionError = None

from core.config import get_settings

logger = logging.getLogger(__name__)

_redis_instance: Optional["Redis"] = None

def get_redis_client() -> "Redis":
    """
    Get or create a singleton Redis client.
    """
    global _redis_instance

    if _redis_instance:
        return _redis_instance

    if not Redis:
        logger.warning("redis-py not installed. Redis features disabled.")
        return None

    settings = get_settings()
    redis_url = settings.REDIS_URL

    if not redis_url:
        logger.warning("REDIS_URL not set. Using default localhost.")
        redis_url = "redis://localhost:6379/0"

    try:
        # decode_responses=True ensures we get str instead of bytes
        _redis_instance = Redis.from_url(redis_url, decode_responses=True)
        # Quick ping to verify connection?
        # Ideally lazily, but good to know if it fails.
        # _redis_instance.ping()
        logger.info(f"✅ Redis client initialized: {redis_url}")
        return _redis_instance
    except Exception as e:
        logger.error(f"❌ Failed to initialize Redis: {e}")
        return None
