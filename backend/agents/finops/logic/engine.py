"""
Budget Manager core logic.
"""
from typing import Dict, List

from .models import Alert, AlertLevel, Budget


class BudgetEngine:
    ALERT_THRESHOLDS = {50: AlertLevel.INFO, 80: AlertLevel.WARNING, 95: AlertLevel.CRITICAL}

    def __init__(self):
        self.budgets: Dict[str, Budget] = {}
        self.alerts: List[Alert] = []
        self.throttled: bool = False

    def create_budget(self, name: str, limit: float, period: str = "monthly") -> Budget:
        bid = f"budget_{name.lower().replace(' ', '_')}"
        b = Budget(id=bid, name=name, limit=limit, period=period)
        self.budgets[bid] = b
        return b

    def record_spending(self, budget_id: str, amount: float) -> Dict:
        if budget_id not in self.budgets: raise ValueError(f"Budget not found: {budget_id}")
        b = self.budgets[budget_id]
        b.spent += amount
        triggered = self._check_alerts(b)
        throttle = b.auto_throttle and b.usage_percent >= 100
        if throttle: self.throttled = True
        return {"budget_id": budget_id, "spent": b.spent, "remaining": b.remaining, "usage_percent": b.usage_percent, "alerts": [a.message for a in triggered], "throttled": throttle}

    def _check_alerts(self, budget: Budget) -> List[Alert]:
        triggered = []
        if not budget.alerts_enabled: return triggered
        for t, l in self.ALERT_THRESHOLDS.items():
            if budget.usage_percent >= t:
                if not any(a for a in self.alerts if a.budget_id == budget.id and a.threshold == t):
                    alert = Alert(id=f"alert_{budget.id}_{t}", budget_id=budget.id, level=l, message=f"⚠️ {budget.name}: {t}% of ${budget.limit} used", threshold=t)
                    self.alerts.append(alert); triggered.append(alert)
        return triggered
