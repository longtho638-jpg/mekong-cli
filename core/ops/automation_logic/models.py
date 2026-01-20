"""
Data models and Enums for Automation Workflows.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List


class TriggerType(Enum):
    """Automation trigger types."""
    NEW_CLIENT = "new_client"
    NEW_PROJECT = "new_project"
    INVOICE_DUE = "invoice_due"
    MILESTONE_COMPLETE = "milestone_complete"
    FEEDBACK_RECEIVED = "feedback_received"
    MEETING_SCHEDULED = "meeting_scheduled"

class ActionType(Enum):
    """Automation action types."""
    SEND_EMAIL = "send_email"
    CREATE_TASK = "create_task"
    SEND_NOTIFICATION = "send_notification"
    UPDATE_STATUS = "update_status"
    ASSIGN_TEAM = "assign_team"

@dataclass
class Action:
    """An automation action entity."""
    type: ActionType
    config: Dict[str, Any]
    delay_hours: int = 0

    def __post_init__(self):
        if self.delay_hours < 0:
            raise ValueError("Delay hours cannot be negative")

@dataclass
class Workflow:
    """An automation workflow entity."""
    id: str
    name: str
    description: str
    trigger: TriggerType
    actions: List[Action]
    enabled: bool = True
    runs: int = 0
    created_at: datetime = field(default_factory=datetime.now)
