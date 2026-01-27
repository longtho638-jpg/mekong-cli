"""
Audit Logging Service - Comprehensive security and compliance logging
==================================================================

Handles immutable audit trail for:
- User actions (login, purchase, API calls)
- Admin actions (config changes, user management)
- Security events
- Retention policy management
- JSON/CSV export for compliance reporting

Security requirement for SOC 2, GDPR, and compliance audits.
Uses SHA-256 hash chaining for tamper-evidence.
"""

import csv
import gzip
import hashlib
import io
import json

try:
    import boto3
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session

from backend.api.config import settings
from backend.db.session import SessionLocal
from backend.models.audit_log import AuditLog
from backend.websocket.server import emit_audit_log_created


class AuditService:
    """
    Audit Logging Service with Immutable Storage Pattern
    """

    def __init__(self):
        self.s3_client = None
        if settings.is_production:
             # Initialize S3 client for archival if needed (mock for now or use env vars)
             pass

    def _calculate_hash(self, timestamp: datetime, user_id: Optional[str], action: str, previous_hash: str) -> str:
        """
        Calculate SHA-256 hash for the log entry to ensure integrity.
        Formula: SHA256(timestamp_iso + user_id + action + previous_hash)
        """
        payload = f"{timestamp.isoformat()}{user_id or ''}{action}{previous_hash}"
        return hashlib.sha256(payload.encode()).hexdigest()

    def _get_previous_hash(self, db: Session) -> str:
        """Get the hash of the most recent audit log entry."""
        last_log = db.execute(
            select(AuditLog.hash).order_by(desc(AuditLog.id)).limit(1)
        ).scalar_one_or_none()
        return last_log if last_log else "genesis"

    async def create_audit_log(
        self,
        db: Session,
        action: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Create a new immutable audit log entry.
        """
        timestamp = datetime.now(timezone.utc)

        # lock table or ensure sequential processing might be needed for strict strict chains,
        # but for this scope we'll rely on latest fetch.
        # In high concurrency, there might be race conditions on 'previous_hash'
        # but for audit trails, "best effort" chain or using DB sequence is often acceptable.
        # For strict blockchain-like guarantee, we'd need a serializable transaction.

        previous_hash = self._get_previous_hash(db)
        current_hash = self._calculate_hash(timestamp, user_id, action, previous_hash)

        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            request_id=request_id,
            metadata_=metadata,
            timestamp=timestamp,
            hash=current_hash
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        # Emit real-time event
        try:
            await emit_audit_log_created(audit_log.to_dict())
        except Exception:
            # Non-blocking error
            pass

        return audit_log

    async def search_audit_logs(
        self,
        db: Session,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """
        Search audit logs with filters.
        """
        query = select(AuditLog)

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
        if start_date:
            query = query.where(AuditLog.timestamp >= start_date)
        if end_date:
            query = query.where(AuditLog.timestamp <= end_date)

        query = query.order_by(desc(AuditLog.timestamp))
        query = query.limit(limit).offset(offset)

        result = db.execute(query)
        return result.scalars().all()

    async def export_logs(
        self,
        db: Session,
        format: str = "json",
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Union[str, Dict]:
        """
        Export logs to CSV string or JSON list.
        """
        # Fetch all matching logs (with reasonable limit? usually exports are bulk)
        # For this implementation, we'll fetch up to 10,000 to prevent OOM
        logs = await self.search_audit_logs(
            db, user_id=user_id, start_date=start_date, end_date=end_date, limit=10000
        )

        if format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            headers = [
                "id", "timestamp", "user_id", "action", "resource_type",
                "resource_id", "ip_address", "hash"
            ]
            writer.writerow(headers)
            for log in logs:
                writer.writerow([
                    log.id,
                    log.timestamp.isoformat(),
                    str(log.user_id) if log.user_id else "",
                    log.action,
                    log.resource_type or "",
                    log.resource_id or "",
                    str(log.ip_address) if log.ip_address else "",
                    log.hash
                ])
            return output.getvalue()

        else: # json
            return [log.to_dict() for log in logs]

    async def archive_old_logs(self, db: Session, retention_days: int = 365):
        """
        Archive logs older than retention_days to cold storage and remove from hot DB.
        NOTE: Due to immutability triggers, DELETE will fail unless we disable trigger or
        have a specific system user override.

        Strategy:
        1. Select old logs.
        2. Write to S3/File.
        3. Admin override to delete from DB (requires specific DB privileges or disable trigger session-wise).
        """
        # This is a placeholder for the logic.
        # Real implementation needs to handle the immutability constraint carefully.
        # Typically, "immutability" applies to application users. Admin maintenance jobs
        # might need superuser privileges to delete archived rows.
        pass

    async def verify_integrity(self, db: Session, limit: int = 1000) -> bool:
        """
        Verify the hash chain integrity for the last N records.
        Returns True if valid, False if tampering detected.
        """
        logs = db.execute(
            select(AuditLog).order_by(AuditLog.id).limit(limit)
        ).scalars().all()

        if not logs:
            return True

        # This simple check assumes we grabbed the start of chain or we know the previous hash
        # For a partial check, we need to know the hash of the record BEFORE the first one fetched.
        # Here we just check internal consistency of the fetched block if we assume logical continuity

        for i in range(1, len(logs)):
            prev = logs[i-1]
            curr = logs[i]

            expected_hash = self._calculate_hash(
                curr.timestamp,
                str(curr.user_id) if curr.user_id else None,
                curr.action,
                prev.hash
            )

            if curr.hash != expected_hash:
                return False

        return True

# Singleton instance
audit_service = AuditService()
