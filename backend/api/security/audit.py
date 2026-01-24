import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


class AuditLogger:
    """
    Secure Audit Logger for AgencyOS.
    Records critical system actions for compliance and security monitoring.
    """
    def __init__(self, log_dir: str = "logs/audit"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Setup specific logger for audit
        self.logger = logging.getLogger("agencyos.audit")
        self.logger.setLevel(logging.INFO)

        # Avoid adding multiple handlers if re-initialized
        if not self.logger.handlers:
            handler = logging.FileHandler(self.log_dir / "audit.log")
            formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def log_event(
        self,
        event_type: str,
        user: str,
        action: str,
        resource: str,
        status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Log a security or operational event.

        Args:
            event_type: Category (e.g., AUTH, SWARM, SYSTEM)
            user: Username or ID triggering the event
            action: What happened (e.g., LOGIN, DISPATCH_TASK)
            resource: Target resource (e.g., /api/token, dev_swarm)
            status: SUCCESS or FAILURE
            details: Additional context
        """
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user": user,
            "action": action,
            "resource": resource,
            "status": status,
            "details": details or {}
        }

        # Structured log
        self.logger.info(json.dumps(event))

# Singleton instance
audit_logger = AuditLogger()
