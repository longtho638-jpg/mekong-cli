from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    secret = Column(String, nullable=False)  # For HMAC signature
    is_active = Column(Boolean, default=True)
    event_types = Column(JSON, nullable=False)  # List of event types
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    deliveries = relationship("WebhookDelivery", back_populates="endpoint")

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("webhook_endpoints.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("webhook_events.id"), nullable=True) # Optional link to source event

    url = Column(String, nullable=False)
    request_headers = Column(JSON, nullable=True)
    request_body = Column(JSON, nullable=True)

    response_status_code = Column(Integer, nullable=True)
    response_headers = Column(JSON, nullable=True)
    response_body = Column(Text, nullable=True)

    duration_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=False)
    attempt = Column(Integer, default=1)
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    next_retry_at = Column(DateTime(timezone=True), nullable=True)

    endpoint = relationship("WebhookEndpoint", back_populates="deliveries")
