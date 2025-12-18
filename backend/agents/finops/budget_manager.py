"""
Budget Manager Agent - Spending Limits & Alerts
Manages budgets, enforces limits, and sends notifications.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum


class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class Budget:
    """Budget configuration"""
    id: str
    name: str
    limit: float  # USD
    period: str = "monthly"  # daily, weekly, monthly
    spent: float = 0.0
    alerts_enabled: bool = True
    auto_throttle: bool = True
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def remaining(self) -> float:
        return max(0, self.limit - self.spent)
    
    @property
    def usage_percent(self) -> float:
        return (self.spent / self.limit * 100) if self.limit > 0 else 0


@dataclass
class Alert:
    """Budget alert"""
    id: str
    budget_id: str
    level: AlertLevel
    message: str
    threshold: int  # Percentage that triggered alert
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class BudgetManagerAgent:
    """
    Budget Manager Agent - Quản lý Ngân sách
    
    Responsibilities:
    - Set spending limits
    - Track usage against limits
    - Auto-throttle when limit reached
    - Send alert notifications
    """
    
    # Alert thresholds (percentage)
    ALERT_THRESHOLDS = {
        50: AlertLevel.INFO,
        80: AlertLevel.WARNING,
        95: AlertLevel.CRITICAL,
    }
    
    def __init__(self):
        self.name = "Budget Manager"
        self.status = "ready"
        self.budgets: Dict[str, Budget] = {}
        self.alerts: List[Alert] = []
        self.throttled: bool = False
        
    def create_budget(
        self,
        name: str,
        limit: float,
        period: str = "monthly"
    ) -> Budget:
        """Create a new budget"""
        budget_id = f"budget_{name.lower().replace(' ', '_')}"
        
        budget = Budget(
            id=budget_id,
            name=name,
            limit=limit,
            period=period
        )
        
        self.budgets[budget_id] = budget
        return budget
    
    def record_spending(self, budget_id: str, amount: float) -> Dict:
        """Record spending against a budget"""
        if budget_id not in self.budgets:
            raise ValueError(f"Budget not found: {budget_id}")
            
        budget = self.budgets[budget_id]
        budget.spent += amount
        
        # Check for alerts
        alerts_triggered = self._check_alerts(budget)
        
        # Check if should throttle
        should_throttle = False
        if budget.auto_throttle and budget.usage_percent >= 100:
            self.throttled = True
            should_throttle = True
        
        return {
            "budget_id": budget_id,
            "spent": budget.spent,
            "remaining": budget.remaining,
            "usage_percent": budget.usage_percent,
            "alerts": [a.message for a in alerts_triggered],
            "throttled": should_throttle
        }
    
    def _check_alerts(self, budget: Budget) -> List[Alert]:
        """Check and create alerts for budget thresholds"""
        triggered = []
        
        if not budget.alerts_enabled:
            return triggered
            
        for threshold, level in self.ALERT_THRESHOLDS.items():
            if budget.usage_percent >= threshold:
                # Check if already alerted for this threshold
                existing = [
                    a for a in self.alerts 
                    if a.budget_id == budget.id and a.threshold == threshold
                ]
                
                if not existing:
                    alert = Alert(
                        id=f"alert_{budget.id}_{threshold}",
                        budget_id=budget.id,
                        level=level,
                        message=f"⚠️ {budget.name}: {threshold}% of ${budget.limit} budget used",
                        threshold=threshold
                    )
                    self.alerts.append(alert)
                    triggered.append(alert)
        
        return triggered
    
    def can_spend(self, budget_id: str, amount: float) -> bool:
        """Check if spending is allowed"""
        if self.throttled:
            return False
            
        if budget_id not in self.budgets:
            return True  # No budget = no limit
            
        budget = self.budgets[budget_id]
        return budget.remaining >= amount
    
    def reset_budget(self, budget_id: str) -> Budget:
        """Reset budget spending (e.g., at start of new period)"""
        if budget_id not in self.budgets:
            raise ValueError(f"Budget not found: {budget_id}")
            
        budget = self.budgets[budget_id]
        budget.spent = 0.0
        self.throttled = False
        
        # Clear related alerts
        self.alerts = [a for a in self.alerts if a.budget_id != budget_id]
        
        return budget
    
    def get_summary(self) -> Dict:
        """Get summary of all budgets"""
        return {
            "budgets": [
                {
                    "id": b.id,
                    "name": b.name,
                    "limit": b.limit,
                    "spent": b.spent,
                    "remaining": b.remaining,
                    "usage_percent": round(b.usage_percent, 1),
                    "period": b.period
                }
                for b in self.budgets.values()
            ],
            "total_limit": sum(b.limit for b in self.budgets.values()),
            "total_spent": sum(b.spent for b in self.budgets.values()),
            "active_alerts": len([a for a in self.alerts if a.level in [AlertLevel.WARNING, AlertLevel.CRITICAL]]),
            "throttled": self.throttled
        }


# Demo
if __name__ == "__main__":
    manager = BudgetManagerAgent()
    
    print("💰 Budget Manager Agent Demo\n")
    
    # Create budgets
    ai_budget = manager.create_budget("AI Costs", limit=100.0, period="monthly")
    marketing_budget = manager.create_budget("Marketing", limit=50.0, period="monthly")
    
    print(f"📋 Created Budgets:")
    print(f"   {ai_budget.name}: ${ai_budget.limit}/month")
    print(f"   {marketing_budget.name}: ${marketing_budget.limit}/month")
    
    # Simulate spending
    print("\n💸 Recording Spending:")
    
    result1 = manager.record_spending(ai_budget.id, 45.0)
    print(f"   AI: Spent $45 → {result1['usage_percent']:.0f}% used")
    
    result2 = manager.record_spending(ai_budget.id, 40.0)
    print(f"   AI: Spent $40 → {result2['usage_percent']:.0f}% used")
    if result2['alerts']:
        print(f"   🚨 Alerts: {result2['alerts']}")
    
    # Check if can spend more
    can_spend = manager.can_spend(ai_budget.id, 20.0)
    print(f"\n❓ Can spend $20 more? {'Yes' if can_spend else 'No'}")
    
    # Summary
    print("\n📊 Budget Summary:")
    summary = manager.get_summary()
    print(f"   Total Limit: ${summary['total_limit']}")
    print(f"   Total Spent: ${summary['total_spent']}")
    print(f"   Active Alerts: {summary['active_alerts']}")
