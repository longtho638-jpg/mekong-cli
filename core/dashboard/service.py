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
        self._load_data()

    def _load_data(self):
        """Ensure engines load data from disk."""
        # RevenueEngine inherits BaseEngine which has load_data
        # We try to load 'invoices.json' if the method exists
        if hasattr(self.revenue, "load_data"):
            # This is a best-effort since we don't control the engine internals entirely
            # Ideally RevenueEngine should load on init or on access
            try:
                # Assuming standard filename
                data = self.revenue.load_data("invoices.json")
                if data and hasattr(self.revenue, "invoices") and not self.revenue.invoices:
                    # Logic to rehydrate objects would go here
                    pass 
            except Exception:
                pass

    def get_revenue_summary(self) -> Dict[str, Any]:
        """Get financial health summary."""
        return self.revenue.get_stats()

    def get_leads_summary(self) -> Dict[str, Any]:
        """Get pipeline health summary."""
        return self.magnet.get_stats()

    def get_automation_status(self) -> Dict[str, Any]:
        """Get status of automation jobs."""
        return {
            "autopilot": "active", 
            "last_run": self.autopilot.run_date.isoformat()
        }

    def get_master_view(self) -> Dict[str, Any]:
        """Get complete dashboard data."""
        return {
            "revenue": self.get_revenue_summary(),
            "leads": self.get_leads_summary(),
            "automation": self.get_automation_status()
        }