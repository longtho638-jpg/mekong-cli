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

import os
import json
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import random


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
    change_percent: float = 0
    
    
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
    
    Track everything that matters:
    - Revenue (MRR, ARR, growth rates)
    - Client health and LTV
    - Project profitability
    - Affiliate performance
    - Financial forecasts
    """
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        
        # Data stores
        self.revenue_entries: List[RevenueEntry] = []
        self.client_metrics: Dict[str, ClientMetrics] = {}
        
        # Generate demo data
        self._generate_demo_data()
    
    def _generate_demo_data(self):
        """Generate realistic demo data."""
        # Revenue entries for last 12 months
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
            
            # Growing revenue over time
            base_revenue = 5000 + (12 - months_ago) * 500
            
            for _ in range(random.randint(5, 15)):
                rev_type = random.choices(
                    [t for t, _ in types_weights],
                    weights=[w for _, w in types_weights]
                )[0]
                
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
        
        # Client metrics
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
                total_revenue=revenue,
                projects_count=projects,
                avg_project_value=revenue / max(1, projects),
                lifetime_value=revenue * 2.5,  # Projected
                months_active=random.randint(3, 24),
                health_score=random.uniform(70, 100)
            )
    
    # ═══════════════════════════════════════════════════════════
    # Revenue Analytics
    # ═══════════════════════════════════════════════════════════
    
    def get_revenue(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Get revenue for a period."""
        now = datetime.now()
        
        period_days = {
            MetricPeriod.TODAY: 1,
            MetricPeriod.WEEK: 7,
            MetricPeriod.MONTH: 30,
            MetricPeriod.QUARTER: 90,
            MetricPeriod.YEAR: 365,
            MetricPeriod.ALL_TIME: 9999
        }
        
        days = period_days[period]
        cutoff = now - timedelta(days=days)
        prev_cutoff = cutoff - timedelta(days=days)
        
        # Current period
        current = [e for e in self.revenue_entries if e.date >= cutoff]
        current_total = sum(e.amount for e in current)
        
        # Previous period for comparison
        previous = [e for e in self.revenue_entries if prev_cutoff <= e.date < cutoff]
        previous_total = sum(e.amount for e in previous)
        
        # Growth
        growth = ((current_total - previous_total) / max(1, previous_total)) * 100
        
        # By type
        by_type = {}
        for entry in current:
            t = entry.type.value
            by_type[t] = by_type.get(t, 0) + entry.amount
        
        return {
            "period": period.value,
            "total": current_total,
            "previous": previous_total,
            "growth_percent": growth,
            "by_type": by_type,
            "transaction_count": len(current)
        }
    
    def get_mrr(self) -> Dict[str, Any]:
        """Get Monthly Recurring Revenue."""
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
        """Forecast revenue for upcoming months."""
        mrr_data = self.get_mrr()
        current_mrr = mrr_data["mrr"]
        growth_rate = max(0, mrr_data["growth_percent"]) / 100
        
        forecasts = []
        now = datetime.now()
        
        for i in range(1, months + 1):
            # Apply growth rate
            projected_mrr = current_mrr * ((1 + growth_rate) ** i)
            
            # Add some one-time revenue estimate
            one_time_estimate = projected_mrr * 0.3
            
            forecasts.append({
                "month": (now + timedelta(days=30 * i)).strftime("%B %Y"),
                "projected_mrr": projected_mrr,
                "projected_one_time": one_time_estimate,
                "projected_total": projected_mrr + one_time_estimate,
                "confidence": max(50, 95 - (i * 5))  # Decreasing confidence
            })
        
        return forecasts
    
    # ═══════════════════════════════════════════════════════════
    # Client Analytics
    # ═══════════════════════════════════════════════════════════
    
    def get_client_overview(self) -> Dict[str, Any]:
        """Get client overview metrics."""
        metrics = list(self.client_metrics.values())
        
        if not metrics:
            return {"total_clients": 0}
        
        total_revenue = sum(m.total_revenue for m in metrics)
        avg_ltv = sum(m.lifetime_value for m in metrics) / len(metrics)
        avg_health = sum(m.health_score for m in metrics) / len(metrics)
        
        # Segment by revenue
        high_value = [m for m in metrics if m.total_revenue >= 10000]
        medium_value = [m for m in metrics if 5000 <= m.total_revenue < 10000]
        low_value = [m for m in metrics if m.total_revenue < 5000]
        
        # At-risk clients (low health score)
        at_risk = [m for m in metrics if m.health_score < 70]
        
        return {
            "total_clients": len(metrics),
            "total_revenue": total_revenue,
            "avg_lifetime_value": avg_ltv,
            "avg_health_score": avg_health,
            "segments": {
                "high_value": len(high_value),
                "medium_value": len(medium_value),
                "low_value": len(low_value)
            },
            "at_risk_count": len(at_risk),
            "top_clients": sorted(metrics, key=lambda m: m.total_revenue, reverse=True)[:5]
        }
    
    def get_client_health(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed health metrics for a client."""
        if client_id not in self.client_metrics:
            return None
        
        m = self.client_metrics[client_id]
        
        # Health factors
        factors = {
            "revenue_trend": min(100, m.total_revenue / 100),  # $100 = 1 point
            "engagement": random.uniform(60, 100),  # Would track actual engagement
            "payment_history": random.uniform(80, 100),
            "project_satisfaction": random.uniform(70, 100)
        }
        
        return {
            "client_id": client_id,
            "client_name": m.client_name,
            "overall_score": m.health_score,
            "factors": factors,
            "recommendation": "Maintain relationship" if m.health_score >= 80 else "Schedule check-in call"
        }
    
    # ═══════════════════════════════════════════════════════════
    # Summary Dashboard
    # ═══════════════════════════════════════════════════════════
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get complete dashboard summary."""
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
                "total": client_overview["total_clients"],
                "at_risk": client_overview["at_risk_count"],
                "avg_ltv": client_overview["avg_lifetime_value"]
            },
            "forecast": {
                "next_month": forecast[0]["projected_total"] if forecast else 0,
                "quarter": sum(f["projected_total"] for f in forecast[:3])
            },
            "health_indicators": {
                "revenue_trend": "🟢 Growing" if revenue_month["growth_percent"] > 0 else "🔴 Declining",
                "client_health": "🟢 Healthy" if client_overview["avg_health_score"] >= 80 else "🟡 Needs Attention",
                "forecast_confidence": "🟢 High" if forecast and forecast[0]["confidence"] >= 80 else "🟡 Medium"
            }
        }
    
    def format_dashboard_text(self) -> str:
        """Format dashboard as text."""
        data = self.get_dashboard_summary()
        
        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 {data['agency'].upper()} - ANALYTICS DASHBOARD         ║
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
    # Initialize dashboard
    dash = AnalyticsDashboard(agency_name="Nova Digital")
    
    print("📊 Analytics Dashboard Initialized!")
    print(f"   Agency: {dash.agency_name}")
    print(f"   Revenue Entries: {len(dash.revenue_entries)}")
    print(f"   Clients Tracked: {len(dash.client_metrics)}")
    print()
    
    # Get revenue
    revenue = dash.get_revenue(MetricPeriod.MONTH)
    print("💰 Monthly Revenue:")
    print(f"   Total: ${revenue['total']:,.2f}")
    print(f"   Growth: {revenue['growth_percent']:.1f}%")
    print(f"   Transactions: {revenue['transaction_count']}")
    print()
    
    # MRR
    mrr = dash.get_mrr()
    print("📈 Recurring Revenue:")
    print(f"   MRR: ${mrr['mrr']:,.2f}")
    print(f"   ARR: ${mrr['arr']:,.2f}")
    print(f"   Growth: {mrr['growth_percent']:.1f}%")
    print()
    
    # Client overview
    clients = dash.get_client_overview()
    print("👥 Client Overview:")
    print(f"   Total: {clients['total_clients']}")
    print(f"   Avg LTV: ${clients['avg_lifetime_value']:,.2f}")
    print(f"   At Risk: {clients['at_risk_count']}")
    print()
    
    # Forecast
    forecast = dash.get_revenue_forecast(3)
    print("🔮 3-Month Forecast:")
    for f in forecast:
        print(f"   {f['month']}: ${f['projected_total']:,.2f} ({f['confidence']}% confidence)")
    print()
    
    # Full dashboard
    print(dash.format_dashboard_text())
