from app.database import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

class FeedbackType(str, enum.Enum):
    BUG = "bug"
    FEATURE = "feature"
    GENERAL = "general"

class FeedbackStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(FeedbackType), default=FeedbackType.GENERAL)
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=0)
    metadata_info = Column(JSON, default=dict)
    screenshot_url = Column(String, nullable=True)
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)

class Screenshot(Base):
    __tablename__ = "screenshots"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    file_path = Column(String)
    file_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    feedback = relationship("Feedback", backref="screenshots")

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_hash = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    allowed_domains = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
