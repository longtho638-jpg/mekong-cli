"""
Workforce Planning Agent - Headcount & Forecasting
Plans workforce needs and forecasts hiring.
"""

from dataclasses import dataclass
from typing import Dict
from datetime import datetime
from enum import Enum
import random


class PlanStatus(Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class PlanType(Enum):
    HIRING = "hiring"
    RESTRUCTURE = "restructure"
    REDUCTION = "reduction"
    ORGANIC = "organic"


@dataclass
class HeadcountPlan:
    """Workforce headcount plan"""
    id: str
    department: str
    plan_type: PlanType
    current_headcount: int
    target_headcount: int
    fiscal_year: str
    status: PlanStatus = PlanStatus.DRAFT
    budget: float = 0
    filled: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def gap(self) -> int:
        return self.target_headcount - self.current_headcount - self.filled

    @property
    def progress(self) -> float:
        total_needed = self.target_headcount - self.current_headcount
        if total_needed <= 0:
            return 100
        return (self.filled / total_needed) * 100


class WorkforcePlanningAgent:
    """
    Workforce Planning Agent - Lập kế hoạch Nhân lực
    
    Responsibilities:
    - Plan headcount
    - Forecast hiring needs
    - Predict attrition
    - Budget planning
    """

    def __init__(self):
        self.name = "Workforce Planning"
        self.status = "ready"
        self.plans: Dict[str, HeadcountPlan] = {}

    def create_plan(
        self,
        department: str,
        plan_type: PlanType,
        current_headcount: int,
        target_headcount: int,
        fiscal_year: str,
        budget: float = 0
    ) -> HeadcountPlan:
        """Create headcount plan"""
        plan_id = f"plan_{department}_{fiscal_year}_{random.randint(100,999)}"

        plan = HeadcountPlan(
            id=plan_id,
            department=department,
            plan_type=plan_type,
            current_headcount=current_headcount,
            target_headcount=target_headcount,
            fiscal_year=fiscal_year,
            budget=budget
        )

        self.plans[plan_id] = plan
        return plan

    def approve_plan(self, plan_id: str) -> HeadcountPlan:
        """Approve plan"""
        if plan_id not in self.plans:
            raise ValueError(f"Plan not found: {plan_id}")

        plan = self.plans[plan_id]
        plan.status = PlanStatus.APPROVED

        return plan

    def fill_position(self, plan_id: str, count: int = 1) -> HeadcountPlan:
        """Mark positions as filled"""
        if plan_id not in self.plans:
            raise ValueError(f"Plan not found: {plan_id}")

        plan = self.plans[plan_id]
        plan.filled += count
        plan.status = PlanStatus.IN_PROGRESS

        if plan.gap <= 0:
            plan.status = PlanStatus.COMPLETED

        return plan

    def forecast_hiring(self, months: int = 12) -> Dict:
        """Forecast hiring needs"""
        plans = [p for p in self.plans.values() if p.status in [PlanStatus.APPROVED, PlanStatus.IN_PROGRESS]]

        total_gap = sum(p.gap for p in plans)
        monthly_target = total_gap / months if months > 0 else 0

        return {
            "total_open": total_gap,
            "monthly_target": int(monthly_target),
            "total_budget": sum(p.budget for p in plans),
            "departments": len(set(p.department for p in plans))
        }

    def get_stats(self) -> Dict:
        """Get planning statistics"""
        plans = list(self.plans.values())
        active = [p for p in plans if p.status not in [PlanStatus.COMPLETED]]

        return {
            "total_plans": len(plans),
            "active": len(active),
            "total_target": sum(p.target_headcount for p in plans),
            "total_filled": sum(p.filled for p in plans),
            "total_budget": sum(p.budget for p in plans)
        }


# Demo
if __name__ == "__main__":
    agent = WorkforcePlanningAgent()

    print("📈 Workforce Planning Agent Demo\n")

    # Create plans
    p1 = agent.create_plan("Engineering", PlanType.HIRING, 150, 180, "FY2025", budget=900000)
    p2 = agent.create_plan("Product", PlanType.HIRING, 50, 60, "FY2025", budget=300000)
    p3 = agent.create_plan("Sales", PlanType.ORGANIC, 30, 35, "FY2025", budget=150000)

    print(f"📋 Plan: {p1.department}")
    print(f"   Type: {p1.plan_type.value}")
    print(f"   Current: {p1.current_headcount} → Target: {p1.target_headcount}")
    print(f"   Gap: {p1.gap}")

    # Approve and fill
    agent.approve_plan(p1.id)
    agent.fill_position(p1.id, 10)

    print(f"\n✅ Filled: {p1.filled}")
    print(f"   Progress: {p1.progress:.0f}%")

    # Forecast
    print("\n🔮 Forecast:")
    forecast = agent.forecast_hiring(12)
    print(f"   Open Positions: {forecast['total_open']}")
    print(f"   Monthly Target: {forecast['monthly_target']}")
    print(f"   Total Budget: ${forecast['total_budget']:,.0f}")
