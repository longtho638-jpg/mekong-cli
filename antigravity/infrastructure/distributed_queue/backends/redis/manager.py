"""
Redis Connection and Core Operations.
"""

import json
import logging
import time
from typing import Any, List, Optional

from ...config import DEFAULT_REDIS_URL, PRIORITY_ORDER, PRIORITY_QUEUES
from ...models import Job, JobPriority, JobStatus, QueueStats
from ..base import QueueBackend

logger = logging.getLogger(__name__)

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class RedisManager:
    def __init__(self, redis_url: str = DEFAULT_REDIS_URL):
        self.redis_url = redis_url
        self.client = None
        self.enabled = False

    def connect(self) -> bool:
        if not REDIS_AVAILABLE:
            logger.warning("Redis library not installed.")
            return False
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=False)
            self.client.ping()
            self.enabled = True
            logger.info(f"Connected to Redis at {self.redis_url}")
            return True
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.enabled = False
            return False
