"""
📊 Financial Reports - CFO Dashboard
======================================

Generate financial statements and insights.
See the big picture!

Features:
- P&L statements
- Key ratios
- Monthly trends
- CFO insights
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReportPeriod(Enum):
    """Reporting timeframes."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class ProfitLoss:
    """Profit & Loss statement entity."""
    period: str
    revenue: float
    cogs: float
    gross_profit: float
    operating_expenses: float
    operating_income: float
    net_income: float

    def __post_init__(self):
        if self.revenue < 0:
            raise ValueError("Revenue cannot be negative")


@dataclass
class FinancialRatio:
    """A financial performance ratio record."""
    name: str
    value: float
    target: float
    unit: str = ""
    good_direction: str = "up"  # up or down


class FinancialReports:
    """
    Financial Reports System.
    
    Orchestrates financial data aggregation, ratio calculation, and CFO-level reporting.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pnl_history: List[ProfitLoss] = []
        self.ratios: Dict[str, FinancialRatio] = {}
        
        logger.info(f"Financial Reports system initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Seed the system with sample historical financial records."""
        logger.info("Loading demo financial history...")
        try:
            # Add latest
            self.add_pnl("Dec 2025", 85000.0, 25000.0, 35000.0)
            # Add previous manually
            self.pnl_history.append(ProfitLoss(
                "Nov 2025", 78000.0, 23000.0, 55000.0, 33000.0, 22000.0, 22000.0
            ))
        except Exception as e:
            logger.error(f"Demo data error: {e}")
    
    def add_pnl(
        self,
        period: str,
        revenue: float,
        cogs: float,
        op_expenses: float
    ) -> ProfitLoss:
        """Register a new Profit & Loss statement for a specific period."""
        if revenue < 0 or cogs < 0 or op_expenses < 0:
            raise ValueError("Financial figures must be non-negative")

        gross = revenue - cogs
        income = gross - op_expenses
        
        pnl = ProfitLoss(
            period=period, revenue=revenue, cogs=cogs,
            gross_profit=gross, operating_expenses=op_expenses,
            operating_income=income, net_income=income
        )
        self.pnl_history.insert(0, pnl)
        self.recalculate_all_ratios()
        logger.info(f"P&L added for {period}: Net ${income:,.0f}")
        return pnl
    
    def recalculate_all_ratios(self):
        """Update financial KPIs based on the latest history."""
        if not self.pnl_history: return
        
        latest = self.pnl_history[0]
        rev = max(1.0, latest.revenue)
        
        self.ratios["gross_margin"] = FinancialRatio("Gross Margin", (latest.gross_profit / rev) * 100, 70, "%")
        self.ratios["net_margin"] = FinancialRatio("Net Margin", (latest.net_income / rev) * 100, 25, "%")
        
        if len(self.pnl_history) > 1:
            prev_rev = max(1.0, self.pnl_history[1].revenue)
            growth = ((latest.revenue - prev_rev) / prev_rev) * 100
            self.ratios["growth"] = FinancialRatio("Revenue Growth", growth, 10, "%")
            
        logger.debug("Financial ratios updated.")
    
    def format_dashboard(self) -> str:
        """Render the CFO Financial Dashboard."""
        if not self.pnl_history: return "No financial history data."
        
        latest = self.pnl_history[0]
        overall_score = self.ratios.get("net_margin", FinancialRatio("", 0, 0)).value
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 FINANCIAL REPORTS - CFO DASHBOARD{' ' * 21}║",
            f"║  {latest.period} │ ${latest.revenue:,.0f} revenue │ {overall_score:.0f}% net margin{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 PROFIT & LOSS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    Gross Revenue:  ${latest.revenue:>12,.0f}                      ║",
            f"║    COGS:           ${latest.cogs:>12,.0f}                      ║",
            f"║    Gross Profit:   ${latest.gross_profit:>12,.0f}                      ║",
            f"║    Op Expenses:    ${latest.operating_expenses:>12,.0f}                      ║",
            f"║    ✅ Net Income:  ${latest.net_income:>12,.0f}                      ║",
            "║                                                           ║",
            "║  📊 PERFORMANCE RATIOS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for r in self.ratios.values():
            status = "🟢" if r.value >= r.target else "🟡"
            bar_len = min(10, int(r.value / 10))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            lines.append(f"║    {status} {r.name:<18} │ {bar} │ {r.value:>5.1f}{r.unit}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 P&L]  [📈 Trends]  [💰 Forecast]  [⚙️ Settings]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Big Picture!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Financial Reports...")
    print("=" * 60)
    
    try:
        cfo_system = FinancialReports("Saigon Digital Hub")
        print("\n" + cfo_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Financial Error: {e}")
