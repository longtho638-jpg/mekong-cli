"""
Master Dashboard
================
Unified Command & Control for Agency OS.
"""
from .service import MasterDashboardService
from .types import (
    AgenticLayerDict,
    InfraLayerDict,
    MasterLayersDict,
    MasterSummaryDict,
    RetentionLayerDict,
    RevenueLayerDict,
)
from .ui import DashboardRenderer


class MasterDashboard:
    """
    Facade for the Master Dashboard Service and UI.
    Maintains backward compatibility.
    """

    def __init__(self):
        self.service = MasterDashboardService()
        self.renderer = DashboardRenderer()

    def get_platform_score(self) -> int:
        """Calculates a composite Readiness Score (0-100)."""
        return self.service.get_platform_score()

    def get_summary(self) -> MasterSummaryDict:
        """Collects metrics summary."""
        return self.service.get_summary()

    def print_master_report(self):
        """Renders dashboard to console."""
        summary = self.get_summary()
        self.renderer.render(summary)


# Global Interface functions
def show_full_status():
    """Entry point for the master dashboard display."""
    md = MasterDashboard()
    md.print_master_report()


def get_system_health() -> int:
    """Quick access to the composite platform score."""
    return MasterDashboard().get_platform_score()


__all__ = [
    "MasterDashboard",
    "show_full_status",
    "get_system_health",
    "MasterSummaryDict",
    "MasterLayersDict",
]
