"""
💸 Expense Tracker - Manage Agency Costs
==========================================

Track expenses and calculate profit margins.
Know your numbers, grow your business!

Features:
- Expense logging
- Category breakdown
- Monthly reports
- Profit calculation
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ExpenseCategory(Enum):
    """Common expense categories."""
    TOOLS = "tools"
    MARKETING = "marketing"
    PAYROLL = "payroll"
    OFFICE = "office"
    TRAVEL = "travel"
    TRAINING = "training"
    OTHER = "other"


@dataclass
class Expense:
    """An individual expense record entity."""
    id: str
    description: str
    amount: float
    category: ExpenseCategory
    vendor: str
    date: datetime = field(default_factory=datetime.now)
    recurring: bool = False
    billable: bool = False
    client_name: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")


class ExpenseTracker:
    """
    Expense Tracker System.
    
    Manages agency operational costs, tracks vendor spending, and reports on monthly profitability.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.expenses: List[Expense] = []
        self.monthly_revenue: Dict[str, float] = {}
        logger.info(f"Expense Tracker initialized for {agency_name}")
    
    def add_expense(
        self,
        description: str,
        amount: float,
        category: ExpenseCategory,
        vendor: str,
        date: Optional[datetime] = None,
        recurring: bool = False,
        billable: bool = False,
        client_name: Optional[str] = None
    ) -> Expense:
        """Log a new expense entry."""
        if amount <= 0:
            logger.warning(f"Logging zero or negative expense: {amount}")

        expense = Expense(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            description=description,
            amount=float(amount),
            category=category,
            vendor=vendor,
            date=date or datetime.now(),
            recurring=recurring,
            billable=billable,
            client_name=client_name
        )
        
        self.expenses.append(expense)
        logger.info(f"Expense recorded: {description} (${amount:,.2f})")
        return expense
    
    def set_monthly_revenue(self, month_key: str, amount: float):
        """Register gross revenue for a specific month (e.g. '2026-01')."""
        self.monthly_revenue[month_key] = float(amount)
        logger.debug(f"Revenue set for {month_key}: ${amount:,.0f}")
    
    def calculate_profitability(self, month_key: str) -> Dict[str, Any]:
        """Compute net profit and margin for a given month."""
        revenue = self.monthly_revenue.get(month_key, 0.0)
        
        # Filter and sum expenses
        monthly_exp = sum(
            e.amount for e in self.expenses 
            if e.date.strftime("%Y-%m") == month_key
        )
        
        profit = revenue - monthly_exp
        margin = (profit / revenue * 100.0) if revenue > 0 else 0.0
        
        return {
            "revenue": revenue,
            "expenses": monthly_exp,
            "net_profit": profit,
            "margin_pct": margin
        }
    
    def format_dashboard(self, month_key: str) -> str:
        """Render the Expense & Profit Dashboard."""
        data = self.calculate_profitability(month_key)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💸 FINANCIAL REPORT: {month_key:<35}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PROFIT & LOSS SUMMARY                                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    Gross Revenue:  ${data['revenue']:>12,.0f}                      ║",
            f"║    Total Expenses: ${data['expenses']:>12,.0f}                      ║",
            "║    ─────────────────────────────                          ║",
        ]
        
        p_icon = "✅" if data['net_profit'] >= 0 else "🔴"
        lines.append(f"║    {p_icon} Net Profit:    ${data['net_profit']:>12,.0f} ({data['margin_pct']:.1f}% margin)  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📂 TOP EXPENSE CATEGORIES                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        # Aggregated Category View
        cat_map = {}
        for e in self.expenses:
            if e.date.strftime("%Y-%m") == month_key:
                cat_map[e.category.value] = cat_map.get(e.category.value, 0.0) + e.amount
        
        for cat, amt in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)[:4]:
            lines.append(f"║    • {cat.title():<15} │ ${amt:>10,.0f}                      ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Expense]  [📊 Full P&L]  [📑 Taxes]  [⚙️ Settings]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Profits!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💸 Initializing Expense Tracker...")
    print("=" * 60)
    
    try:
        tracker = ExpenseTracker("Saigon Digital Hub")
        now_key = datetime.now().strftime("%Y-%m")
        
        # Add data
        tracker.add_expense("Team Salaries", 8000.0, ExpenseCategory.PAYROLL, "Internal")
        tracker.add_expense("SaaS Suite", 300.0, ExpenseCategory.TOOLS, "Various")
        tracker.set_monthly_revenue(now_key, 12000.0)
        
        print("\n" + tracker.format_dashboard(now_key))
        
    except Exception as e:
        logger.error(f"Tracker Error: {e}")
