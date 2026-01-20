"""
POC Tracker Models
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class POCStage(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    EVALUATION = "evaluation"
    WON = "won"
    LOST = "lost"

@dataclass
class SuccessCriterion:
    """POC success criterion"""
    id: str
    description: str
    met: bool = False
    notes: str = ""

@dataclass
class POC:
    """Proof of Concept"""
    id: str
    company: str
    contact: str
    use_case: str
    stage: POCStage = POCStage.PROPOSED
    deal_value: float = 0.0
    criteria: List[SuccessCriterion] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    se_assigned: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def criteria_met(self) -> int:
        return len([c for c in self.criteria if c.met])

    @property
    def success_rate(self) -> float:
        if not self.criteria:
            return 0
        return self.criteria_met / len(self.criteria) * 100
