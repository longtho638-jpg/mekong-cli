"""Mekong CLI - Autonomous Scheduler.

Background scheduler for recurring missions (Auto-Pilot).
Supports interval (every X seconds) and daily (at HH:MM) job types.
Persists jobs to .mekong/schedule.yaml and emits events to EventBus.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from src.core.event_bus import EventType, get_event_bus


@dataclass
class ScheduledJob:
    """A single scheduled job."""

    id: str
    name: str
    goal: str
    job_type: str  # "interval" or "daily"
    interval_seconds: int = 0  # For interval jobs
    daily_time: str = ""  # "HH:MM" for daily jobs
    enabled: bool = True
    last_run: float = 0.0
    next_run: float = 0.0
    run_count: int = 0


class Scheduler:
    """Autonomous scheduler for recurring Mekong missions."""

    def __init__(self, config_path: str | None = None) -> None:
        """Initialize Scheduler and load persisted jobs from disk.

        Args:
            config_path: Path to the YAML config file. Defaults to .mekong/schedule.yaml.

        """
        self._jobs: dict[str, ScheduledJob] = {}
        self._config_path = config_path or str(
            Path(".mekong") / "schedule.yaml",
        )
        self._running = False
        self._run_callback: Callable[[str], dict[str, Any]] | None = None
        self._load()

    def add_job(
        self,
        name: str,
        goal: str,
        job_type: str = "interval",
        interval_seconds: int = 300,
        daily_time: str = "09:00",
    ) -> ScheduledJob:
        """Add a new scheduled job."""
        job_id = uuid.uuid4().hex[:8]
        now = time.time()

        if job_type == "daily":
            next_run = self._next_daily_run(daily_time)
        else:
            next_run = now + interval_seconds

        job = ScheduledJob(
            id=job_id,
            name=name,
            goal=goal,
            job_type=job_type,
            interval_seconds=interval_seconds,
            daily_time=daily_time,
            next_run=next_run,
        )
        self._jobs[job_id] = job
        self._save()
        return job

    def remove_job(self, job_id: str) -> bool:
        """Remove a job. Returns True if found."""
        if job_id in self._jobs:
            del self._jobs[job_id]
            self._save()
            return True
        return False

    def list_jobs(self) -> list[ScheduledJob]:
        """Return all scheduled jobs."""
        return list(self._jobs.values())

    def get_job(self, job_id: str) -> ScheduledJob | None:
        """Get a job by ID."""
        return self._jobs.get(job_id)

    def get_due_jobs(self) -> list[ScheduledJob]:
        """Return jobs that are due to run now."""
        now = time.time()
        return [
            j for j in self._jobs.values()
            if j.enabled and j.next_run <= now
        ]

    def mark_completed(self, job: ScheduledJob) -> None:
        """Mark a job as completed and schedule next run."""
        now = time.time()
        job.last_run = now
        job.run_count += 1

        if job.job_type == "daily":
            job.next_run = self._next_daily_run(job.daily_time)
        else:
            job.next_run = now + job.interval_seconds

        self._save()

    def set_run_callback(self, callback: Callable[[str], dict[str, Any]]) -> None:
        """Set the function called to execute a goal."""
        self._run_callback = callback

    @property
    def is_running(self) -> bool:
        """Whether the scheduler loop is currently active."""
        return self._running

    @property
    def job_count(self) -> int:
        """Total number of registered jobs."""
        return len(self._jobs)

    async def tick(self) -> list[dict[str, Any]]:
        """Check for due jobs and execute them. Returns results."""
        results: list[dict[str, Any]] = []
        due = self.get_due_jobs()
        bus = get_event_bus()

        for job in due:
            bus.emit(EventType.JOB_STARTED, {
                "job_id": job.id,
                "job_name": job.name,
                "goal": job.goal,
                "source": "scheduler",
            })

            result: dict[str, Any] = {"job_id": job.id, "status": "skipped"}
            if self._run_callback:
                try:
                    result = self._run_callback(job.goal)
                    result["job_id"] = job.id
                except Exception as e:
                    result = {"job_id": job.id, "status": "error", "error": str(e)}

            bus.emit(EventType.JOB_COMPLETED, {
                "job_id": job.id,
                "job_name": job.name,
                "result": result,
            })

            self.mark_completed(job)
            results.append(result)

        return results

    async def run_loop(self, check_interval: float = 60.0) -> None:
        """Run the scheduler loop (call from asyncio context)."""
        self._running = True
        try:
            while self._running:
                await self.tick()
                await asyncio.sleep(check_interval)
        finally:
            self._running = False

    def stop(self) -> None:
        """Signal the scheduler loop to stop after the current tick completes."""
        self._running = False

    @staticmethod
    def _next_daily_run(time_str: str) -> float:
        """Calculate next run timestamp for a daily HH:MM job."""
        try:
            hour, minute = map(int, time_str.split(":"))
        except (ValueError, AttributeError):
            hour, minute = 9, 0

        now = datetime.now()
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        return target.timestamp()

    def _save(self) -> None:
        """Persist schedule to YAML file."""
        path = Path(self._config_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        lines = ["# Mekong Schedule\njobs:\n"]
        for job in self._jobs.values():
            lines.append(f"  - id: {job.id}\n")
            lines.append(f"    name: {job.name}\n")
            lines.append(f"    goal: {job.goal}\n")
            lines.append(f"    job_type: {job.job_type}\n")
            lines.append(f"    interval_seconds: {job.interval_seconds}\n")
            lines.append(f'    daily_time: "{job.daily_time}"\n')
            lines.append(f"    enabled: {str(job.enabled).lower()}\n")
            lines.append(f"    last_run: {job.last_run}\n")
            lines.append(f"    next_run: {job.next_run}\n")
            lines.append(f"    run_count: {job.run_count}\n")
        path.write_text("".join(lines), encoding="utf-8")

    def _load(self) -> None:
        """Load schedule from YAML file if it exists."""
        path = Path(self._config_path)
        if not path.exists():
            return

        try:
            import yaml  # type: ignore[import-untyped]
        except ImportError:
            return

        try:
            raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except Exception:
            return

        for entry in raw.get("jobs") or []:
            job = ScheduledJob(
                id=str(entry.get("id", "")),
                name=str(entry.get("name", "")),
                goal=str(entry.get("goal", "")),
                job_type=str(entry.get("job_type", "interval")),
                interval_seconds=int(entry.get("interval_seconds", 300)),
                daily_time=str(entry.get("daily_time", "09:00")),
                enabled=bool(entry.get("enabled", True)),
                last_run=float(entry.get("last_run", 0.0)),
                next_run=float(entry.get("next_run", 0.0)),
                run_count=int(entry.get("run_count", 0)),
            )
            if job.id:
                self._jobs[job.id] = job


__all__ = ["ScheduledJob", "Scheduler"]
