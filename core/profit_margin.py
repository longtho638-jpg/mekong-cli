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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CostType(Enum):
    """Categories of project-specific expenses."""
    LABOR = "labor"
    SOFTWARE = "software"
    CONTRACTOR = "contractor"
    ADVERTISING = "advertising"
    OTHER = "other"


class ProfitLevel(Enum):
    """Profitability benchmarks."""
    LOSS = "loss"          # < 0%
    LOW = "low"            # 0-20%
    HEALTHY = "healthy"    # 20-40%
    EXCELLENT = "excellent" # > 40%


@dataclass
class Cost:
    """A single project cost item entity."""
    type: CostType
    amount: float
    description: str

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Cost amount cannot be negative")


@dataclass
class ProjectPnL:
    """A project profit and loss record entity."""
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
    def net_profit(self) -> float:
        return self.revenue - self.total_costs
    
    @property
    def margin_pct(self) -> float:
        if self.revenue <= 0: return 0.0
        return (self.net_profit / self.revenue) * 100.0


class ProfitMarginTracker:
    """
    Profit Margin Tracker System.
    
    Orchestrates the tracking of project-level costs and revenue to derive granular profitability insights.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, ProjectPnL] = {}
        logger.info(f"Profit Margin Tracker initialized for {agency_name}")
    
    def register_project(
        self,
        name: str,
        client: str,
        revenue: float
    ) -> ProjectPnL:
        """Initialize a new project P&L record."""
        p = ProjectPnL(
            id=f"PRJ-{uuid.uuid4().hex[:6].upper()}",
            project_name=name, client=client, revenue=float(revenue)
        )
        self.projects[p.id] = p
        logger.info(f"Project P&L created: {name} (${revenue:,.0f})")
        return p
    
    def add_project_cost(self, p_id: str, c_type: CostType, amount: float, desc: str = ""):
        """Attach a cost item to an existing project."""
        if p_id not in self.projects:
            logger.error(f"Project {p_id} not found")
            return
            
        p = self.projects[p_id]
        p.costs.append(Cost(c_type, float(amount), desc or c_type.value))
        logger.info(f"Cost added to {p.project_name}: ${amount:,.2f} ({c_type.value})")
    
    def format_dashboard(self) -> str:
        """Render the Profit Margin Dashboard."""
        rev = sum(p.revenue for p in self.projects.values())
        costs = sum(p.total_costs for p in self.projects.values())
        profit = rev - costs
        margin = (profit / rev * 100.0) if rev > 0 else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 PROFIT MARGIN TRACKER DASHBOARD{' ' * 28}║",
            f"║  ${rev:,.0f} revenue │ ${profit:,.0f} net profit │ {margin:.1f}% avg margin{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PROJECT PERFORMANCE                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {ProfitLevel.EXCELLENT: "💚", ProfitLevel.HEALTHY: "🟢", ProfitLevel.LOW: "🟠", ProfitLevel.LOSS: "🔴"}
        
        for p in sorted(self.projects.values(), key=lambda x: x.margin_pct, reverse=True)[:5]:
            # Determine level
            lvl = ProfitLevel.EXCELLENT if p.margin_pct > 40 else ProfitLevel.HEALTHY if p.margin_pct >= 20 else ProfitLevel.LOW if p.margin_pct >= 0 else ProfitLevel.LOSS
            icon = icons.get(lvl, "⚪")
            bar = "█" * int(max(0, p.margin_pct / 10)) + "░" * int(max(0, 5 - (p.margin_pct / 10)))
            lines.append(f"║  {icon} {p.project_name[:15]:<15} │ {bar} │ {p.margin_pct:>5.1f}% │ ${p.net_profit:>8,.0f}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Project]  [💸 Add Cost]  [📈 Full Report]  [⚙️]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Profits!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💰 Initializing Profit Tracker...")
    print("=" * 60)
    
    try:
        tracker = ProfitMarginTracker("Saigon Digital Hub")
        # Seed
        p = tracker.register_project("Web Build", "Acme Corp", 10000.0)
        tracker.add_project_cost(p.id, CostType.LABOR, 4000.0, "Dev Team")
        tracker.add_project_cost(p.id, CostType.SOFTWARE, 500.0, "SaaS")
        
        print("\n" + tracker.format_dashboard())
        
    except Exception as e:
        logger.error(f"Tracker Error: {e}")
