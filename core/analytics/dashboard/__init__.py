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

    @property
    def mrr(self) -> float:
        """Backward compatibility property for MRR."""
        return self.get_mrr().get("mrr", 0.0)

    @property
    def arr(self) -> float:
        """Backward compatibility property for ARR."""
        return self.get_mrr().get("arr", 0.0)
