import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from backend.db.base import Base

# Handle SQLite compatibility
from backend.db.session import engine

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
            if value is None: return None
            return str(value)
        def process_result_value(self, value, dialect):
            if value is None: return None
            return uuid.UUID(value)

    class JSONType(TypeDecorator):
        impl = Text
        cache_ok = True
        def load_dialect_impl(self, dialect):
            return dialect.type_descriptor(Text)
        def process_bind_param(self, value, dialect):
            if value is None: return None
            return json.dumps(value)
        def process_result_value(self, value, dialect):
            if value is None: return None
            return json.loads(value)

    UUID_TYPE = GUID
    JSON_TYPE = JSONType
else:
    UUID_TYPE = UUID(as_uuid=True)
    JSON_TYPE = JSONB

class DLQEntry(Base):
    """
    Dead Letter Queue Entry for failed webhooks.
    Stores payloads that failed after all retry attempts.
    """
    __tablename__ = "dlq_entries"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    webhook_config_id = Column(UUID_TYPE, ForeignKey("webhook_configs.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_payload = Column(JSON_TYPE, nullable=False)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    stored_at = Column(DateTime, default=datetime.utcnow)
    replayed_at = Column(DateTime, nullable=True)
    is_archived = Column(Boolean, default=False)
