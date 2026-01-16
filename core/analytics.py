"""
📊 Analytics Dashboard - Real-Time Agency Insights
===================================================

Know your numbers. Grow your agency.

Features:
- Revenue tracking (MRR, ARR, growth)
- Client analytics
- Project performance
- Affiliate metrics
- Financial forecasting
"""

import random
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MetricPeriod(Enum):
    """Time periods for metrics."""
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL_TIME = "all_time"


class RevenueType(Enum):
    """Types of revenue."""
    SERVICE = "service"
    RETAINER = "retainer"
    AFFILIATE = "affiliate"
    TEMPLATE = "template"
    REFERRAL = "referral"
    OTHER = "other"


@dataclass
class RevenueEntry:
    """A single revenue entry."""
    id: str
    amount: float
    type: RevenueType
    client_id: Optional[str]
    description: str
    date: datetime
    recurring: bool = False


@dataclass
class MetricSnapshot:
    """A point-in-time metric snapshot."""
    timestamp: datetime
    value: float
    change_percent: float = 0.0


@dataclass
class ClientMetrics:
    """Metrics for a single client."""
    client_id: str
    client_name: str
    total_revenue: float
    projects_count: int
    avg_project_value: float
    lifetime_value: float
    months_active: int
    health_score: float  # 0-100


class AnalyticsDashboard:
    """
    Real-Time Analytics Dashboard.
    
    Tracks revenue, client health, and forecasts.
    """

    def __init__(self, agency_name: str = "Nova Digital", demo_mode: bool = True):
        self.agency_name = agency_name
        self.revenue_entries: List[RevenueEntry] = []
        self.client_metrics: Dict[str, ClientMetrics] = {}

        logger.info(f"Analytics Dashboard initialized for {agency_name}")

        if demo_mode:
            self._generate_demo_data()

    def _generate_demo_data(self):
        """Generate realistic demo data for testing."""
        logger.info("Generating demo analytics data...")
        now = datetime.now()

        types_weights = [
            (RevenueType.SERVICE, 0.4),
            (RevenueType.RETAINER, 0.3),
            (RevenueType.AFFILIATE, 0.15),
            (RevenueType.TEMPLATE, 0.1),
            (RevenueType.REFERRAL, 0.05)
        ]

        for months_ago in range(12):
            date = now - timedelta(days=months_ago * 30)
            base_revenue = 5000 + (12 - months_ago) * 500

            for _ in range(random.randint(5, 15)):
                rev_type_data = random.choices(
                    types_weights,
                    weights=[w for _, w in types_weights]
                )[0]
                rev_type = rev_type_data[0]

                amount = random.uniform(100, base_revenue / 3)

                entry = RevenueEntry(
                    id=f"REV-{len(self.revenue_entries):04d}",
                    amount=amount,
                    type=rev_type,
                    client_id=f"CLI-{random.randint(1, 10):04d}" if rev_type in [RevenueType.SERVICE, RevenueType.RETAINER] else None,
                    description=f"{rev_type.value.title()} revenue",
                    date=date,
                    recurring=rev_type == RevenueType.RETAINER
                )
                self.revenue_entries.append(entry)

        # Demo Clients
        clients = [
            ("CLI-0001", "Acme Corp", 15000, 3),
            ("CLI-0002", "TechStart Inc", 8500, 2),
            ("CLI-0003", "GrowthLab", 22000, 5),
            ("CLI-0004", "LocalBiz", 4500, 1),
            ("CLI-0005", "ScaleUp Co", 12000, 2)
        ]

        for client_id, name, revenue, projects in clients:
            self.client_metrics[client_id] = ClientMetrics(
                client_id=client_id,
                client_name=name,
                total_revenue=float(revenue),
                projects_count=projects,
                avg_project_value=revenue / max(1, projects),
                lifetime_value=float(revenue * 2.5),
                months_active=random.randint(3, 24),
                health_score=random.uniform(70, 100)
            )
        logger.info(f"Generated {len(self.revenue_entries)} revenue entries and {len(self.client_metrics)} client records")

    # ═══════════════════════════════════════════════════════════
    # Revenue Analytics
    # ═══════════════════════════════════════════════════════════

    def get_revenue(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Calculate revenue for a specific period."""
        now = datetime.now()

        period_days = {
            MetricPeriod.TODAY: 1,
            MetricPeriod.WEEK: 7,
            MetricPeriod.MONTH: 30,
            MetricPeriod.QUARTER: 90,
            MetricPeriod.YEAR: 365,
            MetricPeriod.ALL_TIME: 9999
        }

        days = period_days.get(period, 30)
        cutoff = now - timedelta(days=days)
        prev_cutoff = cutoff - timedelta(days=days)

        # Current period
        current = [e for e in self.revenue_entries if e.date >= cutoff]
        current_total = sum(e.amount for e in current)

        # Previous period
        previous = [e for e in self.revenue_entries if prev_cutoff <= e.date < cutoff]
        previous_total = sum(e.amount for e in previous)

        # Growth
        growth = ((current_total - previous_total) / max(1, previous_total)) * 100

        # By type
        by_type: Dict[str, float] = {}
        for entry in current:
            t = entry.type.value
            by_type[t] = by_type.get(t, 0.0) + entry.amount

        return {
            "period": period.value,
            "total": current_total,
            "previous": previous_total,
            "growth_percent": growth,
            "by_type": by_type,
            "transaction_count": len(current)
        }

    def get_mrr(self) -> Dict[str, Any]:
        """Get Monthly Recurring Revenue (MRR) metrics."""
        now = datetime.now()
        month_ago = now - timedelta(days=30)

        recurring = [
            e for e in self.revenue_entries
            if e.recurring and e.date >= month_ago
        ]

        mrr = sum(e.amount for e in recurring)

        # Previous month
        two_months = now - timedelta(days=60)
        prev_recurring = [
            e for e in self.revenue_entries
            if e.recurring and two_months <= e.date < month_ago
        ]
        prev_mrr = sum(e.amount for e in prev_recurring)

        growth = ((mrr - prev_mrr) / max(1, prev_mrr)) * 100

        return {
            "mrr": mrr,
            "arr": mrr * 12,
            "previous_mrr": prev_mrr,
            "growth_percent": growth,
            "retainer_count": len(set(e.client_id for e in recurring if e.client_id))
        }

    def get_revenue_forecast(self, months: int = 6) -> List[Dict[str, Any]]:
        """Forecast revenue based on current MRR and growth."""
        mrr_data = self.get_mrr()
        current_mrr = mrr_data["mrr"]
        # Cap growth rate for realistic forecast
        growth_rate = max(0.0, min(0.2, mrr_data["growth_percent"] / 100))

        forecasts = []
        now = datetime.now()

        for i in range(1, months + 1):
            # Apply growth rate
            projected_mrr = current_mrr * ((1 + growth_rate) ** i)
            one_time_estimate = projected_mrr * 0.3 # Assume 30% of revenue is one-time

            forecasts.append({
                "month": (now + timedelta(days=30 * i)).strftime("%B %Y"),
                "projected_mrr": projected_mrr,
                "projected_one_time": one_time_estimate,
                "projected_total": projected_mrr + one_time_estimate,
                "confidence": max(50, 95 - (i * 5))
            })

        return forecasts

    # ═══════════════════════════════════════════════════════════
    # Client Analytics
    # ═══════════════════════════════════════════════════════════

    def get_client_overview(self) -> Dict[str, Any]:
        """Aggregate client metrics."""
        metrics = list(self.client_metrics.values())

        if not metrics:
            return {"total_clients": 0}

        total_revenue = sum(m.total_revenue for m in metrics)
        avg_ltv = total_revenue / len(metrics) # Simplified
        avg_health = sum(m.health_score for m in metrics) / len(metrics)

        # At-risk clients
        at_risk = [m for m in metrics if m.health_score < 70]

        return {
            "total_clients": len(metrics),
            "total_revenue": total_revenue,
            "avg_lifetime_value": avg_ltv,
            "avg_health_score": avg_health,
            "at_risk_count": len(at_risk),
            "top_clients": sorted(metrics, key=lambda m: m.total_revenue, reverse=True)[:5]
        }

    # ═══════════════════════════════════════════════════════════
    # Dashboard
    # ═══════════════════════════════════════════════════════════

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get summary data for dashboard."""
        revenue_month = self.get_revenue(MetricPeriod.MONTH)
        mrr_data = self.get_mrr()
        client_overview = self.get_client_overview()
        forecast = self.get_revenue_forecast(3)

        return {
            "agency": self.agency_name,
            "generated_at": datetime.now().isoformat(),
            "revenue": {
                "this_month": revenue_month["total"],
                "growth": revenue_month["growth_percent"],
                "mrr": mrr_data["mrr"],
                "arr": mrr_data["arr"]
            },
            "clients": {
                "total": client_overview.get("total_clients", 0),
                "at_risk": client_overview.get("at_risk_count", 0),
                "avg_ltv": client_overview.get("avg_lifetime_value", 0)
            },
            "forecast": {
                "next_month": forecast[0]["projected_total"] if forecast else 0,
                "quarter": sum(f["projected_total"] for f in forecast[:3])
            },
            "health_indicators": {
                "revenue_trend": "🟢 Growing" if revenue_month["growth_percent"] > 0 else "🔴 Declining",
                "client_health": "🟢 Healthy" if client_overview.get("avg_health_score", 0) >= 80 else "🟡 Needs Attention",
                "forecast_confidence": "🟢 High" if forecast and forecast[0]["confidence"] >= 80 else "🟡 Medium"
            }
        }

    def format_dashboard_text(self) -> str:
        """Render text-based dashboard."""
        data = self.get_dashboard_summary()

        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 {data['agency'].upper()[:40]:<40} - ANALYTICS  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  💰 REVENUE                                               ║
║  ─────────────────────────────────────                    ║
║  This Month:    ${data['revenue']['this_month']:>10,.2f}                   ║
║  Growth:        {data['revenue']['growth']:>10.1f}%                    ║
║  MRR:           ${data['revenue']['mrr']:>10,.2f}                   ║
║  ARR:           ${data['revenue']['arr']:>10,.2f}                   ║
║                                                           ║
║  👥 CLIENTS                                               ║
║  ─────────────────────────────────────                    ║
║  Total:         {data['clients']['total']:>10}                        ║
║  At Risk:       {data['clients']['at_risk']:>10}                        ║
║  Avg LTV:       ${data['clients']['avg_ltv']:>10,.2f}                   ║
║                                                           ║
║  🔮 FORECAST                                              ║
║  ─────────────────────────────────────                    ║
║  Next Month:    ${data['forecast']['next_month']:>10,.2f}                   ║
║  Next Quarter:  ${data['forecast']['quarter']:>10,.2f}                   ║
║                                                           ║
║  🏥 HEALTH                                                ║
║  ─────────────────────────────────────                    ║
║  Revenue:       {data['health_indicators']['revenue_trend']:<30}   ║
║  Clients:       {data['health_indicators']['client_health']:<30}   ║
║  Forecast:      {data['health_indicators']['forecast_confidence']:<30}   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"""


# Example usage
if __name__ == "__main__":
    dash = AnalyticsDashboard(agency_name="Nova Digital")

    print("📊 Analytics Dashboard Initialized!")
    print(f"   Revenue Entries: {len(dash.revenue_entries)}")

    # Get revenue
    revenue = dash.get_revenue(MetricPeriod.MONTH)

    print("\n💰 Monthly Revenue:")
    print(f"   Total: ${revenue['total']:,.2f}")
    print(f"   Growth: {revenue['growth_percent']:.1f}%")

    print(dash.format_dashboard_text())
