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

import logging
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PricingStrategy(Enum):
    """Business strategies for calculating price."""
    COST_PLUS = "cost_plus"
    MARKET_BASED = "market_based"
    VALUE_BASED = "value_based"


class ServiceComplexity(Enum):
    """Degree of difficulty/intensity for a service."""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    ENTERPRISE = "enterprise"


@dataclass
class CostBreakdown:
    """Labor and overhead expenses for a service entity."""
    hours_required: float
    hourly_rate: float
    tools_cost: float
    overhead_cost: float

    @property
    def total_cost(self) -> float:
        """Calculate aggregate cost of production."""
        labor = self.hours_required * self.hourly_rate
        return float(labor + self.tools_cost + self.overhead_cost)


@dataclass
class PriceRecommendation:
    """Strategic price recommendation record."""
    service_name: str
    cost: float
    recommended_price: float
    profit_margin: float
    competitors_avg: float
    strategy_used: PricingStrategy


class PricingCalculator:
    """
    Pricing Calculator System.
    
    Orchestrates cost analysis and strategic pricing to maximize agency profitability.
    """

    # Market benchmarks by complexity
    MARKET_RATES = {
        ServiceComplexity.SIMPLE: {"min": 300, "max": 800, "avg": 500},
        ServiceComplexity.MODERATE: {"min": 800, "max": 2000, "avg": 1500},
        ServiceComplexity.COMPLEX: {"min": 2000, "max": 5000, "avg": 3500},
        ServiceComplexity.ENTERPRISE: {"min": 5000, "max": 15000, "avg": 10000},
    }

    def __init__(self, agency_name: str, target_margin: float = 0.40):
        self.agency_name = agency_name
        self.target_margin = target_margin  # 40% target
        logger.info(f"Pricing Calculator initialized for {agency_name}")

    def get_recommendation(
        self,
        service_name: str,
        costs: CostBreakdown,
        complexity: ServiceComplexity,
        value_bonus: float = 1.0
    ) -> PriceRecommendation:
        """Execute comprehensive pricing strategy logic."""
        if not service_name:
            raise ValueError("Service name is required")

        # 1. Cost-Plus Base
        cost_plus = costs.total_cost / (1 - self.target_margin)

        # 2. Market Reference
        market = self.MARKET_RATES[complexity]["avg"]

        # 3. Strategic Selection
        recommended = max(cost_plus, market) * value_bonus
        strategy = PricingStrategy.VALUE_BASED if value_bonus > 1.0 else PricingStrategy.MARKET_BASED

        margin = (recommended - costs.total_cost) / recommended
        logger.info(f"Price recommended for {service_name}: ${recommended:,.0f} ({strategy.value})")

        return PriceRecommendation(
            service_name=service_name, cost=costs.total_cost,
            recommended_price=recommended, profit_margin=margin,
            competitors_avg=market, strategy_used=strategy
        )

    def format_recommendation(self, rec: PriceRecommendation) -> str:
        """Render ASCII Price Recommendation report."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 PRICING STRATEGY - {rec.service_name.upper()[:28]:<28} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Production Cost:  ${rec.cost:>10,.0f} {' ' * 26}║",
            f"║  Market Average:   ${rec.competitors_avg:>10,.0f} {' ' * 26}║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  💰 RECOMMENDED QUOTE:                                    ║",
            "║    ╔═════════════════════╗                                ║",
            f"║    ║  ${rec.recommended_price:^17,.0f}  ║                                ║",
            "║    ╚═════════════════════╝                                ║",
            "║                                                           ║",
            f"║  📈 Net Profit:    ${rec.recommended_price - rec.cost:>10,.0f} {' ' * 26}║",
            f"║  📊 Target Margin: {rec.profit_margin:>10.1%} {' ' * 26}║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Win-Win!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💵 Initializing Pricing Calculator...")
    print("=" * 60)

    try:
        calc = PricingCalculator("Saigon Digital Hub")
        # Sample
        c_breakdown = CostBreakdown(20, 50.0, 100.0, 200.0)
        rec = calc.get_recommendation("SEO Audit", c_breakdown, ServiceComplexity.MODERATE, 1.2)
        print("\n" + calc.format_recommendation(rec))

    except Exception as e:
        logger.error(f"Pricing Error: {e}")
