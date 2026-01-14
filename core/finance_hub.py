"""
💵 Finance Hub - Financial Operations
========================================

Central hub connecting all Finance roles with their operational tools.

Integrates:
- Budget Manager
- Cash Flow Tracker
- Financial Reports
- Invoicing
- Revenue Forecasting
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.budget_manager import BudgetManager, BudgetStatus
    from core.cash_flow import CashFlowTracker
    from core.financial_reports import FinancialReports
except ImportError:
    from budget_manager import BudgetManager, BudgetStatus
    from cash_flow import CashFlowTracker
    from financial_reports import FinancialReports

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class FinanceMetrics:
    """Department-wide financial metrics container."""
    total_revenue: float = 0.0
    total_expenses: float = 0.0
    net_income: float = 0.0
    cash_balance: float = 0.0
    runway_months: float = 0.0
    budget_utilization: float = 0.0
    gross_margin: float = 0.0
    budgets_on_track: int = 0


class FinanceHub:
    """
    Finance Hub System.
    
    Orchestrates budgeting, cash flow tracking, and financial reporting.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Finance Hub for {agency_name}")
        try:
            self.budgets = BudgetManager(agency_name)
            self.cash_flow = CashFlowTracker(agency_name, 50000.0)
            self.reports = FinancialReports(agency_name)
        except Exception as e:
            logger.error(f"Finance Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> FinanceMetrics:
        """Aggregate data from all financial sub-modules."""
        metrics = FinanceMetrics()
        
        try:
            # 1. Budget Metrics
            b_stats = self.budgets.get_stats()
            metrics.total_expenses = float(b_stats.get("total_spent", 0.0))
            metrics.budget_utilization = float(b_stats.get("utilization", 0.0))
            metrics.budgets_on_track = b_stats.get("on_track_count", 0) # Assumed key name update
            
            # 2. Cash Flow Metrics
            c_stats = self.cash_flow.get_stats()
            metrics.cash_balance = float(c_stats.get("current", 0.0))
            metrics.runway_months = float(c_stats.get("runway", 0.0))
            
            # 3. Report Metrics
            r_stats = self.reports.get_stats()
            metrics.total_revenue = float(r_stats.get("revenue", 0.0))
            metrics.net_income = float(r_stats.get("net_income", 0.0))
            metrics.gross_margin = float(r_stats.get("gross_margin", 0.0))
            
        except Exception as e:
            logger.warning(f"Error aggregating Finance metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Finance Hub Dashboard."""
        m = self.get_department_metrics()
        
        r_icon = "🟢" if m.runway_months >= 6 else "🟡" if m.runway_months >= 3 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 FINANCE HUB{' ' * 42}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CONSOLIDATED FINANCIAL METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    💰 Total Revenue:      ${m.total_revenue:>12,.0f}              ║",
            f"║    💸 Total Expenses:     ${m.total_expenses:>12,.0f}              ║",
            f"║    ✅ Net Income:         ${m.net_income:>12,.0f}              ║",
            f"║    💵 Cash Balance:       ${m.cash_balance:>12,.0f}              ║",
            f"║    {r_icon} Runway:            {m.runway_months:>12.1f} months       ║",
            f"║    📊 Budget Util:        {m.budget_utilization:>12.0f}%              ║",
            f"║    📈 Gross Margin:       {m.gross_margin:>12.1f}%              ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    💰 Budgets │ 💵 Cash Flow │ 📊 P&L Reports │ 📋 Invoicing║",
            "║                                                           ║",
            "║  [📊 Reports]  [💰 Budgets]  [💵 Cash]  [📋 Invoices]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Stability!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💵 Initializing Finance Hub...")
    print("=" * 60)
    
    try:
        hub = FinanceHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")
