"""
Capacity Dashboard Data Models.
"""
from dataclasses import dataclass
from enum import Enum


class CapacityLevel(Enum):
    UNDERLOADED = "underloaded"
    OPTIMAL = "optimal"
    HIGH = "high"
    OVERLOADED = "overloaded"

@dataclass
class DepartmentCapacity:
    name: str
    total_hours: float
    used_hours: float
    members_count: int
    projects_count: int = 0

    @property
    def utilization(self) -> float:
        return (self.used_hours / self.total_hours * 100) if self.total_hours > 0 else 0.0
