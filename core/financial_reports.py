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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class ReportPeriod(Enum):
    """Report periods."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class ProfitLoss:
    """Profit & Loss statement."""
    period: str
    revenue: float
    cogs: float
    gross_profit: float
    operating_expenses: float
    operating_income: float
    net_income: float


@dataclass
class FinancialRatio:
    """A financial ratio."""
    name: str
    value: float
    target: float
    unit: str = ""
    good_direction: str = "up"  # up or down


class FinancialReports:
    """
    Financial Reports.
    
    CFO-level insights.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pnl_history: List[ProfitLoss] = []
        self.ratios: Dict[str, FinancialRatio] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo financial data."""
        # Current month P&L
        self.add_pnl(
            period="Dec 2024",
            revenue=85000,
            cogs=25000,
            operating_expenses=35000
        )
        
        # Previous months
        self.pnl_history.append(ProfitLoss(
            period="Nov 2024", revenue=78000, cogs=23000,
            gross_profit=55000, operating_expenses=33000,
            operating_income=22000, net_income=22000
        ))
        self.pnl_history.append(ProfitLoss(
            period="Oct 2024", revenue=72000, cogs=21000,
            gross_profit=51000, operating_expenses=32000,
            operating_income=19000, net_income=19000
        ))
        
        # Key ratios
        self._calculate_ratios()
    
    def add_pnl(
        self,
        period: str,
        revenue: float,
        cogs: float,
        operating_expenses: float
    ) -> ProfitLoss:
        """Add a P&L statement."""
        gross_profit = revenue - cogs
        operating_income = gross_profit - operating_expenses
        net_income = operating_income  # Simplified
        
        pnl = ProfitLoss(
            period=period,
            revenue=revenue,
            cogs=cogs,
            gross_profit=gross_profit,
            operating_expenses=operating_expenses,
            operating_income=operating_income,
            net_income=net_income
        )
        self.pnl_history.insert(0, pnl)
        self._calculate_ratios()
        return pnl
    
    def _calculate_ratios(self):
        """Calculate financial ratios."""
        if not self.pnl_history:
            return
        
        latest = self.pnl_history[0]
        
        # Gross margin
        gross_margin = (latest.gross_profit / latest.revenue * 100) if latest.revenue else 0
        self.ratios["gross_margin"] = FinancialRatio(
            "Gross Margin", gross_margin, 70, "%"
        )
        
        # Operating margin
        op_margin = (latest.operating_income / latest.revenue * 100) if latest.revenue else 0
        self.ratios["operating_margin"] = FinancialRatio(
            "Operating Margin", op_margin, 30, "%"
        )
        
        # Net margin
        net_margin = (latest.net_income / latest.revenue * 100) if latest.revenue else 0
        self.ratios["net_margin"] = FinancialRatio(
            "Net Margin", net_margin, 25, "%"
        )
        
        # Revenue growth (if we have history)
        if len(self.pnl_history) > 1:
            prev = self.pnl_history[1]
            growth = ((latest.revenue - prev.revenue) / prev.revenue * 100) if prev.revenue else 0
            self.ratios["revenue_growth"] = FinancialRatio(
                "Revenue Growth", growth, 10, "%"
            )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get financial statistics."""
        if not self.pnl_history:
            return {}
        
        latest = self.pnl_history[0]
        
        return {
            "period": latest.period,
            "revenue": latest.revenue,
            "gross_profit": latest.gross_profit,
            "operating_income": latest.operating_income,
            "net_income": latest.net_income,
            "gross_margin": self.ratios.get("gross_margin", FinancialRatio("", 0, 0)).value,
            "net_margin": self.ratios.get("net_margin", FinancialRatio("", 0, 0)).value,
        }
    
    def format_dashboard(self) -> str:
        """Format financial reports dashboard."""
        stats = self.get_stats()
        
        if not stats:
            return "No financial data available."
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 FINANCIAL REPORTS - CFO DASHBOARD                     ║",
            f"║  {stats['period']} │ ${stats['revenue']:,.0f} revenue │ {stats['net_margin']:.0f}% margin  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 PROFIT & LOSS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Revenue:            ${stats['revenue']:>12,.0f}              ║",
            f"║    📉 COGS:               ${self.pnl_history[0].cogs:>12,.0f}              ║",
            f"║    ═══════════════════════════════════                  ║",
            f"║    💰 Gross Profit:       ${stats['gross_profit']:>12,.0f}              ║",
            f"║    💸 Operating Expenses: ${self.pnl_history[0].operating_expenses:>12,.0f}              ║",
            f"║    ═══════════════════════════════════                  ║",
            f"║    ✅ Net Income:         ${stats['net_income']:>12,.0f}              ║",
            "║                                                           ║",
            "║  📊 KEY RATIOS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for ratio in self.ratios.values():
            # Determine if on target
            on_target = ratio.value >= ratio.target
            icon = "🟢" if on_target else "🟡"
            bar_len = min(10, int(ratio.value / 10))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            
            lines.append(f"║    {icon} {ratio.name:<18} │ {bar} │ {ratio.value:>5.1f}{ratio.unit}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 REVENUE TREND                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for pnl in self.pnl_history[:3]:
            bar_len = int(pnl.revenue / 10000)
            bar = "█" * min(10, bar_len)
            lines.append(f"║    📊 {pnl.period:<10} │ {bar:<10} │ ${pnl.revenue:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 CFO INSIGHTS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Generate insights
        growth = self.ratios.get("revenue_growth")
        if growth and growth.value > 0:
            lines.append(f"║    📈 Revenue up {growth.value:.1f}% vs last month               ║")
        
        net_margin = stats.get('net_margin', 0)
        if net_margin > 25:
            lines.append(f"║    ✅ Healthy margins at {net_margin:.0f}%                        ║")
        elif net_margin < 15:
            lines.append(f"║    ⚠️ Low margins - review expenses                    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 P&L]  [📈 Trends]  [💰 Forecast]                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - See the big picture!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    fr = FinancialReports("Saigon Digital Hub")
    
    print("📊 Financial Reports")
    print("=" * 60)
    print()
    
    print(fr.format_dashboard())
