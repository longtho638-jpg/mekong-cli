"""
Data models for Term Sheet Analysis.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List


class DealType(Enum):
    """Type of deal."""
    SAFE = "safe"
    CONVERTIBLE_NOTE = "convertible_note"
    PRICED_ROUND = "priced_round"

class TermCategory(Enum):
    """Term sheet category."""
    ECONOMICS = "economics"
    CONTROL = "control"
    PROTECTION = "protection"
    OTHER = "other"

@dataclass
class TermSheetTerm:
    """A single term in a term sheet."""
    name: str
    value: str
    category: TermCategory
    is_founder_friendly: bool = True
    notes: str = ""
    red_flag: bool = False

@dataclass
class TermSheet:
    """A complete term sheet."""
    id: str
    investor_name: str
    deal_type: DealType
    pre_money_valuation: float
    investment_amount: float
    terms: List[TermSheetTerm] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    founder_friendly_score: int = 0  # 0-100

@dataclass
class CapTableEntry:
    """A cap table entry."""
    shareholder: str
    shares: int
    percentage: float
    share_class: str = "common"
