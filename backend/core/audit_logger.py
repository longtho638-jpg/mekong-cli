import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from backend.models.audit_log import AuditLog
from backend.services.audit_service import audit_service

logger = logging.getLogger(__name__)

class AuditLogger:
    """
    Core Audit Logger Facade.
    Provides a simplified interface for logging security and operational events
    from anywhere in the application.
    """

    @staticmethod
    async def log_event(
        db: Session,
        action: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Optional[AuditLog]:
        """
        Log an event to the audit trail.
        """
        try:
            return await audit_service.create_audit_log(
                db=db,
                action=action,
                user_id=user_id,
                resource_type=resource_type,
                resource_id=resource_id,
                metadata=metadata,
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            return None

    @staticmethod
    async def log_security_event(
        db: Session,
        action: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """
        Specialized logger for security events (login failures, permission denied).
        """
        metadata = details or {}
        metadata["event_type"] = "SECURITY"

        await AuditLogger.log_event(
            db=db,
            action=f"security.{action}",
            user_id=user_id,
            resource_type="security",
            metadata=metadata,
            ip_address=ip_address
        )

# Global instance not strictly needed as methods are static, but for consistency
audit_logger = AuditLogger()
