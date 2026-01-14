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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """A cash transaction record entity."""
    id: str
    type: TransactionType
    category: str
    amount: float
    description: str
    date: datetime = field(default_factory=datetime.now)
    client: str = ""

    def __post_init__(self):
        if self.amount <= 0:
            raise ValueError("Transaction amount must be positive")


@dataclass
class CashForecast:
    """A cash flow forecast for a specific period."""
    month: str
    opening: float
    income: float
    expenses: float
    closing: float


class CashFlowTracker:
    """
    Cash Flow Tracker System.
    
    Monitors all cash movements and calculates business runway.
    """
    
    def __init__(self, agency_name: str, opening_balance: float = 50000.0):
        self.agency_name = agency_name
        self.opening_balance = opening_balance
        self.transactions: List[Transaction] = []
        logger.info(f"Cash Flow Tracker initialized for {agency_name} (Opening: ${opening_balance:,.0f})")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Setup sample financial data."""
        try:
            self.add_income(IncomeCategory.RETAINER, 15000.0, "Client A retainer", "TechStart Inc")
            self.add_income(IncomeCategory.RETAINER, 8000.0, "Client B retainer", "GrowthCo")
            self.add_income(IncomeCategory.PROJECT, 12000.0, "Website project", "NewBrand")
            
            self.add_expense(ExpenseCategory.PAYROLL, 20000.0, "Monthly payroll")
            self.add_expense(ExpenseCategory.RENT, 3000.0, "Office rent")
            self.add_expense(ExpenseCategory.SOFTWARE, 2000.0, "SaaS subscriptions")
        except ValueError as e:
            logger.error(f"Failed to initialize demo data: {e}")
    
    def add_income(
        self,
        category: IncomeCategory,
        amount: float,
        description: str,
        client: str = ""
    ) -> Transaction:
        """Record an incoming transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.INCOME,
            category=category.value,
            amount=amount,
            description=description,
            client=client
        )
        self.transactions.append(tx)
        logger.info(f"Income added: ${amount:,.2f} from {client or 'N/A'}")
        return tx
    
    def add_expense(
        self,
        category: ExpenseCategory,
        amount: float,
        description: str
    ) -> Transaction:
        """Record an outgoing transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.EXPENSE,
            category=category.value,
            amount=amount,
            description=description
        )
        self.transactions.append(tx)
        logger.info(f"Expense added: ${amount:,.2f} for {category.value}")
        return tx
    
    def get_current_balance(self) -> float:
        """Calculate the actual balance based on all transactions."""
        balance = self.opening_balance
        for tx in self.transactions:
            if tx.type == TransactionType.INCOME:
                balance += tx.amount
            else:
                balance -= tx.amount
        return balance
    
    def get_runway_months(self) -> float:
        """Estimate how many months the business can survive with current balance and burn rate."""
        balance = self.get_current_balance()
        # Calculate monthly burn rate (sum of expenses in last 30 days)
        cutoff = datetime.now() - timedelta(days=30)
        recent_expenses = [t.amount for t in self.transactions if t.type == TransactionType.EXPENSE and t.date >= cutoff]
        monthly_burn = sum(recent_expenses)
        
        if monthly_burn <= 0:
            return 99.0 # Infinite runway if no expenses
        
        return balance / monthly_burn
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate financial stats."""
        income = sum(t.amount for t in self.transactions if t.type == TransactionType.INCOME)
        expenses = sum(t.amount for t in self.transactions if t.type == TransactionType.EXPENSE)
        
        return {
            "opening": self.opening_balance,
            "current": self.get_current_balance(),
            "income": income,
            "expenses": expenses,
            "net_flow": income - expenses,
            "runway": self.get_runway_months(),
            "transactions_count": len(self.transactions)
        }
    
    def format_dashboard(self) -> str:
        """Render Cash Flow Dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 CASH FLOW TRACKER{' ' * 41}║",
            f"║  ${stats['current']:,.0f} balance │ {stats['runway']:>4.1f} months runway{' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💰 CASH SUMMARY                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📈 Opening Balance:    ${stats['opening']:>12,.0f}              ║",
            f"║    💵 Total Income:       ${stats['income']:>12,.0f}              ║",
            f"║    💸 Total Expenses:     ${stats['expenses']:>12,.0f}              ║",
            f"║    📊 Net Cash Flow:      ${stats['net_flow']:>+12,.0f}              ║",
            f"║    💰 Current Balance:    ${stats['current']:>12,.0f}              ║",
            "║                                                           ║",
            "║  📈 INCOME BREAKDOWN                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Group income by category
        income_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.INCOME:
                income_by_cat[tx.category] = income_by_cat.get(tx.category, 0.0) + tx.amount
        
        cat_icons = {"retainer": "🔄", "project": "📋", "consulting": "💼", "other": "📝"}
        
        for cat, amount in sorted(income_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = cat_icons.get(cat, "💵")
            pct = (amount / stats['income'] * 100) if stats['income'] else 0.0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💸 EXPENSE BREAKDOWN                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        # Group expenses by category
        expense_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.EXPENSE:
                expense_by_cat[tx.category] = expense_by_cat.get(tx.category, 0.0) + tx.amount
        
        exp_icons = {"payroll": "👥", "rent": "🏢", "software": "💻", "marketing": "📢", "utilities": "⚡", "other": "📝"}
        
        for cat, amount in sorted(expense_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = exp_icons.get(cat, "💸")
            pct = (amount / stats['expenses'] * 100) if stats['expenses'] else 0.0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")
        
        # Runway indicator logic
        runway = stats['runway']
        if runway >= 6:
            r_icon, r_status = "🟢", "Healthy "
        elif runway >= 3:
            r_icon, r_status = "🟡", "Caution "
        else:
            r_icon, r_status = "🔴", "Critical"
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 RUNWAY STATUS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    {r_icon} {runway:>4.1f} months │ {r_status:<30} ║",
            "║                                                           ║",
            "║  [💵 Transactions]  [📊 Forecast]  [📈 Reports]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Stability!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💵 Initializing Cash Flow Tracker...")
    print("=" * 60)
    
    try:
        cf = CashFlowTracker("Saigon Digital Hub", 50000.0)
        print("\n" + cf.format_dashboard())
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
