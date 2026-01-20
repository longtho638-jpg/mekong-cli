"""
Queue Manager - Central coordination for distributed queue (Facade)
"""

import logging
from typing import Any, Dict, Optional

from .backends.base import QueueBackend
from .backends.memory_backend import MemoryBackend
from .backends.redis_backend import RedisBackend
from .config import DEFAULT_FALLBACK_TO_MEMORY, DEFAULT_REDIS_URL
from .models import Job, JobPriority, QueueStats
from .producer import QueueProducer
from .consumer import QueueConsumer

logger = logging.getLogger(__name__)

class QueueManager:
    """
    Manages job queue operations using configured backend.
    """

    def __init__(
        self,
        redis_url: str = DEFAULT_REDIS_URL,
        fallback_to_memory: bool = DEFAULT_FALLBACK_TO_MEMORY
    ):
        self.redis_url = redis_url
        self.fallback_to_memory = fallback_to_memory
        self.backend: Optional[QueueBackend] = None
        self.redis_available = False

        self._initialize_backend()
        self.producer = QueueProducer(self.backend)
        self.consumer = QueueConsumer(self.backend)

    def _initialize_backend(self):
        """Initialize appropriate backend based on configuration and availability."""
        redis_backend = RedisBackend(self.redis_url)
        if redis_backend.connect():
            self.backend = redis_backend
            self.redis_available = True
            logger.info("QueueManager initialized with Redis backend")
            return

        if self.fallback_to_memory:
            logger.warning("Redis unavailable. Falling back to Memory backend.")
            self.backend = MemoryBackend()
            self.backend.connect()
            self.redis_available = False
        else:
            logger.error("Redis unavailable and fallback disabled.")
            self.backend = None

    def submit_job(self, **kwargs) -> Optional[str]:
        return self.producer.submit_job(**kwargs)

    def get_next_job(self, **kwargs) -> Optional[Job]:
        return self.consumer.get_next_job(**kwargs)

    def complete_job(self, **kwargs) -> bool:
        return self.consumer.complete_job(**kwargs)

    def fail_job(self, **kwargs) -> bool:
        return self.consumer.fail_job(**kwargs)

    def timeout_job(self, **kwargs) -> bool:
        return self.consumer.timeout_job(**kwargs)

    def get_stats(self) -> QueueStats:
        """Get current queue statistics."""
        if self.backend:
            return self.backend.get_stats()
        return QueueStats()
