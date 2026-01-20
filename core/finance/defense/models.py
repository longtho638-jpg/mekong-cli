"""
Mutual Defense models and Enums.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CaseType(Enum):
    NON_PAYMENT = "non_payment"
    FRAUD = "fraud"
    SCOPE_DISPUTE = "scope_dispute"

class CaseStatus(Enum):
    OPEN = "open"
    VOTING = "voting"
    APPROVED = "approved"

@dataclass
class DefenseCase:
    id: str
    reporter_id: str
    client_name: str
    case_type: CaseType
    title: str
    description: str
    amount_disputed: float
    status: CaseStatus = CaseStatus.OPEN
    votes_for: int = 0
    votes_required: int = 5
    created_at: datetime = field(default_factory=datetime.now)
