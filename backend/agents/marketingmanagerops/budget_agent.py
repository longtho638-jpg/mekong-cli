"""
Budget Agent - Marketing Budget Management
Manages budget allocation, spend tracking, and ROI.
"""

import random
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List


class BudgetCategory(Enum):
    PAID_ADS = "paid_ads"
    CONTENT = "content"
    EVENTS = "events"
    TOOLS = "tools"
    CONTRACTORS = "contractors"
    OTHER = "other"


@dataclass
class BudgetLine:
    """Budget line item"""

    id: str
    category: BudgetCategory
    name: str
    allocated: float
    spent: float = 0
    revenue: float = 0

    @property
    def remaining(self) -> float:
        return self.allocated - self.spent

    @property
    def utilization(self) -> float:
        return (self.spent / self.allocated * 100) if self.allocated > 0 else 0

    @property
    def roi(self) -> float:
        return ((self.revenue - self.spent) / self.spent * 100) if self.spent > 0 else 0


class BudgetAgent:
    """
    Budget Agent - Quản lý Ngân sách Marketing

    Responsibilities:
    - Budget allocation
    - Spend tracking
    - ROI analysis
    - Forecast planning
    """

    def __init__(self, total_budget: float = 100000):
        self.name = "Budget"
        self.status = "ready"
        self.total_budget = total_budget
        self.budget_lines: Dict[str, BudgetLine] = {}

    def allocate(self, category: BudgetCategory, name: str, amount: float) -> BudgetLine:
        """Allocate budget"""
        line_id = f"budget_{random.randint(100, 999)}"

        line = BudgetLine(id=line_id, category=category, name=name, allocated=amount)

        self.budget_lines[line_id] = line
        return line

    def record_spend(self, line_id: str, amount: float, revenue: float = 0) -> BudgetLine:
        """Record spend"""
        if line_id not in self.budget_lines:
            raise ValueError(f"Budget line not found: {line_id}")

        line = self.budget_lines[line_id]
        line.spent += amount
        line.revenue += revenue

        return line

    def get_by_category(self, category: BudgetCategory) -> List[BudgetLine]:
        """Get budget lines by category"""
        return [lead for lead in self.budget_lines.values() if lead.category == category]

    def get_stats(self) -> Dict:
        """Get budget statistics"""
        lines = list(self.budget_lines.values())

        total_allocated = sum(lead.allocated for lead in lines)
        total_spent = sum(lead.spent for lead in lines)
        total_revenue = sum(lead.revenue for lead in lines)

        return {
            "total_budget": self.total_budget,
            "allocated": total_allocated,
            "spent": total_spent,
            "remaining": self.total_budget - total_spent,
            "revenue": total_revenue,
            "overall_roi": ((total_revenue - total_spent) / total_spent * 100)
            if total_spent > 0
            else 0,
            "by_category": {
                cat.value: sum(lead.spent for lead in self.get_by_category(cat)) for cat in BudgetCategory
            },
        }


# Demo
if __name__ == "__main__":
    agent = BudgetAgent(150000)

    print("💰 Budget Agent Demo\n")

    # Allocate budget
    b1 = agent.allocate(BudgetCategory.PAID_ADS, "Google Ads", 50000)
    b2 = agent.allocate(BudgetCategory.CONTENT, "Blog Production", 20000)
    b3 = agent.allocate(BudgetCategory.EVENTS, "Q1 Webinar Series", 15000)
    b4 = agent.allocate(BudgetCategory.TOOLS, "Marketing Tech Stack", 10000)

    print(f"📋 Budget: {b1.name}")
    print(f"   Category: {b1.category.value}")
    print(f"   Allocated: ${b1.allocated:,.0f}")

    # Record spend
    agent.record_spend(b1.id, 25000, revenue=75000)
    agent.record_spend(b2.id, 12000, revenue=18000)
    agent.record_spend(b3.id, 8000, revenue=12000)

    print(f"\n💸 Spend: ${b1.spent:,.0f}")
    print(f"   Revenue: ${b1.revenue:,.0f}")
    print(f"   ROI: {b1.roi:.0f}%")

    # Stats
    print("\n📊 Overall Stats:")
    stats = agent.get_stats()
    print(f"   Total Budget: ${stats['total_budget']:,.0f}")
    print(f"   Spent: ${stats['spent']:,.0f}")
    print(f"   Revenue: ${stats['revenue']:,.0f}")
    print(f"   ROI: {stats['overall_roi']:.0f}%")
