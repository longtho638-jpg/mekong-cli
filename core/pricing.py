"""
💵 Pricing Calculator - Optimize Your Rates
=============================================

Calculate optimal pricing for agency services.
Maximize profit while staying competitive!

Features:
- Cost-based pricing
- Market-based pricing
- Value-based pricing
- Profit margin analysis
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class PricingStrategy(Enum):
    """Pricing strategies."""
    COST_PLUS = "cost_plus"
    MARKET_BASED = "market_based"
    VALUE_BASED = "value_based"


class ServiceComplexity(Enum):
    """Service complexity level."""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    ENTERPRISE = "enterprise"


@dataclass
class CostBreakdown:
    """Cost breakdown for a service."""
    hours_required: float
    hourly_rate: float
    tools_cost: float
    overhead_cost: float
    
    @property
    def total_cost(self) -> float:
        labor = self.hours_required * self.hourly_rate
        return labor + self.tools_cost + self.overhead_cost


@dataclass
class PriceRecommendation:
    """Price recommendation result."""
    service_name: str
    cost: float
    recommended_price: float
    profit_margin: float
    competitors_avg: float
    strategy_used: PricingStrategy


class PricingCalculator:
    """
    Pricing Calculator.
    
    Calculate optimal pricing for agency services.
    """
    
    # Market benchmarks by complexity
    MARKET_RATES = {
        ServiceComplexity.SIMPLE: {"min": 300, "max": 800, "avg": 500},
        ServiceComplexity.MODERATE: {"min": 800, "max": 2000, "avg": 1500},
        ServiceComplexity.COMPLEX: {"min": 2000, "max": 5000, "avg": 3500},
        ServiceComplexity.ENTERPRISE: {"min": 5000, "max": 15000, "avg": 10000},
    }
    
    # Value multipliers
    VALUE_MULTIPLIERS = {
        "high_roi": 2.0,
        "quick_turnaround": 1.5,
        "specialized_expertise": 1.8,
        "ongoing_support": 1.3,
    }
    
    def __init__(self, agency_name: str, target_margin: float = 0.40):
        self.agency_name = agency_name
        self.target_margin = target_margin  # 40% default
    
    def calculate_cost_plus(
        self,
        costs: CostBreakdown,
        margin: float = None
    ) -> float:
        """Calculate price using cost-plus strategy."""
        if margin is None:
            margin = self.target_margin
        
        return costs.total_cost / (1 - margin)
    
    def calculate_market_based(
        self,
        complexity: ServiceComplexity,
        position: str = "average"  # low, average, premium
    ) -> float:
        """Calculate price based on market rates."""
        rates = self.MARKET_RATES[complexity]
        
        if position == "low":
            return rates["min"]
        elif position == "premium":
            return rates["max"]
        else:
            return rates["avg"]
    
    def calculate_value_based(
        self,
        base_price: float,
        value_factors: List[str]
    ) -> float:
        """Calculate price based on value delivered."""
        multiplier = 1.0
        
        for factor in value_factors:
            if factor in self.VALUE_MULTIPLIERS:
                multiplier *= self.VALUE_MULTIPLIERS[factor]
        
        return base_price * multiplier
    
    def get_recommendation(
        self,
        service_name: str,
        costs: CostBreakdown,
        complexity: ServiceComplexity,
        value_factors: List[str] = None
    ) -> PriceRecommendation:
        """Get comprehensive price recommendation."""
        if value_factors is None:
            value_factors = []
        
        # Calculate all strategies
        cost_plus_price = self.calculate_cost_plus(costs)
        market_price = self.calculate_market_based(complexity)
        value_price = self.calculate_value_based(market_price, value_factors)
        
        # Choose best strategy
        if value_factors:
            recommended = value_price
            strategy = PricingStrategy.VALUE_BASED
        elif cost_plus_price > market_price:
            recommended = cost_plus_price
            strategy = PricingStrategy.COST_PLUS
        else:
            recommended = market_price
            strategy = PricingStrategy.MARKET_BASED
        
        # Calculate profit margin
        profit = recommended - costs.total_cost
        margin = profit / recommended
        
        return PriceRecommendation(
            service_name=service_name,
            cost=costs.total_cost,
            recommended_price=recommended,
            profit_margin=margin,
            competitors_avg=self.MARKET_RATES[complexity]["avg"],
            strategy_used=strategy
        )
    
    def format_recommendation(self, rec: PriceRecommendation) -> str:
        """Format price recommendation."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 PRICING RECOMMENDATION                                ║",
            f"║  Service: {rec.service_name:<44}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  COST ANALYSIS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Your Cost: ${rec.cost:>12,.0f}                             ║",
            f"║    Competitors Avg: ${rec.competitors_avg:>8,.0f}                         ║",
            "║                                                           ║",
            "║  💰 RECOMMENDED PRICE                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # Price display with emphasis
        price_str = f"${rec.recommended_price:,.0f}"
        lines.append(f"║    ╔═════════════════════╗                              ║")
        lines.append(f"║    ║  {price_str:^19}  ║                              ║")
        lines.append(f"║    ╚═════════════════════╝                              ║")
        
        # Profit info
        profit = rec.recommended_price - rec.cost
        lines.extend([
            "║                                                           ║",
            f"║    Profit: ${profit:>11,.0f}                                  ║",
            f"║    Margin: {rec.profit_margin * 100:>10.1f}%                                  ║",
            f"║    Strategy: {rec.strategy_used.value:<39}  ║",
        ])
        
        # Rating
        if rec.profit_margin >= 0.50:
            rating = "🔥 EXCELLENT MARGIN!"
        elif rec.profit_margin >= 0.30:
            rating = "✅ HEALTHY MARGIN"
        elif rec.profit_margin >= 0.15:
            rating = "🟡 ACCEPTABLE"
        else:
            rating = "⚠️ LOW MARGIN"
        
        lines.extend([
            "║                                                           ║",
            f"║    {rating:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - \"Không đánh mà thắng\"            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_pricing_table(self) -> str:
        """Format market rates table."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  📊 MARKET PRICING GUIDE                                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Complexity    │   Min    │   Avg    │   Max    │ Margin ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for complexity, rates in self.MARKET_RATES.items():
            name = complexity.value.capitalize()[:12]
            lines.append(
                f"║  {name:<12}  │ ${rates['min']:>6,} │ ${rates['avg']:>6,} │ ${rates['max']:>6,} │  40%   ║"
            )
        
        lines.extend([
            "║                                                           ║",
            "║  💡 Value Multipliers:                                    ║",
            "║    • High ROI: 2.0x                                       ║",
            "║    • Quick Turnaround: 1.5x                               ║",
            "║    • Specialized: 1.8x                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    calculator = PricingCalculator("Saigon Digital Hub")
    
    print("💵 Pricing Calculator")
    print("=" * 60)
    print()
    
    # Show market guide
    print(calculator.format_pricing_table())
    print()
    
    # Sample calculation
    costs = CostBreakdown(
        hours_required=20,
        hourly_rate=50,
        tools_cost=100,
        overhead_cost=200
    )
    
    rec = calculator.get_recommendation(
        service_name="SEO Strategy Package",
        costs=costs,
        complexity=ServiceComplexity.MODERATE,
        value_factors=["high_roi"]
    )
    
    print(calculator.format_recommendation(rec))
