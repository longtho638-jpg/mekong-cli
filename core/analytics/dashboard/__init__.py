"""
Refactored Analytics Dashboard Facade.
"""
from .presentation import PresentationOps


class AnalyticsDashboard(PresentationOps):
    """
    Refactored Analytics Dashboard với modular architecture.
    """
    def __init__(self, agency_name: str = "Nova Digital", demo_mode: bool = True):
        super().__init__(agency_name, demo_mode)
