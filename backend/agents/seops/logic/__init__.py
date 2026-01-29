"""
Demo Manager Agent Facade.
"""

from typing import Dict

from .engine import DemoEngine
from .models import Demo, DemoOutcome, DemoType


class DemoManagerAgent(DemoEngine):
    """Refactored Demo Manager Agent."""

    def __init__(self):
        super().__init__()
        self.name = "Demo Manager"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {
            "total_demos": len(self.demos),
            "scheduled": len(
                [d for d in self.demos.values() if d.outcome == DemoOutcome.SCHEDULED]
            ),
        }


__all__ = ["DemoManagerAgent", "DemoType", "DemoOutcome", "Demo"]
