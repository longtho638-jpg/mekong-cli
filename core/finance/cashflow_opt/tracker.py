"""
Cash Flow tracking and runway calculation logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from .models import ExpenseCategory, IncomeCategory, Transaction, TransactionType

logger = logging.getLogger(__name__)

class CashFlowTracker:
    """
    Cash Flow Tracker System.
    Monitors all cash movements and calculates business runway.
    """

    def __init__(self, agency_name: str, opening_balance: float = 50000.0):
        self.agency_name = agency_name
        self.opening_balance = opening_balance
        self.transactions: List[Transaction] = []
        logger.info(
            f"Cash Flow Tracker initialized for {agency_name} (Opening: ${opening_balance:,.0f})"
        )
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
        self, category: IncomeCategory, amount: float, description: str, client: str = ""
    ) -> Transaction:
        """Record an incoming transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.INCOME,
            category=category.value,
            amount=amount,
            description=description,
            client=client,
        )
        self.transactions.append(tx)
        logger.info(f"Income added: ${amount:,.2f} from {client or 'N/A'}")
        return tx

    def add_expense(
        self, category: ExpenseCategory, amount: float, description: str
    ) -> Transaction:
        """Record an outgoing transaction."""
        tx = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:6].upper()}",
            type=TransactionType.EXPENSE,
            category=category.value,
            amount=amount,
            description=description,
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
        """Estimate runway months."""
        balance = self.get_current_balance()
        cutoff = datetime.now() - timedelta(days=30)
        recent_expenses = [
            t.amount
            for t in self.transactions
            if t.type == TransactionType.EXPENSE and t.date >= cutoff
        ]
        monthly_burn = sum(recent_expenses)

        if monthly_burn <= 0:
            return 99.0

        return balance / monthly_burn
