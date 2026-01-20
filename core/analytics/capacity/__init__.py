"""
Capacity Dashboard Facade.
"""
from .engine import CapacityEngine
from .models import CapacityLevel, DepartmentCapacity


class CapacityDashboard(CapacityEngine):
    """Refactored Capacity Dashboard."""
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def format_dashboard(self) -> str:
        return f"📊 Capacity Dashboard - {self.agency_name}"

__all__ = ['CapacityDashboard', 'CapacityLevel', 'DepartmentCapacity']
