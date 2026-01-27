import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Enum, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class DripStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"

class DripTriggerType(str, enum.Enum):
    SIGNUP = "signup"
    TAG_ADDED = "tag_added"
    MANUAL = "manual"

class DripActionType(str, enum.Enum):
    EMAIL = "email"
    DELAY = "delay"

class DripCampaign(Base):
    __tablename__ = "drip_campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[DripStatus] = mapped_column(
        Enum(DripStatus), default=DripStatus.ACTIVE
    )

    trigger_type: Mapped[DripTriggerType] = mapped_column(
        Enum(DripTriggerType), default=DripTriggerType.SIGNUP
    )

    # For TAG_ADDED trigger
    trigger_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    steps = relationship("DripStep", back_populates="drip_campaign", order_by="DripStep.step_order", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DripStep(Base):
    __tablename__ = "drip_steps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    drip_campaign_id: Mapped[int] = mapped_column(ForeignKey("drip_campaigns.id"))

    step_order: Mapped[int] = mapped_column(Integer)
    action_type: Mapped[DripActionType] = mapped_column(Enum(DripActionType))

    # If action_type == DELAY
    delay_seconds: Mapped[Optional[int]] = mapped_column(Integer, default=0)

    # If action_type == EMAIL
    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("email_templates.id"), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # Override template subject

    drip_campaign = relationship("DripCampaign", back_populates="steps")
    template = relationship("app.models.template.EmailTemplate")

class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class DripEnrollment(Base):
    __tablename__ = "drip_enrollments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    drip_campaign_id: Mapped[int] = mapped_column(ForeignKey("drip_campaigns.id"))
    subscriber_id: Mapped[int] = mapped_column(ForeignKey("subscribers.id"))

    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE
    )

    # Pointer to the *next* step to execute. If Null and status=completed, we are done.
    # We reference DripStep.id, not order, for stability.
    current_step_id: Mapped[Optional[int]] = mapped_column(ForeignKey("drip_steps.id"), nullable=True)

    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    drip_campaign = relationship("DripCampaign")
    subscriber = relationship("app.models.subscriber.Subscriber")
    current_step = relationship("DripStep")
