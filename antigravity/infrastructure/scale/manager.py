"""
Scale Infrastructure - Manager.
===============================

Main ScaleManager orchestration class.
"""

import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, List

from .connection_pool import ConnectionPool
from .enums import ScaleMode
from .models import QueuedTask, WorkerPool
from .task_queue import TaskQueue

logger = logging.getLogger(__name__)


class ScaleManager:
    """
    Horizontal Scaling Manager.

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
            logger.warning("VIRAL MODE activated - doubled connection pools")

        elif mode == ScaleMode.MAINTENANCE:
            for pool in self.connection_pools.values():
                pool.max_connections = pool.max_connections // 2
            logger.info("MAINTENANCE MODE - reduced capacity")

        logger.info(f"Scale mode changed: {old_mode.value} -> {mode.value}")

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
                    queue.mark_processed()
                except Exception as e:
                    queue.mark_failed()
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
