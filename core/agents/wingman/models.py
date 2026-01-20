"""
Data models for AI Wingman.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class WingmanMode(Enum):
    AUTO = "auto"
    SEMI_AUTO = "semi_auto"
    PASSIVE = "passive"

class NotificationType(Enum):
    LEAD = "lead"
    PAYMENT = "payment"
    INQUIRY = "inquiry"
    MILESTONE = "milestone"
    ALERT = "alert"

@dataclass
class AgencyOwnerProfile:
    name: str
    agency_name: str
    niche: str
    location: str
    tone: str = "professional"

@dataclass
class Notification:
    id: str
    type: NotificationType
    title: str
    message: str
    priority: int
    timestamp: datetime = field(default_factory=datetime.now)
    data: Dict[str, Any] = field(default_factory=dict)
    read: bool = False
