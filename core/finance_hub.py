"""
💵 Finance Hub - Financial Operations
========================================

Central hub connecting all Finance roles.

Integrates:
- Budget Manager (budget_manager.py)
- Cash Flow Tracker (cash_flow.py)
- Financial Reports (financial_reports.py)
- Invoice (invoice.py) - existing
- Revenue Forecasting (revenue_forecasting.py) - existing
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.budget_manager import BudgetManager, BudgetStatus
from core.cash_flow import CashFlowTracker
from core.financial_reports import FinancialReports


@dataclass
class FinanceMetrics:
    """Department-wide metrics."""
    total_revenue: float
    total_expenses: float
    net_income: float
    cash_balance: float
    runway_months: float
    budget_utilization: float
    gross_margin: float
    budgets_on_track: int


class FinanceHub:
    """
    Finance Hub.
    
    Financial operations center.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.budgets = BudgetManager(agency_name)
        self.cash_flow = CashFlowTracker(agency_name, 50000)
        self.reports = FinancialReports(agency_name)
    
    def get_department_metrics(self) -> FinanceMetrics:
        """Get department-wide metrics."""
        budget_stats = self.budgets.get_stats()
        cash_stats = self.cash_flow.get_stats()
        report_stats = self.reports.get_stats()
        
        on_track = sum(1 for b in self.budgets.budgets.values() 
                      if b.status == BudgetStatus.ON_TRACK)
        
        return FinanceMetrics(
            total_revenue=report_stats.get("revenue", 0),
            total_expenses=budget_stats.get("total_spent", 0),
            net_income=report_stats.get("net_income", 0),
            cash_balance=cash_stats.get("current", 0),
            runway_months=cash_stats.get("runway", 0),
            budget_utilization=budget_stats.get("utilization", 0),
            gross_margin=report_stats.get("gross_margin", 0),
            budgets_on_track=on_track
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        runway_icon = "🟢" if metrics.runway_months >= 6 else "🟡" if metrics.runway_months >= 3 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 FINANCE HUB                                           ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Revenue:      ${metrics.total_revenue:>12,.0f}              ║",
            f"║    💸 Total Expenses:     ${metrics.total_expenses:>12,.0f}              ║",
            f"║    ✅ Net Income:         ${metrics.net_income:>12,.0f}              ║",
            f"║    💵 Cash Balance:       ${metrics.cash_balance:>12,.0f}              ║",
            f"║    {runway_icon} Runway:            {metrics.runway_months:>12.1f} months       ║",
            f"║    📊 Budget Util:        {metrics.budget_utilization:>12.0f}%              ║",
            f"║    📈 Gross Margin:       {metrics.gross_margin:>12.1f}%              ║",
            "║                                                           ║",
            "║  🔗 FINANCE ROLES                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    💰 Budget Manager    → Dept budgets, expenses         ║",
            "║    💵 Cash Flow Tracker → In/out, runway, forecast       ║",
            "║    📊 Financial Reports → P&L, ratios, insights          ║",
            "║    📋 Invoicing         → Client billing                 ║",
            "║    📈 Revenue Forecast  → Projections, trends            ║",
            "║                                                           ║",
            "║  📋 FINANCE TEAM                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Budgets          │ {metrics.budgets_on_track} on track, {metrics.budget_utilization:.0f}% util   ║",
            f"║    💵 Cash Flow        │ ${metrics.cash_balance:,.0f}, {metrics.runway_months:.1f}mo    ║",
            f"║    📊 Reports          │ ${metrics.total_revenue:,.0f} revenue       ║",
            "║                                                           ║",
            "║  [📊 Reports]  [💰 Budgets]  [💵 Cash]  [📋 Invoices]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Money matters!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = FinanceHub("Saigon Digital Hub")
    
    print("💵 Finance Hub")
    print("=" * 60)
    print()
    
    print(hub.format_hub_dashboard())
