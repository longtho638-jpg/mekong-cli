"""
Data models for Investor Relations.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class InvestorType(Enum):
    """Investor type."""
    ANGEL = "angel"
    SEED_VC = "seed_vc"
    SERIES_A_VC = "series_a_vc"
    GROWTH_VC = "growth_vc"
    STRATEGIC = "strategic"
    FAMILY_OFFICE = "family_office"

class PipelineStage(Enum):
    """Investor pipeline stage."""
    RESEARCH = "research"
    OUTREACH = "outreach"
    INTRO_MEETING = "intro_meeting"
    PARTNER_MEETING = "partner_meeting"
    DUE_DILIGENCE = "due_diligence"
    TERM_SHEET = "term_sheet"
    CLOSED = "closed"
    PASSED = "passed"

class InteractionType(Enum):
    """Investor interaction type."""
    EMAIL = "email"
    CALL = "call"
    MEETING = "meeting"
    PITCH = "pitch"
    FOLLOW_UP = "follow_up"

@dataclass
class Investor:
    """An investor contact."""
    id: str
    name: str
    firm: str
    investor_type: InvestorType
    stage: PipelineStage = PipelineStage.RESEARCH
    check_size_min: float = 0
    check_size_max: float = 0
    focus_areas: List[str] = field(default_factory=list)
    warm_intro: Optional[str] = None
    last_contact: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: str = ""
    relationship_score: int = 0  # 0-100

@dataclass
class Interaction:
    """An investor interaction."""
    id: str
    investor_id: str
    interaction_type: InteractionType
    date: datetime
    summary: str
    outcome: str = ""
    next_steps: str = ""

@dataclass
class DueDiligenceItem:
    """A due diligence checklist item."""
    category: str
    item: str
    status: str = "pending"  # pending, in_progress, complete
    notes: str = ""
