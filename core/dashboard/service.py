"""
Unified Dashboard Service
=========================

Aggregates data from various engines (Revenue, Leads, Automation) 
to provide a single view of the agency's health.
"""

from typing import Dict, Any, List
from antigravity.core.revenue_engine import RevenueEngine
from antigravity.core.client_magnet import ClientMagnet
from core.automation.autopilot import RevenueAutopilotService

class DashboardService:
    """
    Unified Dashboard Service
    """
    def __init__(self):
        self.revenue = RevenueEngine()
        self.magnet = ClientMagnet()
        self.autopilot = RevenueAutopilotService()

    def get_revenue_summary(self) -> Dict[str, Any]:
        """Get financial health summary."""
        # TODO: Ensure engines load data from disk
        return self.revenue.get_stats()

    def get_leads_summary(self) -> Dict[str, Any]:
        """Get pipeline health summary."""
        return self.magnet.get_stats()

    def get_automation_status(self) -> Dict[str, Any]:
        """Get status of automation jobs."""
        return {
            "autopilot": "active", # Placeholder
            "last_run": self.autopilot.run_date.isoformat()
        }

    def get_master_view(self) -> Dict[str, Any]:
        """Get complete dashboard data."""
        return {
            "revenue": self.get_revenue_summary(),
            "leads": self.get_leads_summary(),
            "automation": self.get_automation_status()
        }
