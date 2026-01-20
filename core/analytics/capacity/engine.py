"""
Capacity calculation and logic.
"""
from typing import Dict, List

from .models import CapacityLevel, DepartmentCapacity


class CapacityEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.departments: Dict[str, DepartmentCapacity] = {}

    def get_level(self, dept: DepartmentCapacity) -> CapacityLevel:
        util = dept.utilization
        if util < 60: return CapacityLevel.UNDERLOADED
        if util <= 85: return CapacityLevel.OPTIMAL
        if util <= 95: return CapacityLevel.HIGH
        return CapacityLevel.OVERLOADED
