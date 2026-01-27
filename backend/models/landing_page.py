from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.db.base import Base

from .enums import ABTestStatus, AnalyticsEventType

# --- SQLAlchemy Models ---

class LandingPage(Base):
    __tablename__ = "landing_pages"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, nullable=False) # Public ID
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    content_json = Column(JSON, nullable=False, default={}) # Stores the builder state
    seo_metadata = Column(JSON, nullable=True, default={})
    is_published = Column(Boolean, default=False)

    # Template info
    template_id = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    ab_tests = relationship("ABTest", back_populates="landing_page")
    events = relationship("AnalyticsEvent", back_populates="landing_page")

class ABTest(Base):
    __tablename__ = "ab_tests"

    id = Column(Integer, primary_key=True, index=True)
    landing_page_id = Column(Integer, ForeignKey("landing_pages.id"), nullable=False)

    variants_json = Column(JSON, nullable=False) # List of variant configs/overrides
    traffic_split = Column(JSON, nullable=False) # e.g., {"variant_a": 0.5, "variant_b": 0.5}
    winner_variant_id = Column(String(100), nullable=True)
    status = Column(String(50), default=ABTestStatus.DRAFT)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    landing_page = relationship("LandingPage", back_populates="ab_tests")

class AnalyticsEvent(Base):
    __tablename__ = "landing_analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    landing_page_id = Column(Integer, ForeignKey("landing_pages.id"), nullable=False)
    variant_id = Column(String(100), nullable=True) # Which variant was shown

    event_type = Column(String(50), nullable=False) # page_view, click, form_submission

    user_id = Column(String(255), nullable=True) # Optional known user
    session_id = Column(String(255), nullable=True) # Anonymous session

    metadata_ = Column("metadata", JSON, nullable=True) # Extra data (scroll depth, field values)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    landing_page = relationship("LandingPage", back_populates="events")


# --- Pydantic Models ---

class LandingPageBase(BaseModel):
    title: str
    slug: str
    content_json: Dict[str, Any]
    seo_metadata: Optional[Dict[str, Any]] = None
    template_id: Optional[str] = None
    is_published: bool = False

class LandingPageCreate(LandingPageBase):
    pass

class LandingPageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    seo_metadata: Optional[Dict[str, Any]] = None
    template_id: Optional[str] = None
    is_published: Optional[bool] = None

class LandingPageResponse(LandingPageBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ABTestBase(BaseModel):
    variants_json: List[Dict[str, Any]]
    traffic_split: Dict[str, float]
    status: ABTestStatus = ABTestStatus.DRAFT

class ABTestCreate(ABTestBase):
    landing_page_id: int

class ABTestResponse(ABTestBase):
    id: int
    landing_page_id: int
    winner_variant_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AnalyticsEventCreate(BaseModel):
    landing_page_uuid: str
    variant_id: Optional[str] = None
    event_type: AnalyticsEventType
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
