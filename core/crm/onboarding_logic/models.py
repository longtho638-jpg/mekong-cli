"""
Data models and Enums for Client Onboarding.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class OnboardingStep(Enum):
    """Onboarding steps."""
    WELCOME_CALL = "welcome_call"
    ACCOUNT_SETUP = "account_setup"
    PORTAL_ACCESS = "portal_access"
    KICKOFF_MEETING = "kickoff_meeting"
    STRATEGY_SESSION = "strategy_session"
    DELIVERABLES_START = "deliverables_start"

@dataclass
class OnboardingChecklist:
    """Onboarding checklist item entity."""
    step: OnboardingStep
    name: str
    description: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    due_days: int = 1

@dataclass
class ClientOnboarding:
    """Client onboarding record entity."""
    id: str
    client_name: str
    email: str
    checklist: List[OnboardingChecklist]
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
