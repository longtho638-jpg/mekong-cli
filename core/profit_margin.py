"""
💰 Profit Margin Tracker - Project Profitability
==================================================

Track profit margins per project.
Know what's really profitable!

Features:
- Cost tracking
- Margin calculation
- Project profitability
- Trend analysis
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class CostType(Enum):
    """Cost types."""
    LABOR = "labor"
    SOFTWARE = "software"
    CONTRACTOR = "contractor"
    ADVERTISING = "advertising"
    OTHER = "other"


class ProfitLevel(Enum):
    """Profit levels."""
    LOSS = "loss"          # < 0%
    LOW = "low"            # 0-20%
    HEALTHY = "healthy"    # 20-40%
    EXCELLENT = "excellent" # > 40%


@dataclass
class Cost:
    """A project cost."""
    type: CostType
    amount: float
    description: str


@dataclass
class ProjectPnL:
    """Project profit and loss."""
    id: str
    project_name: str
    client: str
    revenue: float
    costs: List[Cost] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.now)
    
    @property
    def total_costs(self) -> float:
        return sum(c.amount for c in self.costs)
    
    @property
    def profit(self) -> float:
        return self.revenue - self.total_costs
    
    @property
    def margin(self) -> float:
        return (self.profit / self.revenue * 100) if self.revenue else 0


class ProfitMarginTracker:
    """
    Profit Margin Tracker.
    
    Track project profitability.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, ProjectPnL] = {}
    
    def add_project(
        self,
        name: str,
        client: str,
        revenue: float
    ) -> ProjectPnL:
        """Add a project."""
        project = ProjectPnL(
            id=f"PRJ-{uuid.uuid4().hex[:6].upper()}",
            project_name=name,
            client=client,
            revenue=revenue
        )
        self.projects[project.id] = project
        return project
    
    def add_cost(
        self,
        project: ProjectPnL,
        cost_type: CostType,
        amount: float,
        description: str = ""
    ):
        """Add cost to project."""
        project.costs.append(Cost(cost_type, amount, description or cost_type.value))
    
    def get_level(self, project: ProjectPnL) -> ProfitLevel:
        """Get profit level."""
        margin = project.margin
        if margin < 0:
            return ProfitLevel.LOSS
        elif margin < 20:
            return ProfitLevel.LOW
        elif margin <= 40:
            return ProfitLevel.HEALTHY
        else:
            return ProfitLevel.EXCELLENT
    
    def get_totals(self) -> Dict[str, float]:
        """Get overall totals."""
        revenue = sum(p.revenue for p in self.projects.values())
        costs = sum(p.total_costs for p in self.projects.values())
        profit = revenue - costs
        margin = (profit / revenue * 100) if revenue else 0
        
        return {
            "revenue": revenue,
            "costs": costs,
            "profit": profit,
            "margin": margin
        }
    
    def format_dashboard(self) -> str:
        """Format profit margin dashboard."""
        totals = self.get_totals()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 PROFIT MARGIN TRACKER                                 ║",
            f"║  ${totals['revenue']:,.0f} rev │ {totals['margin']:.0f}% margin │ ${totals['profit']:,.0f} profit ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PROJECT PROFITABILITY                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"loss": "🔴", "low": "🟠", "healthy": "🟢", "excellent": "💚"}
        
        for project in sorted(self.projects.values(), key=lambda x: x.margin, reverse=True)[:5]:
            level = self.get_level(project)
            icon = level_icons[level.value]
            bar = "█" * max(0, int(project.margin / 10)) + "░" * max(0, (5 - int(project.margin / 10)))
            
            lines.append(f"║  {icon} {project.project_name[:15]:<15} │ {bar} │ {project.margin:>5.1f}% │ ${project.profit:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 COST BREAKDOWN                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Aggregate costs by type
        cost_totals = {}
        for project in self.projects.values():
            for cost in project.costs:
                cost_totals[cost.type.value] = cost_totals.get(cost.type.value, 0) + cost.amount
        
        type_icons = {"labor": "👥", "software": "💻", "contractor": "🤝", "advertising": "📢", "other": "📦"}
        
        for cost_type, amount in sorted(cost_totals.items(), key=lambda x: x[1], reverse=True)[:4]:
            icon = type_icons.get(cost_type, "•")
            lines.append(f"║    {icon} {cost_type.capitalize():<15} │ ${amount:>12,.0f}               ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  📊 Overall Margin: {totals['margin']:>5.1f}%                             ║",
            "║                                                           ║",
            "║  [📊 Details]  [📈 Trends]  [📥 Export]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your numbers!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = ProfitMarginTracker("Saigon Digital Hub")
    
    print("💰 Profit Margin Tracker")
    print("=" * 60)
    print()
    
    # Add projects
    p1 = tracker.add_project("SEO Campaign", "Sunrise Realty", 8000)
    tracker.add_cost(p1, CostType.LABOR, 3500, "SEO Team")
    tracker.add_cost(p1, CostType.SOFTWARE, 500, "Tools")
    
    p2 = tracker.add_project("Website Redesign", "Coffee Lab", 12000)
    tracker.add_cost(p2, CostType.LABOR, 5000, "Design & Dev")
    tracker.add_cost(p2, CostType.CONTRACTOR, 2000, "Copywriter")
    
    p3 = tracker.add_project("PPC Campaign", "Tech Startup", 5000)
    tracker.add_cost(p3, CostType.LABOR, 2000)
    tracker.add_cost(p3, CostType.ADVERTISING, 1500)
    
    p4 = tracker.add_project("Social Media", "Fashion Brand", 3000)
    tracker.add_cost(p4, CostType.LABOR, 1500)
    tracker.add_cost(p4, CostType.SOFTWARE, 200)
    
    print(tracker.format_dashboard())
