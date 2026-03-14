"""
Worker Pool — Manage multiple daemon workers with spawn/monitor/retire.

Features:
- Dynamic worker spawning via PM2
- Health checks every 30 seconds
- Auto-restart on failure
- Load tracking for load balancer
"""

from __future__ import annotations

import json
import logging
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"


class WorkerState(Enum):
    """Worker lifecycle states."""

    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    ERRORED = "errored"
    STOPPING = "stopping"


@dataclass
class WorkerInfo:
    """Information about a single worker."""

    id: str
    name: str
    capability: str  # builder, reviewer, tester, etc.
    state: WorkerState = WorkerState.IDLE
    pid: int | None = None
    cpu: float = 0.0
    memory_mb: float = 0.0
    tasks_completed: int = 0
    tasks_failed: int = 0
    last_heartbeat: str = ""
    started_at: str = ""


@dataclass
class WorkerPoolStats:
    """Aggregate statistics for the worker pool."""

    total_workers: int = 0
    idle_workers: int = 0
    busy_workers: int = 0
    offline_workers: int = 0
    avg_cpu: float = 0.0
    avg_memory_mb: float = 0.0
    total_tasks_completed: int = 0
    total_tasks_failed: int = 0


class WorkerPool:
    """
    Manages a pool of daemon workers.

    Usage:
        pool = WorkerPool()
        pool.spawn("builder-1", capability="builder")
        stats = pool.get_stats()
        worker = pool.get_available_worker(capability="builder")
        pool.retire("builder-1")
    """

    def __init__(self) -> None:
        self.workers: dict[str, WorkerInfo] = {}
        self._health_check_interval = 30  # seconds
        self._last_health_check = 0.0

    def _run_pm2(self, args: list[str]) -> subprocess.CompletedProcess:
        """Run PM2 command."""
        env = {**__import__("os").environ, "MEKONG_ROOT": str(MEKONG_ROOT)}
        return subprocess.run(
            ["pm2"] + args,
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )

    def spawn(
        self,
        name: str,
        capability: str,
        script: str,
        args: str = "",
        max_memory: str = "200M",
    ) -> bool:
        """
        Spawn a new worker via PM2.

        Args:
            name: Worker name (e.g., "builder-1")
            capability: Worker capability (builder, reviewer, tester)
            script: Script path to run
            args: Command line arguments
            max_memory: Max memory restart threshold

        Returns:
            True if spawned successfully, False otherwise.
        """
        cmd = ["pm2", "start", script]
        if args:
            cmd.extend(["--", args])
        cmd.extend(["--name", name])

        result = self._run_pm2(cmd)
        if result.returncode == 0:
            self.workers[name] = WorkerInfo(
                id=name,
                name=name,
                capability=capability,
                state=WorkerState.IDLE,
                started_at=datetime.now().isoformat(),
            )
            logger.info(f"[WorkerPool] Spawned {name} (capability={capability})")
            return True
        else:
            logger.error(f"[WorkerPool] Failed to spawn {name}: {result.stderr}")
            return False

    def retire(self, name: str) -> bool:
        """
        Retire a worker (stop and remove from pool).

        Args:
            name: Worker name to retire

        Returns:
            True if retired successfully, False otherwise.
        """
        result = self._run_pm2(["stop", name])
        if result.returncode == 0:
            self._run_pm2(["delete", name])
            if name in self.workers:
                del self.workers[name]
            logger.info(f"[WorkerPool] Retired {name}")
            return True
        else:
            logger.error(f"[WorkerPool] Failed to retire {name}: {result.stderr}")
            return False

    def get_available_worker(self, capability: str | None = None) -> WorkerInfo | None:
        """
        Get an available (idle) worker, optionally filtered by capability.

        Args:
            capability: Optional capability filter

        Returns:
            WorkerInfo if available, None otherwise.
        """
        self.refresh_status()

        for worker in self.workers.values():
            if worker.state != WorkerState.IDLE:
                continue
            if capability and worker.capability != capability:
                continue
            return worker

        return None

    def mark_busy(self, name: str) -> None:
        """Mark a worker as busy."""
        if name in self.workers:
            self.workers[name].state = WorkerState.BUSY
            logger.debug(f"[WorkerPool] Marked {name} as busy")

    def mark_idle(self, name: str) -> None:
        """Mark a worker as idle after completing a task."""
        if name in self.workers:
            self.workers[name].state = WorkerState.IDLE
            self.workers[name].tasks_completed += 1
            self.workers[name].last_heartbeat = datetime.now().isoformat()
            logger.debug(f"[WorkerPool] Marked {name} as idle")

    def mark_failed(self, name: str) -> None:
        """Mark a worker as failed."""
        if name in self.workers:
            self.workers[name].state = WorkerState.ERRORED
            self.workers[name].tasks_failed += 1
            logger.warning(f"[WorkerPool] Marked {name} as failed")

    def refresh_status(self) -> None:
        """Refresh worker status from PM2."""
        result = self._run_pm2(["jlist"])
        if result.returncode != 0 or not result.stdout.strip():
            # Mark all as offline
            for worker in self.workers.values():
                worker.state = WorkerState.OFFLINE
            return

        try:
            processes = json.loads(result.stdout)
        except json.JSONDecodeError:
            logger.exception("PM2 returned invalid JSON")
            return

        # Update existing workers
        for p in processes:
            name = p.get("pm2_env", {}).get("name", "")
            if name not in self.workers:
                continue

            worker = self.workers[name]
            status = p.get("pm2_env", {}).get("status", "unknown")
            monit = p.get("monit", {})

            worker.pid = p.get("pid")
            worker.cpu = monit.get("cpu", 0.0)
            worker.memory_mb = monit.get("memory", 0) / 1024 / 1024

            if status == "online":
                if worker.state == WorkerState.OFFLINE:
                    worker.state = WorkerState.IDLE  # Recovered
            elif status == "errored":
                worker.state = WorkerState.ERRORED
            elif status == "stopping":
                worker.state = WorkerState.STOPPING
            else:
                worker.state = WorkerState.OFFLINE

            worker.last_heartbeat = datetime.now().isoformat()

    def get_stats(self) -> WorkerPoolStats:
        """Get aggregate statistics for the worker pool."""
        self.refresh_status()

        stats = WorkerPoolStats(
            total_workers=len(self.workers),
            idle_workers=sum(1 for w in self.workers.values() if w.state == WorkerState.IDLE),
            busy_workers=sum(1 for w in self.workers.values() if w.state == WorkerState.BUSY),
            offline_workers=sum(1 for w in self.workers.values() if w.state == WorkerState.OFFLINE),
        )

        if self.workers:
            stats.avg_cpu = sum(w.cpu for w in self.workers.values()) / len(self.workers)
            stats.avg_memory_mb = sum(w.memory_mb for w in self.workers.values()) / len(self.workers)
            stats.total_tasks_completed = sum(w.tasks_completed for w in self.workers.values())
            stats.total_tasks_failed = sum(w.tasks_failed for w in self.workers.values())

        return stats

    def health_check(self) -> dict[str, Any]:
        """
        Perform health check on all workers.

        Returns:
            Dictionary with health status for each worker.
        """
        self.refresh_status()
        health = {"healthy": [], "degraded": [], "unhealthy": []}

        for worker in self.workers.values():
            if worker.state in [WorkerState.IDLE, WorkerState.BUSY]:
                health["healthy"].append(worker.name)
            elif worker.state == WorkerState.ERRORED:
                health["degraded"].append(worker.name)
            else:
                health["unhealthy"].append(worker.name)

        self._last_health_check = time.time()
        return health

    def list_workers(self) -> list[WorkerInfo]:
        """Get list of all workers."""
        self.refresh_status()
        return list(self.workers.values())
