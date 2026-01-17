"""
💰 Pricing Intelligence - Collective Market Benchmarks
======================================================

Part of Agency Guild Protocol.
Provides market benchmarks to prevent race-to-bottom pricing.

Features:
- Market rate benchmarks (Floor, Median, Top)
- Project data submission
- Price recommendations
- Trend analysis
"""

import logging
from typing import Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class PricingBenchmark:
    """Pricing benchmark data entity for a service."""
    service_type: str
    floor_rate: float
    median_rate: float
    top_rate: float
    sample_size: int = 0
    last_trend: float = 0.0
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.floor_rate < 0 or self.median_rate < 0:
            raise ValueError("Rates cannot be negative")


@dataclass
class ProjectSubmission:
    """Anonymized project data submission entity."""
    service_type: str
    value: float
    complexity: str  # simple, medium, complex
    won: bool = True
    scope_changed: bool = False


class PricingIntelligence:
    """
    Pricing Intelligence System.
    
    Orchestrates collective market intelligence to ensure fair and competitive agency pricing.
    """

    # Predefined baseline rates
    BASELINES = {
        'landing_page': {'floor': 2500, 'median': 4200, 'top': 8500},
        'website_design': {'floor': 5000, 'median': 12000, 'top': 35000},
        'web_app': {'floor': 15000, 'median': 45000, 'top': 150000},
        'seo_monthly': {'floor': 1500, 'median': 3500, 'top': 8000},
    }

    def __init__(self):
        self.benchmarks: Dict[str, PricingBenchmark] = {}
        logger.info("Pricing Intelligence System initialized.")
        self._init_defaults()

    def _init_defaults(self):
        """Seed the system with baseline benchmarks."""
        logger.info("Loading baseline market benchmarks...")
        for s_type, rates in self.BASELINES.items():
            self.benchmarks[s_type] = PricingBenchmark(
                service_type=s_type,
                floor_rate=float(rates['floor']),
                median_rate=float(rates['median']),
                top_rate=float(rates['top']),
                sample_size=127 # Simulated
            )

    def submit_project(self, sub: ProjectSubmission):
        """Register a new project data point into the collective set."""
        logger.info(f"New project data submitted for {sub.service_type}: ${sub.value:,.0f}")
        # In production: Update aggregates in DB

    def format_benchmark_report(self, s_type: str) -> str:
        """Render ASCII benchmark report for a specific service."""
        if s_type not in self.benchmarks: return f"Service '{s_type}' not found."

        b = self.benchmarks[s_type]
        name = s_type.replace('_', ' ').title()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 PRICING BENCHMARK - {name:<34} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🟢 Floor (10th %):  ${b.floor_rate:>10,.0f} {' ' * 23}║",
            f"║  🟡 Median (50th %): ${b.median_rate:>10,.0f} {' ' * 23}║",
            f"║  🔵 Top (90th %):    ${b.top_rate:>10,.0f} {' ' * 23}║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║  Sample Size: {b.sample_size:<5} │ Updated: {b.updated_at.strftime('%Y-%m-%d')} {' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚠️ UNDERCUTTING NOTICE:                                  ║",
            f"║    Quotes below ${b.floor_rate:,.0f} trigger a Guild Warning.      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)


# Command registration interface
def register_commands() -> Dict[str, Any]:
    """Register pricing commands with the main CLI."""
    system = PricingIntelligence()
    return {
        "/pricing": {
            "handler": system.format_benchmark_report,
            "description": "View market rate benchmarks"
        }
    }

# Example usage
if __name__ == "__main__":
    print("💰 Initializing Pricing Intel...")
    print("=" * 60)

    try:
        intel = PricingIntelligence()
        print("\n" + intel.format_benchmark_report("web_app"))

    except Exception as e:
        logger.error(f"Intel Error: {e}")
