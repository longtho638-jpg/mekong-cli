"""
Distributed Queue System - Facade.

This module provides backward compatibility by re-exporting the new modular implementation
from `antigravity.infrastructure.distributed_queue`.

Original Docstring:
🌐 Distributed Queue System - Redis-Based Job Processing
===================================================

High-performance distributed queue with Redis backend:
- Dead letter queue for failed jobs
- Priority-based job scheduling
- Job orchestration across multiple workers
- SLA guarantees with timeout and retry
- Performance monitoring and analytics
"""

from .distributed_queue import (
    DistributedQueue,
    Job,
    JobPriority,
    JobStatus,
    QueueStats,
    complete_job,
    distributed_queue,
    export_queue_state,
    get_next_job,
    get_queue_stats,
    submit_job,
)

__all__ = [
    "DistributedQueue",
    "Job",
    "JobPriority",
    "JobStatus",
    "QueueStats",
    "distributed_queue",
    "submit_job",
    "get_next_job",
    "complete_job",
    "get_queue_stats",
    "export_queue_state",
]
