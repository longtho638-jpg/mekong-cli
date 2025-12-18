"""
💵 Cash Flow Tracker - Money Movement
=======================================

Track cash in and out.
Know your runway!

Features:
- Cash in/out tracking
- Runway calculation
- Cash forecast
- Payment schedules
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TransactionType(Enum):
    """Transaction types."""
    INCOME = "income"
    EXPENSE = "expense"


class IncomeCategory(Enum):
    """Income categories."""
    RETAINER = "retainer"
    PROJECT = "project"
    CONSULTING = "consulting"
    OTHER = "other"


class ExpenseCategory(Enum):
    """Expense categories."""
    PAYROLL = "payroll"
    RENT = "rent"
    SOFTWARE = "software"
    MARKETING = "marketing"
    UTILITIES = "utilities"
    OTHER = "other"


@dataclass
class Transaction:
    """A cash transaction."""
    id: str
    type: TransactionType
    category: str
    amount: float
    description: str
    date: datetime = field(default_factory=datetime.now)
    client: str = ""


@dataclass
class CashForecast:
    """A cash flow forecast."""
    month: str
    opening: float
    income: float
    expenses: float
    closing: float


class CashFlowTracker:
    """
    Cash Flow Tracker.
    
    Know where the money goes.
    """
    
    def __init__(self, agency_name: str, opening_balance: float = 50000):
        self.agency_name = agency_name
        self.opening_balance = opening_balance
        self.transactions: List[Transaction] = []
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo transactions."""
        # Income
        self.add_income(IncomeCategory.RETAINER, 15000, "Client A monthly retainer", "TechStart Inc")
        self.add_income(IncomeCategory.RETAINER, 8000, "Client B monthly retainer", "GrowthCo")
        self.add_income(IncomeCategory.PROJECT, 12000, "Website redesign project", "NewBrand")
        
        # Expenses
        self.add_expense(ExpenseCategory.PAYROLL, 20000, "Monthly payroll")
        self.add_expense(ExpenseCategory.RENT, 3000, "Office rent")
        self.add_expense(ExpenseCategory.SOFTWARE, 2000, "SaaS subscriptions")
    
    def add_income(
        self,
        category: IncomeCategory,
        amount: float,
        description: str,
        client: str = ""
    ) -> Transaction:
        """Add income transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.INCOME,
            category=category.value,
            amount=amount,
            description=description,
            client=client
        )
        self.transactions.append(tx)
        return tx
    
    def add_expense(
        self,
        category: ExpenseCategory,
        amount: float,
        description: str
    ) -> Transaction:
        """Add expense transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.EXPENSE,
            category=category.value,
            amount=amount,
            description=description
        )
        self.transactions.append(tx)
        return tx
    
    def get_current_balance(self) -> float:
        """Calculate current balance."""
        balance = self.opening_balance
        for tx in self.transactions:
            if tx.type == TransactionType.INCOME:
                balance += tx.amount
            else:
                balance -= tx.amount
        return balance
    
    def get_total_income(self) -> float:
        """Get total income."""
        return sum(tx.amount for tx in self.transactions if tx.type == TransactionType.INCOME)
    
    def get_total_expenses(self) -> float:
        """Get total expenses."""
        return sum(tx.amount for tx in self.transactions if tx.type == TransactionType.EXPENSE)
    
    def get_runway_months(self) -> float:
        """Calculate runway in months."""
        balance = self.get_current_balance()
        monthly_burn = self.get_total_expenses()  # Assume current month
        
        if monthly_burn <= 0:
            return 99  # Infinite runway
        
        return balance / monthly_burn
    
    def get_net_cash_flow(self) -> float:
        """Get net cash flow."""
        return self.get_total_income() - self.get_total_expenses()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cash flow statistics."""
        return {
            "opening": self.opening_balance,
            "current": self.get_current_balance(),
            "income": self.get_total_income(),
            "expenses": self.get_total_expenses(),
            "net_flow": self.get_net_cash_flow(),
            "runway": self.get_runway_months(),
            "transactions": len(self.transactions)
        }
    
    def format_dashboard(self) -> str:
        """Format cash flow dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 CASH FLOW TRACKER                                     ║",
            f"║  ${stats['current']:,.0f} balance │ {stats['runway']:.1f} months runway  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💰 CASH SUMMARY                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📈 Opening Balance:    ${stats['opening']:>12,.0f}              ║",
            f"║    💵 Total Income:       ${stats['income']:>12,.0f}              ║",
            f"║    💸 Total Expenses:     ${stats['expenses']:>12,.0f}              ║",
            f"║    📊 Net Cash Flow:      ${stats['net_flow']:>+12,.0f}              ║",
            f"║    💰 Current Balance:    ${stats['current']:>12,.0f}              ║",
            "║                                                           ║",
            "║  📈 INCOME BREAKDOWN                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # Group income by category
        income_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.INCOME:
                cat = tx.category
                income_by_cat[cat] = income_by_cat.get(cat, 0) + tx.amount
        
        cat_icons = {"retainer": "🔄", "project": "📋", "consulting": "💼", "other": "📝"}
        
        for cat, amount in sorted(income_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = cat_icons.get(cat, "💵")
            pct = (amount / stats['income'] * 100) if stats['income'] else 0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💸 EXPENSE BREAKDOWN                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Group expenses by category
        expense_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.EXPENSE:
                cat = tx.category
                expense_by_cat[cat] = expense_by_cat.get(cat, 0) + tx.amount
        
        exp_icons = {"payroll": "👥", "rent": "🏢", "software": "💻",
                    "marketing": "📢", "utilities": "⚡", "other": "📝"}
        
        for cat, amount in sorted(expense_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = exp_icons.get(cat, "💸")
            pct = (amount / stats['expenses'] * 100) if stats['expenses'] else 0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")
        
        # Runway indicator
        runway = stats['runway']
        if runway >= 6:
            runway_icon = "🟢"
            runway_status = "Healthy"
        elif runway >= 3:
            runway_icon = "🟡"
            runway_status = "Caution"
        else:
            runway_icon = "🔴"
            runway_status = "Critical"
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 RUNWAY STATUS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    {runway_icon} {runway:.1f} months │ {runway_status}                         ║",
            "║                                                           ║",
            "║  [💵 Transactions]  [📊 Forecast]  [📈 Reports]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your runway!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cf = CashFlowTracker("Saigon Digital Hub", 50000)
    
    print("💵 Cash Flow Tracker")
    print("=" * 60)
    print()
    
    print(cf.format_dashboard())
