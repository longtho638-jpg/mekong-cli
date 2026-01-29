from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import JSON, BigInteger, Column, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.sql import func

from backend.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(255), nullable=True)
    resource_id = Column(String(255), nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)
    metadata_ = Column(
        "metadata", JSONB, nullable=True
    )  # Using metadata_ to avoid conflict with SQLAlchemy metadata
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    hash = Column(String(64), nullable=False)

    # Indexes
    __table_args__ = (
        Index("idx_audit_logs_user_id", "user_id"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_timestamp", "timestamp"),
        Index("idx_audit_logs_resource", "resource_type", "resource_id"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": str(self.user_id) if self.user_id else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": str(self.ip_address) if self.ip_address else None,
            "user_agent": self.user_agent,
            "session_id": str(self.session_id) if self.session_id else None,
            "request_id": str(self.request_id) if self.request_id else None,
            "metadata": self.metadata_,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "hash": self.hash,
        }
