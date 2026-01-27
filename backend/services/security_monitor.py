"""
🛡️ Security Monitor Service
==========================
Real-time security monitoring and anomaly detection.
Detects brute force attacks, credential stuffing, and unusual activity.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from backend.api.config import settings
from backend.core.infrastructure.redis import redis_client
from backend.services.audit_service import audit_service

# We avoid circular imports by importing models inside methods if needed

logger = logging.getLogger(__name__)

class SecurityMonitor:
    """
    Monitors security events and triggers alerts.
    Uses Redis for stateful tracking of events (e.g. failed logins).
    """

    PREFIX = "security:monitor"

    def __init__(self):
        self.redis = redis_client
        self.alert_thresholds = {
            "failed_login": 5,        # 5 failures in window
            "api_violation": 10,      # 10 403s in window
            "high_value_access": 1,   # Alert on any sensitive admin access
        }
        self.window_seconds = 300     # 5 minutes window

    async def log_security_event(
        self,
        event_type: str,
        actor_id: str,
        ip_address: str,
        details: Dict[str, Any] = None,
        severity: str = "medium"
    ):
        """
        Log a security event, update counters, and check for alerts.
        """
        details = details or {}

        # 1. Log to Audit Service (Persistent Storage)
        # We assume database session management is handled by caller or we create a new one
        # For async service context, better to emit an event or use a background task.
        # Here we just log to application logger for immediate visibility
        logger.warning(
            f"SECURITY_EVENT: [{severity.upper()}] {event_type} by {actor_id} from {ip_address} | {json.dumps(details)}"
        )

        # 2. Update Redis Counters for Anomaly Detection
        # Keys: security:monitor:failed_login:ip:1.2.3.4
        #       security:monitor:failed_login:user:bob

        if event_type == "failed_login":
            await self._increment_counter(f"failed_login:ip:{ip_address}")
            await self._increment_counter(f"failed_login:user:{actor_id}")

        elif event_type == "permission_denied":
            await self._increment_counter(f"api_violation:ip:{ip_address}")
            await self._increment_counter(f"api_violation:user:{actor_id}")

    async def _increment_counter(self, key_suffix: str):
        """Increment counter and check threshold."""
        key = f"{self.PREFIX}:{key_suffix}"

        # Increment
        count = self.redis.incr(key)

        # Set expiry on first increment
        if count == 1:
            self.redis.expire(key, self.window_seconds)

        # Check threshold
        event_type = key_suffix.split(":")[0]
        threshold = self.alert_thresholds.get(event_type, 10)

        if count >= threshold:
            await self._trigger_alert(key_suffix, count)

    async def _trigger_alert(self, trigger_key: str, count: int):
        """
        Trigger an alert (Email, Slack, etc.)
        """
        alert_msg = f"🚨 SECURITY ALERT: High frequency of {trigger_key} events. Count: {count} in {self.window_seconds}s"
        logger.critical(alert_msg)

        # In a real implementation, this would dispatch to PagerDuty or Slack
        # e.g., notifications_service.send_system_alert(alert_msg)

        # Prevent spamming alerts: set a cooldown key
        cooldown_key = f"{self.PREFIX}:alert_cooldown:{trigger_key}"
        if not self.redis.exists(cooldown_key):
            # Send actual notification here
            # await send_slack_alert(alert_msg)
            pass

            # Set cooldown for 1 hour
            self.redis.setex(cooldown_key, 3600, "1")

# Singleton
security_monitor = SecurityMonitor()
