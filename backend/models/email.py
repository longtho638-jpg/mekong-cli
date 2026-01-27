from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Assuming backend/db/base_class.py exists and has Base. If not, adjust import.
# Using a generic Base for now if unsure of exact location, but usually it's backend.db.base
try:
    from backend.db.base import Base
except ImportError:
    from sqlalchemy.orm import DeclarativeBase
    class Base(DeclarativeBase):
        pass

class CampaignStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class StepType(str, PyEnum):
    EMAIL = "email"
    DELAY = "delay"
    CONDITION = "condition"

class SubscriberStatus(str, PyEnum):
    ACTIVE = "active"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"

class EnrollmentStatus(str, PyEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Subscriber(Base):
    __tablename__ = "email_subscribers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[SubscriberStatus] = mapped_column(Enum(SubscriberStatus), default=SubscriberStatus.ACTIVE)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    enrollments = relationship("DripEnrollment", back_populates="subscriber")

class EmailCampaign(Base):
    __tablename__ = "email_campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)

    # Configuration
    trigger_type: Mapped[str] = mapped_column(String(50), default="manual") # manual, signup, tag_added
    trigger_config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    steps = relationship("CampaignStep", back_populates="campaign", order_by="CampaignStep.order", cascade="all, delete-orphan")
    enrollments = relationship("DripEnrollment", back_populates="campaign")

class CampaignStep(Base):
    __tablename__ = "email_campaign_steps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("email_campaigns.id"))

    name: Mapped[str] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[StepType] = mapped_column(Enum(StepType), nullable=False)

    # Config depends on type:
    # EMAIL: { "subject": "Hi", "template_id": 1, "body": "..." }
    # DELAY: { "seconds": 3600 }
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("EmailCampaign", back_populates="steps")

class DripEnrollment(Base):
    __tablename__ = "email_drip_enrollments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("email_campaigns.id"))
    subscriber_id: Mapped[int] = mapped_column(ForeignKey("email_subscribers.id"))

    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE)
    current_step_id: Mapped[Optional[int]] = mapped_column(ForeignKey("email_campaign_steps.id"), nullable=True)

    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("EmailCampaign", back_populates="enrollments")
    subscriber = relationship("Subscriber", back_populates="enrollments")
    current_step = relationship("CampaignStep")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subscriber_id: Mapped[Optional[int]] = mapped_column(ForeignKey("email_subscribers.id"), nullable=True)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("email_campaigns.id"), nullable=True)
    step_id: Mapped[Optional[int]] = mapped_column(ForeignKey("email_campaign_steps.id"), nullable=True)

    recipient_email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(255))
    provider: Mapped[str] = mapped_column(String(50)) # resend, sendgrid
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50)) # sent, delivered, opened, clicked, bounced
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    clicked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
