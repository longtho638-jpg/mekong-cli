"""
📈 Revenue Forecasting - Predict Future Revenue
================================================

Predict revenue with data-driven models.
Plan ahead with confidence!

Features:
- Historical analysis
- Trend prediction
- Pipeline weighted forecast
- Confidence intervals
"""

import uuid
import logging
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ForecastPeriod(Enum):
    """Supported intervals for financial projections."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class RevenueSource:
    """A stream of income entity record."""
    id: str
    name: str
    r_type: str  # recurring, project, product
    monthly_value: float
    growth_rate: float = 0.0

    def __post_init__(self):
        if self.monthly_value < 0:
            raise ValueError("Monthly value cannot be negative")


@dataclass
class Forecast:
    """A projection record for a specific future period."""
    period: str
    predicted: float
    optimistic: float
    pessimistic: float
    confidence: float


class RevenueForecasting:
    """
    Revenue Forecasting System.
    
    Orchestrates financial modeling, trend extrapolation, and risk-adjusted growth projections.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sources: List[RevenueSource] = []
        self.historical: Dict[str, float] = {}
        logger.info(f"Revenue Forecasting system initialized for {agency_name}")
    
    def add_income_source(
        self,
        name: str,
        r_type: str,
        value: float,
        growth: float = 0.0
    ) -> RevenueSource:
        """Register a new revenue stream for modeling."""
        source = RevenueSource(
            id=f"REV-{uuid.uuid4().hex[:6].upper()}",
            name=name, r_type=r_type, monthly_value=float(value), growth_rate=float(growth)
        )
        self.sources.append(source)
        logger.info(f"Revenue source added: {name} (${value:,.0f}/mo)")
        return source
    
    def generate_projections(self, months: int = 6) -> List[Forecast]:
        """Execute mathematical modeling to project future income."""
        projections = []
        base = sum(s.monthly_value for s in self.sources)
        avg_g = sum(s.growth_rate for s in self.sources) / len(self.sources) if self.sources else 0.02
        
        now = datetime.now()
        for i in range(1, months + 1):
            target_date = now + timedelta(days=30 * i)
            p_val = base * ((1 + avg_g) ** i)
            
            f = Forecast(
                period=target_date.strftime("%b %Y"),
                predicted=p_val,
                optimistic=p_val * 1.15,
                pessimistic=p_val * 0.85,
                confidence=max(40.0, 95.0 - (i * 5))
            )
            projections.append(f)
            
        logger.info(f"Generated {months}-month revenue projection.")
        return projections
    
    def format_dashboard(self, forecasts: List[Forecast]) -> str:
        """Render the Revenue Projections Dashboard."""
        curr_mo = sum(s.monthly_value for s in self.sources)
        total_proj = sum(f.predicted for f in forecasts)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 REVENUE PROJECTIONS DASHBOARD{' ' * 29}║",
            f"║  ${curr_mo:,.0f} current/mo │ ${total_proj:,.0f} projected total │ {len(forecasts)}mo horizon{' ' * 6}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 GROWTH TRAJECTORY (ADJUSTED)                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for f in forecasts[:6]:
            bar = "█" * int(f.confidence / 10) + "░" * (10 - int(f.confidence / 10))
            lines.append(f"║    {f.period:<10} │ ${f.predicted:>12,.0f} │ {bar} {f.confidence:>3.0f}% ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 Scenarios]  [📉 Risk Audit]  [📤 Export]  [⚙️ Model]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Plan Ahead!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📈 Initializing Projections...")
    print("=" * 60)
    
    try:
        engine = RevenueForecasting("Saigon Digital Hub")
        # Seed
        engine.add_income_source("Retainers", "recurring", 20000.0, 0.03)
        engine.add_income_source("Consulting", "project", 5000.0, 0.01)
        
        forecasts = engine.generate_projections(6)
        print("\n" + engine.format_dashboard(forecasts))
        
    except Exception as e:
        logger.error(f"Forecasting Error: {e}")
