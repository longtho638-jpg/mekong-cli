"""
Tax Planning Agent - Tax Optimization & Savings
Analyzes tax strategies and identifies savings opportunities.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class StrategyType(Enum):
    DEDUCTION = "deduction"
    CREDIT = "credit"
    DEFERRAL = "deferral"
    STRUCTURE = "structure"
    INCENTIVE = "incentive"


class StrategyPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class TaxStrategy:
    """Tax optimization strategy"""
    id: str
    name: str
    strategy_type: StrategyType
    description: str
    potential_savings: float
    priority: StrategyPriority = StrategyPriority.MEDIUM
    implemented: bool = False
    actual_savings: float = 0.0
    deadline: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class TaxPlanningAgent:
    """
    Tax Planning Agent - Lập kế hoạch Thuế
    
    Responsibilities:
    - Tax optimization
    - Deduction analysis
    - Credit identification
    - Savings projections
    """

    def __init__(self):
        self.name = "Tax Planning"
        self.status = "ready"
        self.strategies: Dict[str, TaxStrategy] = {}

    def add_strategy(
        self,
        name: str,
        strategy_type: StrategyType,
        description: str,
        potential_savings: float,
        priority: StrategyPriority = StrategyPriority.MEDIUM,
        deadline: Optional[datetime] = None
    ) -> TaxStrategy:
        """Add tax strategy"""
        strategy_id = f"strategy_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        strategy = TaxStrategy(
            id=strategy_id,
            name=name,
            strategy_type=strategy_type,
            description=description,
            potential_savings=potential_savings,
            priority=priority,
            deadline=deadline
        )

        self.strategies[strategy_id] = strategy
        return strategy

    def implement(self, strategy_id: str, actual_savings: float) -> TaxStrategy:
        """Mark strategy as implemented"""
        if strategy_id not in self.strategies:
            raise ValueError(f"Strategy not found: {strategy_id}")

        strategy = self.strategies[strategy_id]
        strategy.implemented = True
        strategy.actual_savings = actual_savings

        return strategy

    def get_by_type(self, strategy_type: StrategyType) -> List[TaxStrategy]:
        """Get strategies by type"""
        return [s for s in self.strategies.values() if s.strategy_type == strategy_type]

    def get_pending(self) -> List[TaxStrategy]:
        """Get pending strategies"""
        return [s for s in self.strategies.values() if not s.implemented]

    def get_high_value(self, threshold: float = 5000) -> List[TaxStrategy]:
        """Get high-value strategies"""
        return [s for s in self.strategies.values() if s.potential_savings >= threshold]

    def get_stats(self) -> Dict:
        """Get planning statistics"""
        strategies = list(self.strategies.values())
        implemented = [s for s in strategies if s.implemented]
        pending = [s for s in strategies if not s.implemented]

        return {
            "total_strategies": len(strategies),
            "implemented": len(implemented),
            "pending": len(pending),
            "potential_savings": sum(s.potential_savings for s in pending),
            "actual_savings": sum(s.actual_savings for s in implemented),
            "savings_rate": f"{sum(s.actual_savings for s in implemented) / sum(s.potential_savings for s in strategies) * 100:.0f}%" if strategies else "0%"
        }


# Demo
if __name__ == "__main__":
    agent = TaxPlanningAgent()

    print("💰 Tax Planning Agent Demo\n")

    # Add strategies
    s1 = agent.add_strategy(
        "R&D Tax Credit", StrategyType.CREDIT,
        "Claim R&D credits for software development",
        15000, StrategyPriority.HIGH
    )
    s2 = agent.add_strategy(
        "Equipment Depreciation", StrategyType.DEDUCTION,
        "Accelerated depreciation for new equipment",
        8000, StrategyPriority.MEDIUM
    )
    s3 = agent.add_strategy(
        "Startup Incentive", StrategyType.INCENTIVE,
        "Vietnamese startup tax incentive program",
        12000, StrategyPriority.HIGH
    )

    print(f"📋 Strategy: {s1.name}")
    print(f"   Type: {s1.strategy_type.value}")
    print(f"   Potential: ${s1.potential_savings:,.0f}")

    # Implement
    agent.implement(s1.id, 14500)
    agent.implement(s2.id, 7800)

    print(f"\n✅ Implemented: {s1.name}")
    print(f"   Actual Savings: ${s1.actual_savings:,.0f}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Potential: ${stats['potential_savings']:,.0f}")
    print(f"   Actual: ${stats['actual_savings']:,.0f}")
    print(f"   Savings Rate: {stats['savings_rate']}")
