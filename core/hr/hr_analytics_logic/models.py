"""
Data models and Enums for HR Analytics.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class AttritionRisk(Enum):
    """Employee attrition risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Department(Enum):
    """Agency departments."""
    ENGINEERING = "engineering"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    OPERATIONS = "operations"
    FINANCE = "finance"
    HR = "hr"

@dataclass
class Employee:
    """An employee record entity."""
    id: str
    name: str
    department: Department
    role: str
    hire_date: datetime
    salary: float
    manager: str = ""
    enps_score: int = 0
    performance_score: int = 0
    attrition_risk: AttritionRisk = AttritionRisk.LOW

    def __post_init__(self):
        if self.salary < 0: raise ValueError("Salary cannot be negative")
        if not -100 <= self.enps_score <= 100: raise ValueError("eNPS must be between -100 and 100")

@dataclass
class HRMetric:
    """A specific HR performance indicator snapshot."""
    name: str
    current: float
    previous: float
    target: float
    unit: str = ""
