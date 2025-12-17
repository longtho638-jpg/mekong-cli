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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ExpenseCategory(Enum):
    """Expense categories."""
    TOOLS = "tools"
    MARKETING = "marketing"
    PAYROLL = "payroll"
    OFFICE = "office"
    TRAVEL = "travel"
    TRAINING = "training"
    OTHER = "other"


@dataclass
class Expense:
    """An expense entry."""
    id: str
    description: str
    amount: float
    category: ExpenseCategory
    vendor: str
    date: datetime
    recurring: bool = False
    billable: bool = False
    client_name: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


class ExpenseTracker:
    """
    Expense Tracker.
    
    Track agency expenses and calculate profits.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.expenses: List[Expense] = []
        self.monthly_revenue: Dict[str, float] = {}
    
    def add_expense(
        self,
        description: str,
        amount: float,
        category: ExpenseCategory,
        vendor: str,
        date: datetime = None,
        recurring: bool = False,
        billable: bool = False,
        client_name: str = None
    ) -> Expense:
        """Add an expense."""
        expense = Expense(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            description=description,
            amount=amount,
            category=category,
            vendor=vendor,
            date=date or datetime.now(),
            recurring=recurring,
            billable=billable,
            client_name=client_name
        )
        
        self.expenses.append(expense)
        return expense
    
    def set_revenue(self, month: str, amount: float):
        """Set monthly revenue (e.g., '2025-12')."""
        self.monthly_revenue[month] = amount
    
    def get_monthly_expenses(self, month: str) -> float:
        """Get total expenses for a month."""
        total = 0
        for exp in self.expenses:
            exp_month = exp.date.strftime("%Y-%m")
            if exp_month == month:
                total += exp.amount
        return total
    
    def get_category_breakdown(self, month: str = None) -> Dict[ExpenseCategory, float]:
        """Get expenses by category."""
        breakdown = {cat: 0 for cat in ExpenseCategory}
        
        for exp in self.expenses:
            if month:
                if exp.date.strftime("%Y-%m") != month:
                    continue
            breakdown[exp.category] += exp.amount
        
        return {k: v for k, v in breakdown.items() if v > 0}
    
    def calculate_profit(self, month: str) -> Dict[str, float]:
        """Calculate profit for a month."""
        revenue = self.monthly_revenue.get(month, 0)
        expenses = self.get_monthly_expenses(month)
        profit = revenue - expenses
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        return {
            "revenue": revenue,
            "expenses": expenses,
            "profit": profit,
            "margin": margin
        }
    
    def format_monthly_report(self, month: str) -> str:
        """Format monthly expense report."""
        breakdown = self.get_category_breakdown(month)
        profit_data = self.calculate_profit(month)
        
        total_expenses = profit_data["expenses"]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💸 EXPENSE REPORT: {month:<35}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 EXPENSES BY CATEGORY                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        cat_icons = {
            ExpenseCategory.TOOLS: "🛠️",
            ExpenseCategory.MARKETING: "📢",
            ExpenseCategory.PAYROLL: "👥",
            ExpenseCategory.OFFICE: "🏢",
            ExpenseCategory.TRAVEL: "✈️",
            ExpenseCategory.TRAINING: "🎓",
            ExpenseCategory.OTHER: "📋"
        }
        
        for cat, amount in sorted(breakdown.items(), key=lambda x: x[1], reverse=True):
            icon = cat_icons[cat]
            pct = (amount / total_expenses * 100) if total_expenses > 0 else 0
            bar_filled = int(20 * pct / 100)
            bar = "█" * bar_filled + "░" * (20 - bar_filled)
            
            lines.append(f"║  {icon} {cat.value.capitalize():<10} [{bar}] ${amount:>8,.0f} ({pct:>4.0f}%)  ║")
        
        lines.append("║                                                           ║")
        lines.append(f"║  💰 TOTAL EXPENSES: ${total_expenses:>12,.0f}                    ║")
        
        # Profit section
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 PROFIT & LOSS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Revenue:    ${profit_data['revenue']:>12,.0f}                         ║",
            f"║    Expenses:   ${profit_data['expenses']:>12,.0f}                         ║",
            "║    ─────────────────────────────                        ║",
        ])
        
        profit = profit_data['profit']
        margin = profit_data['margin']
        
        if profit >= 0:
            lines.append(f"║    ✅ Profit:   ${profit:>12,.0f} ({margin:.1f}% margin)         ║")
        else:
            lines.append(f"║    🔴 Loss:     ${profit:>12,.0f} ({margin:.1f}% margin)         ║")
        
        # Health indicator
        if margin >= 30:
            health = "🔥 EXCELLENT"
        elif margin >= 20:
            health = "✅ HEALTHY"
        elif margin >= 10:
            health = "🟡 NEEDS ATTENTION"
        else:
            health = "🔴 CRITICAL"
        
        lines.extend([
            "║                                                           ║",
            f"║    Health: {health:<42}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_recent_expenses(self, limit: int = 5) -> str:
        """Format recent expenses."""
        recent = sorted(self.expenses, key=lambda x: x.date, reverse=True)[:limit]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💸 RECENT EXPENSES                                       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Date  │ Description      │ Category  │ Amount  │ Vendor ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for exp in recent:
            date = exp.date.strftime("%m/%d")
            desc = exp.description[:16]
            cat = exp.category.value[:9]
            amount = f"${exp.amount:,.0f}"
            vendor = exp.vendor[:6]
            
            lines.append(f"║  {date}  │ {desc:<16} │ {cat:<9} │ {amount:>7} │ {vendor:<6} ║")
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = ExpenseTracker("Saigon Digital Hub")
    
    print("💸 Expense Tracker")
    print("=" * 60)
    print()
    
    today = datetime.now()
    month = today.strftime("%Y-%m")
    
    # Add sample expenses
    tracker.add_expense("Figma Pro", 15, ExpenseCategory.TOOLS, "Figma", today)
    tracker.add_expense("Google Ads", 500, ExpenseCategory.MARKETING, "Google", today)
    tracker.add_expense("Team Salary", 8000, ExpenseCategory.PAYROLL, "Internal", today)
    tracker.add_expense("Coworking Space", 300, ExpenseCategory.OFFICE, "WeWork", today)
    tracker.add_expense("SEMrush", 120, ExpenseCategory.TOOLS, "SEMrush", today)
    tracker.add_expense("Online Course", 50, ExpenseCategory.TRAINING, "Udemy", today)
    
    # Set revenue
    tracker.set_revenue(month, 15000)
    
    print(tracker.format_monthly_report(month))
    print()
    print(tracker.format_recent_expenses())
