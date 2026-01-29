"""
Payroll Agent Data Models.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List


class PayrollStatus(Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PAID = "paid"


class DeductionType(Enum):
    TAX = "tax"
    INSURANCE = "insurance"
    BENEFITS = "benefits"
    RETIREMENT = "retirement"
    OTHER = "other"


@dataclass
class PayrollEntry:
    id: str
    employee_id: str
    employee_name: str
    gross_pay: float
    deductions: Dict[str, float] = field(default_factory=dict)
    net_pay: float = 0
    pay_date: date = field(default_factory=date.today)
    status: PayrollStatus = PayrollStatus.DRAFT

    def calculate_net(self):
        self.net_pay = self.gross_pay - sum(self.deductions.values())


@dataclass
class PayrollRun:
    id: str
    period: str
    entries: List[PayrollEntry] = field(default_factory=list)
    status: PayrollStatus = PayrollStatus.DRAFT
    total_gross: float = 0
    total_deductions: float = 0
    total_net: float = 0
    created_at: datetime = field(default_factory=datetime.now)
