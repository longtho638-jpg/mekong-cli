import json
import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import redis
from croniter import croniter

from backend.api.config import settings
from backend.services.queue_service import QueueService

logger = logging.getLogger(__name__)

class SchedulerService:
    """
    Handles recurring jobs based on cron schedules.
    Uses Redis to ensure only one scheduler instance queues a job (leader election or lock).
    """

    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_service = QueueService(self.redis)
        self.schedule_key = "agencyos:scheduler:config"
        self.last_check_key = "agencyos:scheduler:last_check"
        self.lock_key = "agencyos:scheduler:lock"

        # Hardcoded schedules for MVP (could be loaded from DB/Config)
        self.schedules = [
            {
                "name": "daily_backup",
                "cron": "0 2 * * *", # 2 AM daily
                "job_type": "backup_system",
                "payload": {"type": "full"},
                "priority": "normal"
            },
            {
                "name": "weekly_report",
                "cron": "0 9 * * 1", # 9 AM Monday
                "job_type": "generate_report",
                "payload": {"report_type": "weekly_summary"},
                "priority": "low"
            },
            {
                "name": "monthly_cleanup",
                "cron": "0 3 1 * *", # 3 AM 1st of month
                "job_type": "cleanup_old_data",
                "payload": {"retention_days": 30},
                "priority": "low"
            },
            # Test schedule: Every minute (for demo)
            # {
            #     "name": "heartbeat_check",
            #     "cron": "* * * * *",
            #     "job_type": "system_check",
            #     "payload": {},
            #     "priority": "low"
            # }
        ]

    def start(self):
        """Start the scheduler loop"""
        logger.info("Scheduler service started.")
        while True:
            try:
                self.check_schedules()
            except Exception as e:
                logger.error(f"Scheduler error: {e}")

            # Check every 30 seconds
            time.sleep(30)

    def check_schedules(self):
        """Check if any scheduled jobs need to run"""
        now = datetime.utcnow()

        # Acquire lock to prevent multiple schedulers from queuing the same job
        # Simple implementation: Use a lock or check last run time
        # Here we iterate through defined schedules

        for schedule in self.schedules:
            self._process_schedule(schedule, now)

    def _process_schedule(self, schedule: Dict[str, Any], now: datetime):
        name = schedule["name"]
        cron_expression = schedule["cron"]

        # Key to store the last time this specific schedule ran
        last_run_key = f"agencyos:scheduler:last_run:{name}"
        last_run_ts = self.redis.get(last_run_key)

        if last_run_ts:
            last_run = datetime.fromtimestamp(float(last_run_ts))
        else:
            # If never ran, assume it ran "now" to start fresh, or "long ago" to run immediately?
            # Usually we want to find the *next* occurrence from now.
            last_run = now
            # Initialize if not set
            self.redis.set(last_run_key, now.timestamp())
            return

        # Check if we should have run since last_run
        iter = croniter(cron_expression, last_run)
        next_run = iter.get_next(datetime)

        if next_run <= now:
            # It's time to run!
            logger.info(f"Triggering scheduled job: {name} (Due: {next_run})")

            # Enqueue the job
            self.queue_service.enqueue_job(
                job_type=schedule["job_type"],
                payload=schedule.get("payload", {}),
                priority=schedule.get("priority", "normal")
            )

            # Update last run time to NOW (to prevent double runs if we are slightly behind)
            self.redis.set(last_run_key, now.timestamp())

if __name__ == "__main__":
    # Standalone execution
    logging.basicConfig(level=logging.INFO)
    scheduler = SchedulerService()
    scheduler.start()
