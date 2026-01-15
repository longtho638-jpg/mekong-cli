"""
Finance Module - Data Entities
"""
from dataclasses import dataclass
from enum import Enum

class ReportPeriod(Enum):
    """Reporting timeframes."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class ProfitLoss:
    """Profit & Loss statement entity."""
    period: str
    revenue: float
    cogs: float
    gross_profit: float
    operating_expenses: float
    operating_income: float
    net_income: float

    def __post_init__(self):
        if self.revenue < 0:
            raise ValueError("Revenue cannot be negative")


@dataclass
class FinancialRatio:
    """A financial performance ratio record."""
    name: str
    value: float
    target: float
    unit: str = ""
    good_direction: str = "up"  # up or down
