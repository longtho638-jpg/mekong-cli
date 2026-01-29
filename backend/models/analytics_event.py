from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AnalyticsEvent(BaseModel):
    """
    Pydantic model for Analytics Event
    Maps to 'usage_events' table
    """

    id: Optional[str] = None
    user_id: Optional[str] = None
    license_id: Optional[str] = None
    team_id: Optional[str] = None
    event_type: str
    event_category: str
    event_name: str
    event_data: Dict[str, Any] = {}
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    client_version: Optional[str] = None
    occurred_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}


class UsageAggregateDaily(BaseModel):
    """
    Pydantic model for Daily Usage Aggregate
    Maps to 'usage_aggregates_daily' table
    """

    id: Optional[str] = None
    user_id: Optional[str] = None
    license_id: Optional[str] = None
    team_id: Optional[str] = None
    date: datetime
    event_type: str
    event_count: int
    unique_sessions: int
    total_duration_seconds: int
    metadata: Dict[str, Any] = {}


class FeatureUsage(BaseModel):
    """
    Pydantic model for Feature Usage
    Maps to 'feature_usage' table
    """

    id: Optional[str] = None
    user_id: Optional[str] = None
    license_id: Optional[str] = None
    feature_name: str
    feature_category: Optional[str] = None
    first_used_at: datetime
    last_used_at: datetime
    total_uses: int
    metadata: Dict[str, Any] = {}
