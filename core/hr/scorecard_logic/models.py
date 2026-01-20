"""
Data models for Agency Scorecard.
"""
from dataclasses import dataclass
from enum import Enum


class MetricCategory(Enum):
    """Metric categories."""
    FINANCIAL = "financial"
    CLIENTS = "clients"
    OPERATIONS = "operations"
    TEAM = "team"
    GROWTH = "growth"

class Grade(Enum):
    """Performance grades."""
    A = "A"  # Excellent (90%+)
    B = "B"  # Good (75-89%)
    C = "C"  # Needs work (60-74%)
    D = "D"  # Poor (<60%)

@dataclass
class KPI:
    """A key performance indicator entity."""
    name: str
    category: MetricCategory
    current: float
    target: float
    unit: str = ""
    trend: float = 0.0  # % change since last period
