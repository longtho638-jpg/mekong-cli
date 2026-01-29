from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, BigInteger, Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from backend.db.base import Base


class IpBlocklist(Base):
    __tablename__ = "ip_blocklist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ip_address: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=True)
    blocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # User ID or "system"


class RateLimitViolation(Base):
    __tablename__ = "rate_limit_violations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ip_address: Mapped[str] = mapped_column(String, index=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    endpoint: Mapped[str] = mapped_column(String, nullable=False)
    violation_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # e.g., "global_ip", "endpoint_limit"
    request_headers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
