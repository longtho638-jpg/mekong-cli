"""
Distributed Queue Configuration.

This module defines configuration constants and default settings.
"""

from .models import JobPriority

# Default Redis URL
DEFAULT_REDIS_URL = "redis://localhost:6379"

# Default worker settings
DEFAULT_MAX_WORKERS = 10
DEFAULT_FALLBACK_TO_MEMORY = True

# Job timeouts by priority (in seconds)
DEFAULT_JOB_TIMEOUTS = {
    JobPriority.CRITICAL: 300,      # 5 minutes
    JobPriority.HIGH: 600,          # 10 minutes
    JobPriority.NORMAL: 1800,       # 30 minutes
    JobPriority.LOW: 3600,          # 1 hour
    JobPriority.BACKGROUND: 7200    # 2 hours
}

# Redis Queue Key Names
PRIORITY_QUEUES = {
    JobPriority.CRITICAL: "critical_jobs",
    JobPriority.HIGH: "high_priority_jobs",
    JobPriority.NORMAL: "normal_jobs",
    JobPriority.LOW: "low_priority_jobs",
    JobPriority.BACKGROUND: "background_jobs"
}

# Queue priorities for ordered checking
PRIORITY_ORDER = [
    JobPriority.CRITICAL,
    JobPriority.HIGH,
    JobPriority.NORMAL,
    JobPriority.LOW,
    JobPriority.BACKGROUND
]
