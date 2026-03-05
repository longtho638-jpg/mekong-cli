"""
Mekong CLI - Telegram Inbox

Task inbox for Telegram → Antigravity relay.
"""

import json
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

INBOX_PATH = Path(".mekong/inbox.json")


def _load_inbox() -> List[Dict[str, Any]]:
    """Load inbox tasks from file."""
    if not INBOX_PATH.exists():
        return []
    try:
        result = json.loads(INBOX_PATH.read_text())
        return list(result)
    except Exception:
        return []


def _save_inbox(tasks: List[Dict[str, Any]]) -> None:
    """Save inbox tasks to file."""
    INBOX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INBOX_PATH.write_text(json.dumps(tasks, indent=2, ensure_ascii=False))


def add_task(goal: str, project: Optional[str] = None, chat_id: int = 0) -> Dict[str, Any]:
    """Add a new task to the inbox."""
    task = {
        "id": uuid.uuid4().hex[:8],
        "goal": goal,
        "project": project,
        "chat_id": chat_id,
        "status": "pending",
        "created_at": time.time(),
        "created_at_iso": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    inbox = _load_inbox()
    inbox.append(task)
    _save_inbox(inbox)
    return task


def get_pending_tasks() -> List[Dict[str, Any]]:
    """Get all pending tasks from inbox."""
    return [t for t in _load_inbox() if t.get("status") == "pending"]


def mark_task(task_id: str, status: str, result: str = "") -> None:
    """Update a task's status."""
    inbox = _load_inbox()
    for t in inbox:
        if t["id"] == task_id:
            t["status"] = status
            t["result"] = result
            t["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            break
    _save_inbox(inbox)


def enrich_task(task_id: str, **metadata: Any) -> None:
    """Enrich a task with additional metadata."""
    inbox = _load_inbox()
    for t in inbox:
        if t["id"] == task_id:
            t.update(metadata)
            break
    _save_inbox(inbox)


def get_recent_tasks(limit: int = 10) -> List[Dict[str, Any]]:
    """Get recent tasks from inbox."""
    return _load_inbox()[-limit:]


__all__ = [
    "add_task",
    "get_pending_tasks",
    "mark_task",
    "enrich_task",
    "get_recent_tasks",
    "_load_inbox",
    "_save_inbox",
]
