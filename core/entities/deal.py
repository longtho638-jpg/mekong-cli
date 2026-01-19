"""
Entity: Deal
Core data structure for CRM deals.

Clean Architecture Layer: Entities
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class DealStage(Enum):
    """Deal stages in the sales pipeline."""

    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


@dataclass
class Deal:
    """Core deal entity."""

    id: Optional[int] = None
    title: str = ""
    company: str = ""
    value: float = 0.0
    stage: DealStage = DealStage.QUALIFIED
    probability: float = 0.0
    contact_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    notes: str = ""

    def calculate_weighted_value(self) -> float:
        """Calculate weighted pipeline value."""
        return self.value * (self.probability / 100)
