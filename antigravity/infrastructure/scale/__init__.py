"""
Scale Infrastructure Package.
=============================

Re-exports all scaling components.
"""

from .connection_pool import ConnectionPool
from .enums import ScaleMode
from .manager import ScaleManager
from .models import QueuedTask, WorkerPool
from .task_queue import TaskQueue

# Global singleton
_scale_manager = ScaleManager()


def get_scale_manager() -> ScaleManager:
    """Get global scale manager."""
    return _scale_manager


# Convenience functions
def enqueue_webhook(webhook_type: str, payload: dict) -> str:
    return _scale_manager.enqueue_webhook(webhook_type, payload)


def enqueue_email(email_type: str, recipient: str, data: dict) -> str:
    return _scale_manager.enqueue_email(email_type, recipient, data)


def get_scale_status() -> dict:
    return _scale_manager.get_status()


__all__ = [
    # Enums
    "ScaleMode",
    # Models
    "QueuedTask",
    "WorkerPool",
    # Classes
    "ConnectionPool",
    "TaskQueue",
    "ScaleManager",
    # Global
    "get_scale_manager",
    # Convenience functions
    "enqueue_webhook",
    "enqueue_email",
    "get_scale_status",
]
