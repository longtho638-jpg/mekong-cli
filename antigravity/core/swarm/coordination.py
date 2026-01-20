"""
Swarm Coordination Utilities
============================

Helper functions for swarm status and metrics reporting.
"""

import time
from typing import TYPE_CHECKING, Dict, List

if TYPE_CHECKING:
    from .types import SwarmMetrics
    from .workers import WorkerPool
    from .messaging import TaskQueue


def calculate_throughput(task_queue: "TaskQueue") -> int:
    """Calculate tasks completed per minute."""
    all_tasks = task_queue.get_all_tasks()
    recent_completions = [
        t
        for t in all_tasks.values()
        if t.completed_at and (time.time() - t.completed_at) < 60
    ]
    return len(recent_completions)


def build_status_dict(
    running: bool,
    worker_pool: "WorkerPool",
    task_queue: "TaskQueue",
    metrics: "SwarmMetrics",
) -> Dict:
    """Build the swarm status dictionary."""
    return {
        "running": running,
        "agents": {
            a.id: {
                "name": a.name,
                "role": a.role.value,
                "busy": a.is_busy,
                "completed": a.tasks_completed,
                "failed": a.tasks_failed,
            }
            for a in worker_pool.agents.values()
        },
        "pending_tasks": task_queue.get_pending_count(),
        "metrics": {
            "total_agents": metrics.total_agents,
            "busy_agents": metrics.busy_agents,
            "completed_tasks": metrics.completed_tasks,
            "failed_tasks": metrics.failed_tasks,
            "avg_task_time": metrics.avg_task_time,
        },
    }
