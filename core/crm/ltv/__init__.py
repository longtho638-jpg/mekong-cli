"""
Client LTV Facade and Dashboard.
"""
from typing import Any, Dict

from .engine import LTVEngine
from .models import ClientLTV, ClientTier


class ClientLifetimeValue(LTVEngine):
    """Refactored Client LTV System."""
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def get_aggregate_stats(self) -> Dict[str, Any]:
        if not self.clients: return {"total_ltv": 0.0, "avg_ltv": 0.0, "count": 0}
        total = sum(c.predicted_ltv for c in self.clients.values())
        return {"total_ltv": total, "avg_ltv": total / len(self.clients), "count": len(self.clients)}

    def format_dashboard(self) -> str:
        stats = self.get_aggregate_stats()
        return f"💎 Client LTV Dashboard - {self.agency_name}\nTotal LTV: ${stats['total_ltv']:,.0f}"

__all__ = ['ClientLifetimeValue', 'ClientTier', 'ClientLTV']
