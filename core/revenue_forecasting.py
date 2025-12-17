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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ForecastPeriod(Enum):
    """Forecast periods."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class RevenueSource:
    """A revenue source."""
    id: str
    name: str
    type: str  # recurring, project, product
    monthly_value: float
    growth_rate: float = 0  # % monthly growth


@dataclass
class Forecast:
    """A revenue forecast."""
    period: str
    predicted: float
    optimistic: float
    pessimistic: float
    confidence: float


class RevenueForecasting:
    """
    Revenue Forecasting.
    
    Predict future revenue.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sources: List[RevenueSource] = []
        self.historical: Dict[str, float] = {}
        self.forecasts: List[Forecast] = []
    
    def add_source(
        self,
        name: str,
        revenue_type: str,
        monthly_value: float,
        growth_rate: float = 0
    ) -> RevenueSource:
        """Add a revenue source."""
        source = RevenueSource(
            id=f"REV-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            type=revenue_type,
            monthly_value=monthly_value,
            growth_rate=growth_rate
        )
        self.sources.append(source)
        return source
    
    def set_historical(self, month: str, revenue: float):
        """Set historical revenue data."""
        self.historical[month] = revenue
    
    def generate_forecast(self, months: int = 6) -> List[Forecast]:
        """Generate revenue forecast."""
        self.forecasts = []
        
        base_monthly = sum(s.monthly_value for s in self.sources)
        avg_growth = sum(s.growth_rate for s in self.sources) / len(self.sources) if self.sources else 0.05
        
        now = datetime.now()
        
        for i in range(1, months + 1):
            future_date = now + timedelta(days=30 * i)
            period = future_date.strftime("%b %Y")
            
            # Apply compound growth
            predicted = base_monthly * ((1 + avg_growth) ** i)
            
            forecast = Forecast(
                period=period,
                predicted=predicted,
                optimistic=predicted * 1.2,
                pessimistic=predicted * 0.8,
                confidence=max(50, 95 - i * 5)  # Confidence decreases over time
            )
            self.forecasts.append(forecast)
        
        return self.forecasts
    
    def format_dashboard(self) -> str:
        """Format forecast dashboard."""
        total_monthly = sum(s.monthly_value for s in self.sources)
        recurring = sum(s.monthly_value for s in self.sources if s.type == "recurring")
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 REVENUE FORECASTING                                   ║",
            f"║  ${total_monthly:,.0f}/mo │ ${recurring:,.0f} recurring           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💰 REVENUE SOURCES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"recurring": "🔄", "project": "📁", "product": "📦"}
        
        for source in self.sources[:4]:
            icon = type_icons.get(source.type, "💵")
            growth = f"+{source.growth_rate*100:.0f}%" if source.growth_rate > 0 else "—"
            lines.append(f"║    {icon} {source.name:<18} │ ${source.monthly_value:>8,.0f}/mo │ {growth:<5}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 6-MONTH FORECAST                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for forecast in self.forecasts[:6]:
            bar = "█" * int(forecast.confidence / 10) + "░" * (10 - int(forecast.confidence / 10))
            lines.append(f"║    {forecast.period:<8} │ ${forecast.predicted:>10,.0f} │ {bar} {forecast.confidence:.0f}%  ║")
        
        # Calculate totals
        total_forecast = sum(f.predicted for f in self.forecasts)
        
        lines.extend([
            "║                                                           ║",
            f"║  📈 6-Month Total: ${total_forecast:>12,.0f}                    ║",
            "║                                                           ║",
            "║  [📊 Detailed]  [📥 Export]  [⚙️ Adjust]                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Plan with confidence!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    forecasting = RevenueForecasting("Saigon Digital Hub")
    
    print("📈 Revenue Forecasting")
    print("=" * 60)
    print()
    
    # Add revenue sources
    forecasting.add_source("Retainer Clients", "recurring", 15000, 0.05)
    forecasting.add_source("Project Work", "project", 8000, 0.03)
    forecasting.add_source("SaaS Affiliates", "recurring", 3000, 0.10)
    forecasting.add_source("Training/Courses", "product", 2000, 0.08)
    
    # Generate forecast
    forecasting.generate_forecast(6)
    
    print(forecasting.format_dashboard())
