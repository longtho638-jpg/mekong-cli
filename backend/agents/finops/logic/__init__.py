"""
Budget Manager Agent Facade.
"""

from typing import Dict

from .engine import BudgetEngine
from .models import Alert, AlertLevel, Budget


class BudgetManagerAgent(BudgetEngine):
    def __init__(self):
        super().__init__()
        self.name = "Budget Manager"
        self.status = "ready"

    def get_summary(self) -> Dict:
        return {
            "budgets": [
                {
                    "id": b.id,
                    "name": b.name,
                    "limit": b.limit,
                    "spent": b.spent,
                    "usage_percent": round(b.usage_percent, 1),
                }
                for b in self.budgets.values()
            ],
            "total_limit": sum(b.limit for b in self.budgets.values()),
            "total_spent": sum(b.spent for b in self.budgets.values()),
            "throttled": self.throttled,
        }
