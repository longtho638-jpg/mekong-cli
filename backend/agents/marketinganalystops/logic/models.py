"""
Reporting Agent Data Models.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional


class ReportType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class ReportStatus(Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    SENT = "sent"


@dataclass
class Insight:
    id: str
    title: str
    description: str
    impact: str
    action: str
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Report:
    id: str
    title: str
    report_type: ReportType
    period_start: date
    period_end: date
    status: ReportStatus = ReportStatus.DRAFT
    insights: List[Insight] = field(default_factory=list)
    metrics_summary: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    sent_at: Optional[datetime] = None
