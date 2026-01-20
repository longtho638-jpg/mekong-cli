"""
Chatbot Agent Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class Intent(Enum):
    GREETING = "greeting"
    PRICING = "pricing"
    SUPPORT = "support"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    UNKNOWN = "unknown"

class Channel(Enum):
    ZALO = "zalo"
    MESSENGER = "messenger"
    WEBSITE = "website"
    EMAIL = "email"

@dataclass
class Message:
    """Chat message"""
    id: str
    channel: Channel
    sender_id: str
    content: str
    is_bot: bool = False
    intent: Optional[Intent] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class Conversation:
    """Conversation thread"""
    id: str
    channel: Channel
    customer_id: str
    customer_name: str
    messages: List[Message] = field(default_factory=list)
    status: str = "open"  # open, resolved, escalated
    created_at: datetime = field(default_factory=datetime.now)
