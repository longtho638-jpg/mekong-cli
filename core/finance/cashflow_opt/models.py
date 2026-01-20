"""
Data models for Cash Flow tracking.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


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
