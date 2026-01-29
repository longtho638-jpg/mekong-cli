import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

# Handle SQLite compatibility where UUID/JSONB might not be native
from backend.db.session import engine

# Simple check for dialect
is_sqlite = engine.dialect.name == "sqlite"

if is_sqlite:
    import json

    from sqlalchemy.types import CHAR, TypeDecorator

    class GUID(TypeDecorator):
        impl = CHAR
        cache_ok = True

        def load_dialect_impl(self, dialect):
            return dialect.type_descriptor(CHAR(36))

        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            return str(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return None
            return uuid.UUID(value)

    class JSONType(TypeDecorator):
        impl = Text
        cache_ok = True

        def load_dialect_impl(self, dialect):
            return dialect.type_descriptor(Text)

        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            return json.dumps(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return None
            return json.loads(value)

    UUID_TYPE = GUID
    JSON_TYPE = JSONType
else:
    UUID_TYPE = UUID(as_uuid=True)
    JSON_TYPE = JSONB

from backend.db.base import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    provider = Column(String, nullable=False)
    event_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSON_TYPE, nullable=False)
    headers = Column(JSON_TYPE, nullable=True)
    status = Column(String, nullable=False, default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)


class WebhookConfig(Base):
    __tablename__ = "webhook_configs"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    secret = Column(String, nullable=False)
    event_types = Column(JSON_TYPE, nullable=False, default=lambda: ["*"])
    is_active = Column(Boolean, default=True)
    api_key_id = Column(UUID_TYPE, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    webhook_config_id = Column(UUID_TYPE, ForeignKey("webhook_configs.id"))
    event_type = Column(String, nullable=False)
    payload = Column(JSON_TYPE, nullable=False)
    status = Column(String, nullable=False, default="pending")
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempt_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookFailure(Base):
    __tablename__ = "webhook_failures"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    delivery_id = Column(UUID_TYPE, ForeignKey("webhook_deliveries.id"))
    webhook_config_id = Column(UUID_TYPE, ForeignKey("webhook_configs.id"))
    event_type = Column(String, nullable=False)
    payload = Column(JSON_TYPE, nullable=False)
    error_message = Column(Text, nullable=True)
    failed_at = Column(DateTime, default=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)
    resolution_note = Column(Text, nullable=True)


class WebhookDeliveryAttempt(Base):
    __tablename__ = "webhook_delivery_attempts"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    delivery_id = Column(UUID_TYPE, ForeignKey("webhook_deliveries.id"), nullable=False)
    webhook_config_id = Column(UUID_TYPE, ForeignKey("webhook_configs.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # success, failed
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
