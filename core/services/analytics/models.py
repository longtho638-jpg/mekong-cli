"""
Data models for Analytics Service.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class MetricPeriod(Enum):
    """Khoảng thời gian cho metrics."""
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL_TIME = "all_time"

class RevenueType(Enum):
    """Loại revenue."""
    SERVICE = "service"
    RETAINER = "retainer"
    AFFILIATE = "affiliate"
    TEMPLATE = "template"
    REFERRAL = "referral"
    OTHER = "other"

@dataclass
class RevenueEntry:
    """Revenue entry entity."""
    id: str
    amount: float
    type: RevenueType
    client_id: Optional[str]
    description: str
    date: datetime
    recurring: bool = False

@dataclass
class MetricSnapshot:
    """Metric snapshot tại một thời điểm."""
    timestamp: datetime
    value: float
    change_percent: float = 0.0

@dataclass
class ClientMetrics:
    """Metrics cho một client."""
    client_id: str
    client_name: str
    total_revenue: float
    projects_count: int
    avg_project_value: float
    lifetime_value: float
    months_active: int
    health_score: float  # 0-100
