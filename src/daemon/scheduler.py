"""
Mekong Daemon - Scheduler

Main loop: watch → classify → execute → gate → journal → archive/dlq.
Single-process daemon with graceful shutdown.
"""

import logging
import os
import signal
import time
from pathlib import Path
from typing import Dict, Optional

from .watcher import TaskWatcher
from .classifier import ComplexityClassifier
from .executor import MissionExecutor
from .gate import PostGate
from .journal import LearningJournal
from .dlq import DeadLetterQueue

logger = logging.getLogger(__name__)


class DaemonScheduler:
    """
    Autonomous daemon that watches for missions and executes them.

    Args:
        config: Dict with watch_dir, poll_interval, max_retries, projects, etc.
    """

    def __init__(self, config: Optional[Dict] = None) -> None:
        cfg = config or {}
        self._watch_dir = cfg.get("watch_dir", "./tasks")
        self._poll_interval = cfg.get("poll_interval_secs", 5)
        self._max_retries = cfg.get("max_retries", 3)
        self._running = False

        self.watcher = TaskWatcher(
            watch_dir=self._watch_dir,
            poll_interval=self._poll_interval,
        )
        self.classifier = ComplexityClassifier(cfg.get("complexity"))
        self.executor = MissionExecutor(
            working_dir=cfg.get("working_dir", "."),
            timeout=cfg.get("default_timeout", 1800),
        )
        self.gate = PostGate(
            verify_commands=cfg.get("verify_commands", []),
            working_dir=cfg.get("working_dir", "."),
        )
        self.journal = LearningJournal(cfg.get("journal_path", ".mekong/daemon-journal.jsonl"))
        self.dlq = DeadLetterQueue(cfg.get("dlq_dir", f"{self._watch_dir}/dead-letter"))
        self._retry_counts: Dict[str, int] = {}

    def start(self) -> None:
        """Start the daemon main loop. Blocks until stopped."""
        self._running = True
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

        logger.info("Daemon started — watching %s (poll: %ds)", self._watch_dir, self._poll_interval)

        while self._running:
            missions = self.watcher.scan_once()
            for mission_path in missions:
                if not self._running:
                    break
                self._process_mission(mission_path)
            time.sleep(self._poll_interval)

        logger.info("Daemon stopped gracefully")

    def stop(self) -> None:
        """Signal the daemon to stop."""
        self._running = False

    def _handle_signal(self, signum: int, frame) -> None:
        logger.info("Received signal %d — shutting down", signum)
        self.stop()

    def _process_mission(self, mission_path: Path) -> None:
        """Process a single mission file."""
        name = mission_path.name
        logger.info("Processing mission: %s", name)

        try:
            content = mission_path.read_text().strip()
        except Exception as e:
            logger.error("Cannot read mission %s: %s", name, e)
            self.watcher.mark_processed(mission_path)
            return

        classification = self.classifier.classify(content)
        logger.info("Classified: %s → %s (timeout: %ds)", name, classification.level, classification.timeout)

        result = self.executor.run_shell(content, timeout=classification.timeout)

        if result.success and self.gate.check():
            self.journal.record_mission(
                mission=name, complexity=classification.level,
                success=True, duration=result.duration,
            )
            self.watcher.archive(mission_path)
            logger.info("Mission completed: %s (%.1fs)", name, result.duration)
        else:
            retries = self._retry_counts.get(name, 0) + 1
            self._retry_counts[name] = retries

            if retries >= self._max_retries:
                reason = result.error or "Max retries exceeded"
                self.dlq.move_to_dlq(mission_path, reason)
                self.journal.record_mission(
                    mission=name, complexity=classification.level,
                    success=False, duration=result.duration, error=reason,
                )
                del self._retry_counts[name]
                logger.warning("Mission failed → DLQ: %s (%s)", name, reason)
            else:
                logger.info("Mission retry %d/%d: %s", retries, self._max_retries, name)

    def status(self) -> Dict:
        """Return daemon status summary."""
        return {
            "running": self._running,
            "watch_dir": self._watch_dir,
            "pending": len(self.watcher.scan_once()),
            "dead_letters": self.dlq.count,
            "success_rate": self.journal.success_rate(),
        }


__all__ = ["DaemonScheduler"]
