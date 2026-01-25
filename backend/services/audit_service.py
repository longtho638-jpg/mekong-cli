"""
Audit Logging Service - Comprehensive security and compliance logging

Handles audit trail for:
- User actions (login, purchase, API calls)
- Admin actions (config changes, user management)
- Security events
- Retention policy (90 days)
- JSON export for compliance reporting

Security requirement for SOC 2, GDPR, and compliance audits.
"""

import json
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class AuditEventType(str, Enum):
    """Audit event type definitions"""
    # User actions
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    USER_PASSWORD_CHANGE = "user_password_change"
    USER_PROFILE_UPDATE = "user_profile_update"

    # Purchase/Payment actions
    PURCHASE_INITIATED = "purchase_initiated"
    PURCHASE_COMPLETED = "purchase_completed"
    PURCHASE_FAILED = "purchase_failed"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"

    # API actions
    API_CALL = "api_call"
    API_KEY_CREATED = "api_key_created"
    API_KEY_REVOKED = "api_key_revoked"

    # Admin actions
    ADMIN_CONFIG_CHANGE = "admin_config_change"
    ADMIN_USER_CREATE = "admin_user_create"
    ADMIN_USER_UPDATE = "admin_user_update"
    ADMIN_USER_DELETE = "admin_user_delete"
    ADMIN_ROLE_CHANGE = "admin_role_change"
    ADMIN_PERMISSION_CHANGE = "admin_permission_change"

    # Security events
    SECURITY_2FA_ENABLED = "security_2fa_enabled"
    SECURITY_2FA_DISABLED = "security_2fa_disabled"
    SECURITY_LOGIN_FAILED = "security_login_failed"
    SECURITY_SUSPICIOUS_ACTIVITY = "security_suspicious_activity"
    SECURITY_DATA_EXPORT = "security_data_export"


class AuditSeverity(str, Enum):
    """Audit event severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class AuditEntry:
    """Represents a single audit log entry"""
    id: Optional[int] = None
    timestamp: str = ""
    event_type: str = ""
    severity: str = AuditSeverity.INFO
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    action: str = ""
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    result: str = "success"
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON export"""
        data = asdict(self)
        # Convert metadata dict to JSON string for storage
        if data.get('metadata'):
            data['metadata'] = json.dumps(data['metadata'])
        return data


class AuditService:
    """
    Audit Logging Service

    Provides comprehensive audit trail logging with:
    - Automatic timestamping
    - IP and user tracking
    - Severity classification
    - 90-day retention policy
    - JSON export capabilities
    """

    def __init__(self, db_path: str = "./data/audit_logs.db"):
        """
        Initialize audit logging service

        Args:
            db_path: Path to SQLite database for audit logs
        """
        self.db_path = db_path
        self._ensure_data_directory()
        self._initialize_database()

    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    def _initialize_database(self):
        """Initialize audit log database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'info',
                user_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                action TEXT NOT NULL,
                resource TEXT,
                resource_id TEXT,
                metadata TEXT,
                result TEXT DEFAULT 'success',
                error_message TEXT
            )
        """)

        # Create indexes for performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp
            ON audit_logs(timestamp)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_user_id
            ON audit_logs(user_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_event_type
            ON audit_logs(event_type)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_severity
            ON audit_logs(severity)
        """)

        conn.commit()
        conn.close()

    def log_event(
        self,
        event_type: AuditEventType,
        action: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        result: str = "success",
        error_message: Optional[str] = None
    ) -> int:
        """
        Log an audit event

        Args:
            event_type: Type of event being logged
            action: Description of action taken
            user_id: ID of user performing action
            ip_address: IP address of requester
            user_agent: User agent string
            resource: Type of resource affected
            resource_id: ID of specific resource
            metadata: Additional context data
            severity: Event severity level
            result: Result of action (success/failure)
            error_message: Error details if result is failure

        Returns:
            ID of created audit log entry
        """
        entry = AuditEntry(
            timestamp=datetime.utcnow().isoformat(),
            event_type=event_type.value,
            severity=severity.value,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            action=action,
            resource=resource,
            resource_id=resource_id,
            metadata=metadata,
            result=result,
            error_message=error_message
        )

        return self._insert_entry(entry)

    def _insert_entry(self, entry: AuditEntry) -> int:
        """Insert audit entry into database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        data = entry.to_dict()
        del data['id']  # Remove id field for insert

        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])

        cursor.execute(
            f"INSERT INTO audit_logs ({columns}) VALUES ({placeholders})",
            list(data.values())
        )

        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return entry_id

    def log_user_login(
        self,
        user_id: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log user login attempt"""
        return self.log_event(
            event_type=AuditEventType.USER_LOGIN if success else AuditEventType.SECURITY_LOGIN_FAILED,
            action=f"User login {'successful' if success else 'failed'}",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            severity=AuditSeverity.INFO if success else AuditSeverity.WARNING,
            result="success" if success else "failure",
            error_message=error
        )

    def log_user_logout(self, user_id: str, ip_address: str):
        """Log user logout"""
        return self.log_event(
            event_type=AuditEventType.USER_LOGOUT,
            action="User logout",
            user_id=user_id,
            ip_address=ip_address
        )

    def log_purchase(
        self,
        user_id: str,
        ip_address: str,
        amount: float,
        currency: str,
        product_id: str,
        success: bool = True,
        transaction_id: Optional[str] = None,
        error: Optional[str] = None
    ):
        """Log purchase transaction"""
        event_type = AuditEventType.PURCHASE_COMPLETED if success else AuditEventType.PURCHASE_FAILED

        return self.log_event(
            event_type=event_type,
            action=f"Purchase {'completed' if success else 'failed'}",
            user_id=user_id,
            ip_address=ip_address,
            resource="purchase",
            resource_id=transaction_id,
            metadata={
                "amount": amount,
                "currency": currency,
                "product_id": product_id
            },
            severity=AuditSeverity.INFO if success else AuditSeverity.WARNING,
            result="success" if success else "failure",
            error_message=error
        )

    def log_api_call(
        self,
        user_id: Optional[str],
        ip_address: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        user_agent: Optional[str] = None
    ):
        """Log API call"""
        severity = AuditSeverity.INFO
        if status_code >= 500:
            severity = AuditSeverity.CRITICAL
        elif status_code >= 400:
            severity = AuditSeverity.WARNING

        return self.log_event(
            event_type=AuditEventType.API_CALL,
            action=f"{method} {endpoint}",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "response_time_ms": response_time_ms
            },
            severity=severity,
            result="success" if status_code < 400 else "failure"
        )

    def log_admin_action(
        self,
        admin_user_id: str,
        ip_address: str,
        action_type: AuditEventType,
        action_description: str,
        target_user_id: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None
    ):
        """Log admin action"""
        return self.log_event(
            event_type=action_type,
            action=action_description,
            user_id=admin_user_id,
            ip_address=ip_address,
            resource="user" if target_user_id else "system",
            resource_id=target_user_id,
            metadata=changes or {},
            severity=AuditSeverity.WARNING  # Admin actions are always important
        )

    def get_logs(
        self,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        severity: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Query audit logs with filters

        Args:
            user_id: Filter by user ID
            event_type: Filter by event type
            start_date: Filter events after this date
            end_date: Filter events before this date
            severity: Filter by severity level
            limit: Maximum number of results
            offset: Pagination offset

        Returns:
            List of audit log entries
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)

        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat())

        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat())

        if severity:
            query += " AND severity = ?"
            params.append(severity)

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            entry = dict(row)
            # Parse metadata JSON if present
            if entry.get('metadata'):
                try:
                    entry['metadata'] = json.loads(entry['metadata'])
                except json.JSONDecodeError:
                    pass
            results.append(entry)

        return results

    def export_to_json(
        self,
        output_path: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        """
        Export audit logs to JSON file

        Args:
            output_path: Path to output JSON file
            start_date: Export logs after this date
            end_date: Export logs before this date

        Returns:
            Path to exported file
        """
        logs = self.get_logs(
            start_date=start_date,
            end_date=end_date,
            limit=1000000  # Get all matching logs
        )

        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        export_data = {
            "export_timestamp": datetime.utcnow().isoformat(),
            "total_entries": len(logs),
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "entries": logs
        }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)

        return output_path

    def apply_retention_policy(self, retention_days: int = 90) -> int:
        """
        Apply retention policy - delete logs older than retention_days

        Args:
            retention_days: Number of days to retain logs (default: 90)

        Returns:
            Number of records deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get count before deletion
        cursor.execute(
            "SELECT COUNT(*) FROM audit_logs WHERE timestamp < ?",
            (cutoff_date.isoformat(),)
        )
        count = cursor.fetchone()[0]

        # Delete old records
        cursor.execute(
            "DELETE FROM audit_logs WHERE timestamp < ?",
            (cutoff_date.isoformat(),)
        )

        conn.commit()
        conn.close()

        return count

    def get_statistics(self) -> Dict[str, Any]:
        """Get audit log statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Total entries
        cursor.execute("SELECT COUNT(*) FROM audit_logs")
        total = cursor.fetchone()[0]

        # By event type
        cursor.execute("""
            SELECT event_type, COUNT(*) as count
            FROM audit_logs
            GROUP BY event_type
            ORDER BY count DESC
        """)
        by_type = {row[0]: row[1] for row in cursor.fetchall()}

        # By severity
        cursor.execute("""
            SELECT severity, COUNT(*) as count
            FROM audit_logs
            GROUP BY severity
        """)
        by_severity = {row[0]: row[1] for row in cursor.fetchall()}

        # Recent activity (last 24 hours)
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        cursor.execute(
            "SELECT COUNT(*) FROM audit_logs WHERE timestamp >= ?",
            (yesterday,)
        )
        last_24h = cursor.fetchone()[0]

        conn.close()

        return {
            "total_entries": total,
            "by_event_type": by_type,
            "by_severity": by_severity,
            "last_24_hours": last_24h
        }


# Singleton instance
_audit_service = None

def get_audit_service() -> AuditService:
    """Get singleton audit service instance"""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service
