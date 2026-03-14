"""
Mission Control — Daemon army status, metrics, and dispatch queue.

Provides real-time visibility into daemon operations:
- Worker status (online/offline/errored)
- Performance metrics (throughput, success rate, queue depth)
- Dispatch queue (pending/active/completed tasks)
"""

from __future__ import annotations

import json
import logging
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"
JOURNAL_DIR = MEKONG_DIR / "journal"
JIDOKA_FILE = MEKONG_DIR / "jidoka-alerts.log"

# Ensure directories exist
JOURNAL_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class WorkerStatus:
    """Status of a single worker daemon."""

    name: str
    status: str  # online, offline, errored, stopping
    cpu: float
    memory_mb: float
    uptime_ms: int
    restarts: int
    pid: int | None = None


@dataclass
class DaemonMetrics:
    """Aggregate metrics for the daemon army."""

    total_workers: int = 0
    online_workers: int = 0
    throughput_per_minute: float = 0.0
    success_rate: float = 0.0
    queue_depth: int = 0
    avg_response_time_ms: float = 0.0
    last_updated: str = ""


@dataclass
class QueueItem:
    """Item in the dispatch queue."""

    task_id: str
    description: str
    priority: str  # CRITICAL, HIGH, MEDIUM, LOW
    status: str  # pending, active, completed, failed
    assigned_to: str | None = None
    created_at: str = ""
    started_at: str | None = None
    completed_at: str | None = None


def _run_pm2(args: list[str]) -> subprocess.CompletedProcess:
    """Run PM2 command and return result."""
    env = {**__import__("os").environ, "MEKONG_ROOT": str(MEKONG_ROOT)}
    return subprocess.run(
        ["pm2"] + args,
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )


def get_worker_status() -> list[WorkerStatus]:
    """
    Query PM2 for all worker statuses.

    Returns:
        List of WorkerStatus objects for each daemon.
    """
    result = _run_pm2(["jlist"])
    if result.returncode != 0 or not result.stdout.strip():
        logger.warning("PM2 not running or no processes found")
        return []

    try:
        processes = json.loads(result.stdout)
    except json.JSONDecodeError:
        logger.exception("PM2 returned invalid JSON")
        return []

    workers = []
    for p in processes:
        pm2_env = p.get("pm2_env", {})
        monit = p.get("monit", {})

        name = pm2_env.get("name", "?")
        # Only include daemon-related processes
        if not any(
            keyword in name.lower()
            for keyword in ["worker", "daemon", "dispatcher", "scheduler", "heartbeat", "jidoka", "learning"]
        ):
            continue

        status = pm2_env.get("status", "unknown")
        cpu = monit.get("cpu", 0.0)
        mem_bytes = monit.get("memory", 0)
        memory_mb = mem_bytes / 1024 / 1024
        uptime_ms = pm2_env.get("pm_uptime", 0)
        restarts = pm2_env.get("restart_time", 0)
        pid = p.get("pid")

        workers.append(
            WorkerStatus(
                name=name,
                status=status,
                cpu=cpu,
                memory_mb=memory_mb,
                uptime_ms=uptime_ms,
                restarts=restarts,
                pid=pid,
            )
        )

    return workers


def get_metrics() -> DaemonMetrics:
    """
    Get aggregate metrics for the daemon army.

    Returns:
        DaemonMetrics object with aggregated statistics.
    """
    workers = get_worker_status()
    metrics = DaemonMetrics(
        total_workers=len(workers),
        online_workers=sum(1 for w in workers if w.status == "online"),
        last_updated=datetime.now().isoformat(),
    )

    # Calculate throughput from journal
    metrics.throughput_per_minute = _calculate_throughput()
    metrics.success_rate = _calculate_success_rate()
    metrics.queue_depth = _get_queue_depth()
    metrics.avg_response_time_ms = _calculate_avg_response_time()

    return metrics


def _calculate_throughput() -> float:
    """Calculate tasks completed per minute from journal."""
    journal_file = JOURNAL_DIR / "missions.json"
    if not journal_file.exists():
        return 0.0

    try:
        data = json.loads(journal_file.read_text())
        missions = data.get("missions", [])
        if not missions:
            return 0.0

        # Count missions in last hour
        now = datetime.now()
        recent = [
            m
            for m in missions
            if m.get("completed_at")
            and (now - datetime.fromisoformat(m["completed_at"])).total_seconds() < 3600
        ]

        if not recent:
            return 0.0

        # Calculate time span
        first_time = datetime.fromisoformat(recent[0]["completed_at"])
        last_time = datetime.fromisoformat(recent[-1]["completed_at"])
        span_minutes = max((last_time - first_time).total_seconds() / 60, 1)

        return round(len(recent) / span_minutes, 2)
    except (json.JSONDecodeError, KeyError, ValueError):
        logger.exception("Failed to calculate throughput")
        return 0.0


def _calculate_success_rate() -> float:
    """Calculate success rate from journal."""
    journal_file = JOURNAL_DIR / "missions.json"
    if not journal_file.exists():
        return 100.0

    try:
        data = json.loads(journal_file.read_text())
        missions = data.get("missions", [])
        if not missions:
            return 100.0

        # Only consider last 100 missions
        recent = missions[-100:]
        successful = sum(1 for m in recent if m.get("status") == "success")

        return round(successful / len(recent) * 100, 2)
    except (json.JSONDecodeError, KeyError):
        logger.exception("Failed to calculate success rate")
        return 0.0


def _get_queue_depth() -> int:
    """Get current queue depth from journal."""
    journal_file = JOURNAL_DIR / "missions.json"
    if not journal_file.exists():
        return 0

    try:
        data = json.loads(journal_file.read_text())
        missions = data.get("missions", [])
        pending = sum(1 for m in missions if m.get("status") in ["pending", "active"])
        return pending
    except (json.JSONDecodeError, KeyError):
        return 0


def _calculate_avg_response_time() -> float:
    """Calculate average response time from journal."""
    journal_file = JOURNAL_DIR / "missions.json"
    if not journal_file.exists():
        return 0.0

    try:
        data = json.loads(journal_file.read_text())
        missions = data.get("missions", [])
        if not missions:
            return 0.0

        # Only consider last 50 missions
        recent = missions[-50:]
        times = [m.get("duration_ms", 0) for m in recent if m.get("duration_ms")]

        if not times:
            return 0.0

        return round(sum(times) / len(times), 2)
    except (json.JSONDecodeError, KeyError):
        return 0.0


def get_dispatch_queue() -> list[QueueItem]:
    """
    Get current dispatch queue.

    Returns:
        List of QueueItem objects sorted by priority.
    """
    journal_file = JOURNAL_DIR / "missions.json"
    if not journal_file.exists():
        return []

    try:
        data = json.loads(journal_file.read_text())
        missions = data.get("missions", [])

        # Only show pending/active tasks
        queue_items = []
        for m in missions:
            if m.get("status") not in ["pending", "active"]:
                continue

            queue_items.append(
                QueueItem(
                    task_id=m.get("task_id", "?"),
                    description=m.get("description", "Unknown task")[:100],
                    priority=m.get("priority", "MEDIUM"),
                    status=m.get("status", "pending"),
                    assigned_to=m.get("assigned_to"),
                    created_at=m.get("created_at", ""),
                    started_at=m.get("started_at"),
                    completed_at=m.get("completed_at"),
                )
            )

        # Sort by priority
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        queue_items.sort(key=lambda x: priority_order.get(x.priority, 2))

        return queue_items
    except (json.JSONDecodeError, KeyError):
        logger.exception("Failed to get dispatch queue")
        return []


def get_recent_alerts(limit: int = 10) -> list[str]:
    """
    Get recent Jidoka alerts.

    Args:
        limit: Maximum number of alerts to return.

    Returns:
        List of recent alert messages.
    """
    if not JIDOKA_FILE.exists():
        return []

    try:
        lines = JIDOKA_FILE.read_text().strip().split("\n")
        return lines[-limit:]
    except Exception:
        logger.exception("Failed to read Jidoka alerts")
        return []


def get_status_summary() -> dict[str, Any]:
    """
    Get complete status summary for API response.

    Returns:
        Dictionary with workers, metrics, and queue.
    """
    workers = get_worker_status()
    metrics = get_metrics()
    queue = get_dispatch_queue()
    alerts = get_recent_alerts(5)

    return {
        "timestamp": datetime.now().isoformat(),
        "workers": [
            {
                "name": w.name,
                "status": w.status,
                "cpu": w.cpu,
                "memory_mb": w.memory_mb,
                "uptime_ms": w.uptime_ms,
                "restarts": w.restarts,
                "pid": w.pid,
            }
            for w in workers
        ],
        "metrics": {
            "total_workers": metrics.total_workers,
            "online_workers": metrics.online_workers,
            "throughput_per_minute": metrics.throughput_per_minute,
            "success_rate": metrics.success_rate,
            "queue_depth": metrics.queue_depth,
            "avg_response_time_ms": metrics.avg_response_time_ms,
            "last_updated": metrics.last_updated,
        },
        "queue": [
            {
                "task_id": q.task_id,
                "description": q.description,
                "priority": q.priority,
                "status": q.status,
                "assigned_to": q.assigned_to,
                "created_at": q.created_at,
            }
            for q in queue[:20]  # Limit to 20 items
        ],
        "recent_alerts": alerts,
    }
