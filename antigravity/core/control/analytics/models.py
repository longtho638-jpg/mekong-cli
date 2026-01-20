"""
Analytics Models - Data structures for event tracking.
"""

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Dict


@dataclass
class AnalyticsEvent:
    """
    Analytics event data structure.

    Attributes:
        event_name: Event identifier (e.g., 'user_login', 'feature_used')
        user_id: User identifier
        timestamp: Event timestamp
        properties: Additional event properties
    """

    event_name: str
    user_id: str
    timestamp: datetime
    properties: Dict[str, object]

    def to_dict(self) -> Dict[str, object]:
        """Convert to dictionary for storage."""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, object]) -> "AnalyticsEvent":
        """Create from dictionary."""
        data = dict(data)  # Make a copy to avoid mutating input
        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        return cls(**data)
