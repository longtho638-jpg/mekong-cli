"""
Redis Backend Facade.
"""
from .manager import RedisManager
from .operations import RedisOperations
from .stats import RedisStats


class RedisBackend(RedisOperations, RedisStats):
    """Redis-based implementation of queue backend."""
    def __init__(self, redis_url: str = None):
        # We need to handle the default here or in manager
        from ..config import DEFAULT_REDIS_URL
        url = redis_url or DEFAULT_REDIS_URL
        super().__init__(url)
