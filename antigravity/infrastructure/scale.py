"""
📈 ScaleManager - Horizontal Scaling Infrastructure
====================================================

Stateless design, queue processing, connection pooling.
Ready for cloud-native horizontal scaling when viral.

Binh Pháp: "Thiên" - Timing and scale readiness
"""

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from queue import Empty, Queue
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class ScaleMode(Enum):
    """Scaling modes."""

    NORMAL = "normal"  # Standard operation
    BURST = "burst"  # Handle traffic spikes
    VIRAL = "viral"  # Maximum scale mode
    MAINTENANCE = "maintenance"  # Reduced capacity


@dataclass
class QueuedTask:
    """Task in processing queue."""

    id: str
    task_type: str
    payload: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    priority: int = 5  # 1=highest, 10=lowest
    retries: int = 0
    max_retries: int = 3


@dataclass
class WorkerPool:
    """Worker pool for task processing."""

    name: str
    size: int
    active_workers: int = 0
    tasks_processed: int = 0
    tasks_failed: int = 0


class ConnectionPool:
    """HTTP connection pool for external services."""

    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self.active_connections = 0
        self._lock = threading.Lock()

    def acquire(self) -> bool:
        """Acquire a connection from pool."""
        with self._lock:
            if self.active_connections < self.max_connections:
                self.active_connections += 1
                return True
            return False

    def release(self):
        """Release connection back to pool."""
        with self._lock:
            if self.active_connections > 0:
                self.active_connections -= 1

    def get_stats(self) -> Dict[str, int]:
        """Get pool statistics."""
        return {
            "max": self.max_connections,
            "active": self.active_connections,
            "available": self.max_connections - self.active_connections,
        }


class TaskQueue:
    """Priority queue for background task processing."""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._queue: Queue = Queue(maxsize=max_size)
        self._processed = 0
        self._failed = 0

    def enqueue(self, task: QueuedTask) -> bool:
        """Add task to queue."""
        try:
            self._queue.put_nowait(task)
            return True
        except:
            logger.warning(f"Queue full, rejecting task {task.id}")
            return False

    def dequeue(self, timeout: float = 1.0) -> Optional[QueuedTask]:
        """Get next task from queue."""
        try:
            return self._queue.get(timeout=timeout)
        except Empty:
            return None

    @property
    def size(self) -> int:
        return self._queue.qsize()

    @property
    def is_full(self) -> bool:
        return self._queue.full()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "size": self.size,
            "max_size": self.max_size,
            "processed": self._processed,
            "failed": self._failed,
            "utilization": round(self.size / self.max_size * 100, 1),
        }


class ScaleManager:
    """
    📈 Horizontal Scaling Manager

    - Stateless API design
    - Queue-based background processing
    - Connection pooling for external calls
    """

    def __init__(self):
        self.mode = ScaleMode.NORMAL
        self.connection_pools: Dict[str, ConnectionPool] = {}
        self.task_queues: Dict[str, TaskQueue] = {}
        self.worker_pools: Dict[str, WorkerPool] = {}
        self._executor = ThreadPoolExecutor(max_workers=10)
        self._running = False

        # Initialize default pools
        self._init_defaults()

    def _init_defaults(self):
        """Initialize default pools."""
        # Connection pools
        self.connection_pools = {
            "api": ConnectionPool(100),
            "database": ConnectionPool(20),
            "external": ConnectionPool(50),
        }

        # Task queues
        self.task_queues = {
            "webhooks": TaskQueue(500),
            "emails": TaskQueue(1000),
            "analytics": TaskQueue(2000),
        }

        # Worker pools
        self.worker_pools = {
            "webhooks": WorkerPool("webhooks", 5),
            "emails": WorkerPool("emails", 3),
            "analytics": WorkerPool("analytics", 2),
        }

    def set_mode(self, mode: ScaleMode):
        """Set scaling mode."""
        old_mode = self.mode
        self.mode = mode

        # Adjust resources based on mode
        if mode == ScaleMode.VIRAL:
            for pool in self.connection_pools.values():
                pool.max_connections *= 2
            logger.warning("🚀 VIRAL MODE activated - doubled connection pools")

        elif mode == ScaleMode.MAINTENANCE:
            for pool in self.connection_pools.values():
                pool.max_connections = pool.max_connections // 2
            logger.info("🔧 MAINTENANCE MODE - reduced capacity")

        logger.info(f"Scale mode changed: {old_mode.value} → {mode.value}")

    def get_connection(self, pool_name: str) -> bool:
        """Acquire connection from named pool."""
        pool = self.connection_pools.get(pool_name)
        if not pool:
            return False
        return pool.acquire()

    def release_connection(self, pool_name: str):
        """Release connection to named pool."""
        pool = self.connection_pools.get(pool_name)
        if pool:
            pool.release()

    def enqueue_task(self, queue_name: str, task: QueuedTask) -> bool:
        """Add task to processing queue."""
        queue = self.task_queues.get(queue_name)
        if not queue:
            logger.error(f"Unknown queue: {queue_name}")
            return False
        return queue.enqueue(task)

    def enqueue_webhook(self, webhook_type: str, payload: Dict[str, Any]) -> str:
        """Convenience method for webhook tasks."""
        import uuid

        task = QueuedTask(
            id=str(uuid.uuid4()),
            task_type=webhook_type,
            payload=payload,
            priority=1,  # High priority
        )
        self.enqueue_task("webhooks", task)
        return task.id

    def enqueue_email(
        self, email_type: str, recipient: str, data: Dict[str, Any]
    ) -> str:
        """Convenience method for email tasks."""
        import uuid

        task = QueuedTask(
            id=str(uuid.uuid4()),
            task_type=email_type,
            payload={"recipient": recipient, **data},
            priority=3,
        )
        self.enqueue_task("emails", task)
        return task.id

    async def process_queue(self, queue_name: str, handler: Callable):
        """Process tasks from queue using handler."""
        queue = self.task_queues.get(queue_name)
        if not queue:
            return

        self._running = True
        logger.info(f"Started processing queue: {queue_name}")

        while self._running:
            task = queue.dequeue(timeout=1.0)
            if task:
                try:
                    await handler(task)
                    queue._processed += 1
                except Exception as e:
                    queue._failed += 1
                    logger.error(f"Task {task.id} failed: {e}")

                    # Retry logic
                    if task.retries < task.max_retries:
                        task.retries += 1
                        queue.enqueue(task)

    def stop_processing(self):
        """Stop all queue processing."""
        self._running = False

    def get_status(self) -> Dict[str, Any]:
        """Get scale manager status."""
        return {
            "mode": self.mode.value,
            "connection_pools": {
                name: pool.get_stats() for name, pool in self.connection_pools.items()
            },
            "task_queues": {
                name: queue.get_stats() for name, queue in self.task_queues.items()
            },
            "worker_pools": {
                name: {"size": wp.size, "active": wp.active_workers}
                for name, wp in self.worker_pools.items()
            },
        }

    def check_scale_triggers(self) -> List[str]:
        """Check if scaling actions are needed."""
        triggers = []

        # Check queue depths
        for name, queue in self.task_queues.items():
            if queue.size > queue.max_size * 0.8:
                triggers.append(f"queue_{name}_high")

        # Check connection pool utilization
        for name, pool in self.connection_pools.items():
            stats = pool.get_stats()
            if stats["available"] < stats["max"] * 0.2:
                triggers.append(f"connections_{name}_low")

        return triggers


# Global singleton
_scale_manager = ScaleManager()


def get_scale_manager() -> ScaleManager:
    """Get global scale manager."""
    return _scale_manager


# Convenience functions
def enqueue_webhook(webhook_type: str, payload: Dict) -> str:
    return _scale_manager.enqueue_webhook(webhook_type, payload)


def enqueue_email(email_type: str, recipient: str, data: Dict) -> str:
    return _scale_manager.enqueue_email(email_type, recipient, data)


def get_scale_status() -> Dict:
    return _scale_manager.get_status()
