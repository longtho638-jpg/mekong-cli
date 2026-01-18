"""
Forecast Agent - Revenue Forecasting
Predicts revenue and analyzes pipeline trends.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List


class ForecastPeriod(Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


@dataclass
class DealForecast:
    """Deal forecast entry"""

    deal_id: str
    company: str
    value: float
    probability: float  # 0-100
    close_date: datetime
    stage: str

    @property
    def weighted_value(self) -> float:
        return self.value * (self.probability / 100)


@dataclass
class Forecast:
    """Revenue forecast"""

    id: str
    period: ForecastPeriod
    start_date: datetime
    end_date: datetime
    pipeline_value: float
    weighted_value: float
    best_case: float
    worst_case: float
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class ForecastAgent:
    """
    Forecast Agent - Dự báo Doanh thu

    Responsibilities:
    - Calculate revenue forecasts
    - Analyze pipeline trends
    - Scenario modeling
    - Confidence intervals
    """

    def __init__(self):
        self.name = "Forecast"
        self.status = "ready"
        self.deals: List[DealForecast] = []
        self.forecasts: Dict[str, Forecast] = {}

    def add_deal(
        self,
        deal_id: str,
        company: str,
        value: float,
        probability: float,
        close_date: datetime,
        stage: str,
    ) -> DealForecast:
        """Add deal to forecast"""
        deal = DealForecast(
            deal_id=deal_id,
            company=company,
            value=value,
            probability=probability,
            close_date=close_date,
            stage=stage,
        )
        self.deals.append(deal)
        return deal

    def generate_forecast(self, period: ForecastPeriod = ForecastPeriod.MONTHLY) -> Forecast:
        """Generate revenue forecast"""
        now = datetime.now()

        if period == ForecastPeriod.WEEKLY:
            start = now
            end = now + timedelta(days=7)
        elif period == ForecastPeriod.MONTHLY:
            start = now
            end = now + timedelta(days=30)
        else:
            start = now
            end = now + timedelta(days=90)

        # Filter deals in period
        period_deals = [d for d in self.deals if start <= d.close_date <= end]

        pipeline = sum(d.value for d in period_deals)
        weighted = sum(d.weighted_value for d in period_deals)

        # Best/worst case scenarios
        high_prob = [d for d in period_deals if d.probability >= 70]
        best_case = weighted * 1.2
        worst_case = sum(d.value for d in high_prob) * 0.8

        forecast_id = f"forecast_{period.value}_{int(now.timestamp())}"

        forecast = Forecast(
            id=forecast_id,
            period=period,
            start_date=start,
            end_date=end,
            pipeline_value=pipeline,
            weighted_value=weighted,
            best_case=best_case,
            worst_case=worst_case,
        )

        self.forecasts[forecast_id] = forecast
        return forecast

    def get_trend(self, months: int = 3) -> List[Dict]:
        """Get forecast trend"""
        trend = []
        for i in range(months):
            month_start = datetime.now() + timedelta(days=30 * i)
            month_deals = [
                d
                for d in self.deals
                if month_start <= d.close_date < month_start + timedelta(days=30)
            ]
            trend.append(
                {
                    "month": month_start.strftime("%b"),
                    "pipeline": sum(d.value for d in month_deals),
                    "weighted": sum(d.weighted_value for d in month_deals),
                }
            )
        return trend

    def get_stats(self) -> Dict:
        """Get forecast stats"""
        return {
            "total_pipeline": sum(d.value for d in self.deals),
            "weighted_pipeline": sum(d.weighted_value for d in self.deals),
            "active_deals": len(self.deals),
            "avg_probability": sum(d.probability for d in self.deals) / len(self.deals)
            if self.deals
            else 0,
        }


# Demo
if __name__ == "__main__":
    agent = ForecastAgent()

    print("📈 Forecast Agent Demo\n")

    # Add deals
    agent.add_deal(
        "deal_1", "TechCorp", 10000, 80, datetime.now() + timedelta(days=10), "Negotiation"
    )
    agent.add_deal("deal_2", "StartupX", 5000, 60, datetime.now() + timedelta(days=20), "Proposal")
    agent.add_deal(
        "deal_3", "Enterprise", 25000, 40, datetime.now() + timedelta(days=45), "Discovery"
    )

    # Generate forecast
    forecast = agent.generate_forecast(ForecastPeriod.MONTHLY)

    print("📊 Monthly Forecast:")
    print(f"   Pipeline: ${forecast.pipeline_value:,.0f}")
    print(f"   Weighted: ${forecast.weighted_value:,.0f}")
    print(f"   Best Case: ${forecast.best_case:,.0f}")
    print(f"   Worst Case: ${forecast.worst_case:,.0f}")

    # Trend
    print("\n📈 Trend:")
    for t in agent.get_trend(3):
        print(f"   {t['month']}: ${t['pipeline']:,.0f}")
