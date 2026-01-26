import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Enum, Boolean, Table, Column, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base

class SubscriberStatus(str, enum.Enum):
    ACTIVE = "active"
    UNCONFIRMED = "unconfirmed"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"
    COMPLAINED = "complained"

# Many-to-Many association table for Subscribers <-> Lists
subscriber_list_association = Table(
    "subscriber_list_association",
    Base.metadata,
    Column("subscriber_id", Integer, ForeignKey("subscribers.id"), primary_key=True),
    Column("list_id", Integer, ForeignKey("mailing_lists.id"), primary_key=True),
)

class MailingList(Base):
    __tablename__ = "mailing_lists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationship
    subscribers: Mapped[List["Subscriber"]] = relationship(
        secondary=subscriber_list_association, back_populates="lists"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<MailingList {self.name}>"

class Subscriber(Base):
    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    status: Mapped[SubscriberStatus] = mapped_column(
        Enum(SubscriberStatus), default=SubscriberStatus.UNCONFIRMED, index=True
    )

    # Store arbitrary data (e.g., {"location": "US", "age": 30})
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Tracking
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True) # IPv6 support
    opt_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    lists: Mapped[List["MailingList"]] = relationship(
        secondary=subscriber_list_association, back_populates="subscribers"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Subscriber {self.email}>"
