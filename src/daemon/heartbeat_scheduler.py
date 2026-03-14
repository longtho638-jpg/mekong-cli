"""
HEARTBEAT Scheduler — reads HEARTBEAT.md, executes tasks on schedule.

Two-tier processing:
  Tier 1: Script/command check (subprocess, near-zero cost)
  Tier 2: LLM agent invocation (only if Tier 1 flags action needed)

Usage:
  python3 -m src.daemon.heartbeat_scheduler
  # Or via PM2: managed by ecosystem.config.js
"""

import asyncio
import re
import subprocess
import logging
import os
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [HEARTBEAT] %(message)s")
logger = logging.getLogger("heartbeat")


@dataclass
class ScheduledTask:
    description: str
    command: Optional[str] = None
    interval_minutes: int = 60
    cron_hour: Optional[int] = None
    cron_weekday: Optional[int] = None  # 0=Monday
    last_run: Optional[datetime] = None
    workspace: str = "default"
    tier: int = 1  # 1=script, 2=LLM


@dataclass
class HeartbeatConfig:
    enabled: bool = True
    check_interval: int = 60  # seconds between scheduler checks
    max_concurrent: int = 3
    alert_on_failure: bool = True
    workspaces: list[str] = field(default_factory=lambda: ["lam"])


class HeartbeatScheduler:
    def __init__(self, project_root: str = "."):
        self.root = Path(project_root)
        self.mekong_dir = self.root / ".mekong"
        self.tasks: list[ScheduledTask] = []
        self.running: dict[str, asyncio.Task] = {}
        self.config = HeartbeatConfig()
        self._load_config()

    def _load_config(self):
        config_path = self.mekong_dir / "heartbeat-config.json"
        if config_path.exists():
            import json
            data = json.loads(config_path.read_text())
            self.config.enabled = data.get("enabled", True)
            self.config.check_interval = data.get("check_interval", 60)
            self.config.max_concurrent = data.get("max_concurrent", 3)
            self.config.workspaces = data.get("workspaces", ["lam"])

    def discover_heartbeats(self) -> list[tuple[str, Path]]:
        """Find all HEARTBEAT.md files — root + per-tenant."""
        results = []
        # Root heartbeat
        root_hb = self.root / "HEARTBEAT.md"
        if root_hb.exists():
            results.append(("root", root_hb))
        # Per-tenant heartbeats
        studio_dir = self.mekong_dir / "studio"
        if studio_dir.exists():
            for ws in studio_dir.iterdir():
                if ws.is_dir():
                    hb = ws / "HEARTBEAT.md"
                    if hb.exists():
                        results.append((ws.name, hb))
        return results

    def parse_heartbeat(self, workspace: str, hb_path: Path) -> list[ScheduledTask]:
        """Parse HEARTBEAT.md into ScheduledTask list."""
        content = hb_path.read_text()
        tasks = []
        current_interval = 60  # default 1 hour
        current_hour = None
        current_weekday = None

        for line in content.split("\n"):
            line = line.strip()

            # Parse section headers for interval
            if line.startswith("## Every 30"):
                current_interval = 30
                current_hour = None
                current_weekday = None
            elif line.startswith("## Every 1") or line.startswith("## Hourly"):
                current_interval = 60
                current_hour = None
                current_weekday = None
            elif line.startswith("## Daily") or line.startswith("## Every Day"):
                current_interval = 1440
                # Try parse time: "## Daily at 09:00"
                time_match = re.search(r"(\d{1,2}):(\d{2})", line)
                if time_match:
                    current_hour = int(time_match.group(1))
                current_weekday = None
            elif line.startswith("## Weekly"):
                current_interval = 10080
                current_weekday = 0  # Monday default
                day_match = re.search(r"(Monday|Tuesday|Wednesday|Thursday|Friday)", line, re.I)
                if day_match:
                    days = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4}
                    current_weekday = days.get(day_match.group(1).lower(), 0)
            elif line.startswith("## Monthly"):
                current_interval = 43200  # ~30 days

            # Parse task lines: "- [ ] **Name** `mekong command here`"
            task_match = re.match(r"- \[[ x]\] \*?\*?(.+?)(?:\*\*)?(?:\s+`(.+?)`)?$", line)
            if task_match:
                desc = task_match.group(1).strip().rstrip("*").strip()
                cmd = task_match.group(2)

                tasks.append(ScheduledTask(
                    description=desc,
                    command=cmd,
                    interval_minutes=current_interval,
                    cron_hour=current_hour,
                    cron_weekday=current_weekday,
                    workspace=workspace,
                    tier=1 if cmd else 2,
                ))

        return tasks

    def is_due(self, task: ScheduledTask, now: datetime) -> bool:
        """Check if task should run now."""
        if task.last_run is None:
            # First run — check time constraints
            if task.cron_hour is not None and now.hour != task.cron_hour:
                return False
            if task.cron_weekday is not None and now.weekday() != task.cron_weekday:
                return False
            return True

        elapsed = (now - task.last_run).total_seconds() / 60
        if elapsed < task.interval_minutes:
            return False

        # Check time-of-day constraint
        if task.cron_hour is not None and now.hour != task.cron_hour:
            return False
        if task.cron_weekday is not None and now.weekday() != task.cron_weekday:
            return False

        return True

    async def execute_task(self, task: ScheduledTask) -> bool:
        """Execute task — two-tier processing."""
        logger.info(f"[{task.workspace}] Executing: {task.description}")
        task.last_run = datetime.now()

        if task.tier == 1 and task.command:
            # Tier 1: Direct command execution
            try:
                result = subprocess.run(
                    task.command, shell=True, capture_output=True, text=True,
                    timeout=300, cwd=str(self.root),
                    env={**os.environ, "PYTHONPATH": str(self.root)},
                )
                if result.returncode == 0:
                    logger.info(f"[{task.workspace}] ✅ {task.description}")
                    return True
                else:
                    logger.warning(f"[{task.workspace}] ⚠️ {task.description}: exit {result.returncode}")
                    if self.config.alert_on_failure:
                        self._alert(task, result.stderr[:200])
                    return False
            except subprocess.TimeoutExpired:
                logger.error(f"[{task.workspace}] ❌ {task.description}: timeout 300s")
                return False
        else:
            # Tier 2: Needs LLM — delegate to mekong engine
            cmd = f"mekong {task.description.lower().replace(' ', '-')}"
            logger.info(f"[{task.workspace}] Tier 2 → {cmd}")
            try:
                result = subprocess.run(
                    cmd, shell=True, capture_output=True, text=True,
                    timeout=600, cwd=str(self.root),
                )
                return result.returncode == 0
            except Exception as e:
                logger.error(f"[{task.workspace}] ❌ Tier 2 failed: {e}")
                return False

    def _alert(self, task: ScheduledTask, error: str):
        """Write alert to Jidoka log + optional Telegram."""
        alert_file = self.mekong_dir / "jidoka-alerts.log"
        alert_msg = f"[{datetime.now().isoformat()}] HEARTBEAT FAIL: {task.workspace}/{task.description}: {error}\n"
        with open(alert_file, "a") as f:
            f.write(alert_msg)

    async def run_forever(self):
        """Main scheduler loop."""
        logger.info("HEARTBEAT Scheduler starting...")

        # Discover and parse all heartbeats
        for ws_name, hb_path in self.discover_heartbeats():
            ws_tasks = self.parse_heartbeat(ws_name, hb_path)
            self.tasks.extend(ws_tasks)
            logger.info(f"Loaded {len(ws_tasks)} tasks from {ws_name}/HEARTBEAT.md")

        logger.info(f"Total: {len(self.tasks)} scheduled tasks across {len(set(t.workspace for t in self.tasks))} workspaces")

        while True:
            now = datetime.now()
            due_tasks = [t for t in self.tasks if self.is_due(t, now)]

            if due_tasks:
                logger.info(f"{len(due_tasks)} tasks due at {now.strftime('%H:%M')}")
                # Limit concurrent execution
                semaphore = asyncio.Semaphore(self.config.max_concurrent)
                async def run_with_limit(task):
                    async with semaphore:
                        await self.execute_task(task)
                await asyncio.gather(*[run_with_limit(t) for t in due_tasks])

            await asyncio.sleep(self.config.check_interval)


async def main():
    scheduler = HeartbeatScheduler()
    await scheduler.run_forever()


if __name__ == "__main__":
    asyncio.run(main())
