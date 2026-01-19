"""
Payroll Agent - Payroll Processing & Management
Manages payroll runs, deductions, and pay history.
"""

import random
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
    RETIREMENT = "retirement"
    OTHER = "other"


@dataclass
class PayrollEntry:
    """Individual payroll entry"""

    id: str
    employee_id: str
    employee_name: str
    gross_pay: float
    deductions: Dict[str, float] = field(default_factory=dict)
    net_pay: float = 0
    pay_date: date = None
    status: PayrollStatus = PayrollStatus.DRAFT

    def __post_init__(self):
        if self.pay_date is None:
            self.pay_date = date.today()
        self.calculate_net()

    def calculate_net(self):
        self.net_pay = self.gross_pay - sum(self.deductions.values())


@dataclass
class PayrollRun:
    """Payroll run batch"""

    id: str
    period: str  # e.g., "2024-12"
    entries: List[PayrollEntry] = field(default_factory=list)
    status: PayrollStatus = PayrollStatus.DRAFT
    total_gross: float = 0
    total_deductions: float = 0
    total_net: float = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class PayrollAgent:
    """
    Payroll Agent - Xử lý Bảng lương

    Responsibilities:
    - Process payroll runs
    - Manage deductions
    - Calculate taxes
    - Track pay history
    """

    # Default tax rates
    TAX_RATE = 0.20
    INSURANCE_RATE = 0.08
    RETIREMENT_RATE = 0.06

    def __init__(self):
        self.name = "Payroll"
        self.status = "ready"
        self.runs: Dict[str, PayrollRun] = {}

    def create_run(self, period: str) -> PayrollRun:
        """Create payroll run"""
        run_id = f"payroll_{period}_{random.randint(100, 999)}"

        run = PayrollRun(id=run_id, period=period)

        self.runs[run_id] = run
        return run

    def add_entry(
        self,
        run_id: str,
        employee_id: str,
        employee_name: str,
        gross_pay: float,
        custom_deductions: Dict[str, float] = None,
    ) -> PayrollEntry:
        """Add payroll entry"""
        if run_id not in self.runs:
            raise ValueError(f"Run not found: {run_id}")

        entry_id = f"entry_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        # Calculate deductions
        deductions = {
            "Tax": gross_pay * self.TAX_RATE,
            "Insurance": gross_pay * self.INSURANCE_RATE,
            "Retirement": gross_pay * self.RETIREMENT_RATE,
        }

        if custom_deductions:
            deductions.update(custom_deductions)

        entry = PayrollEntry(
            id=entry_id,
            employee_id=employee_id,
            employee_name=employee_name,
            gross_pay=gross_pay,
            deductions=deductions,
        )

        run = self.runs[run_id]
        run.entries.append(entry)

        # Update totals
        run.total_gross += entry.gross_pay
        run.total_deductions += sum(entry.deductions.values())
        run.total_net += entry.net_pay

        return entry

    def process_run(self, run_id: str) -> PayrollRun:
        """Process payroll run"""
        if run_id not in self.runs:
            raise ValueError(f"Run not found: {run_id}")

        run = self.runs[run_id]
        run.status = PayrollStatus.PROCESSING

        for entry in run.entries:
            entry.status = PayrollStatus.PROCESSING

        return run

    def complete_run(self, run_id: str) -> PayrollRun:
        """Complete payroll run"""
        if run_id not in self.runs:
            raise ValueError(f"Run not found: {run_id}")

        run = self.runs[run_id]
        run.status = PayrollStatus.PAID

        for entry in run.entries:
            entry.status = PayrollStatus.PAID

        return run

    def get_stats(self) -> Dict:
        """Get payroll statistics"""
        runs = list(self.runs.values())
        completed = [r for r in runs if r.status == PayrollStatus.PAID]

        return {
            "total_runs": len(runs),
            "completed": len(completed),
            "total_paid": sum(r.total_net for r in completed),
            "total_deductions": sum(r.total_deductions for r in completed),
            "avg_net_pay": sum(r.total_net for r in runs) / sum(len(r.entries) for r in runs)
            if runs
            else 0,
        }


# Demo
if __name__ == "__main__":
    agent = PayrollAgent()

    print("💳 Payroll Agent Demo\n")

    # Create run
    run = agent.create_run("2024-12")

    print(f"📋 Payroll Run: {run.period}")

    # Add entries
    e1 = agent.add_entry(run.id, "EMP001", "Nguyen A", 2700)
    e2 = agent.add_entry(run.id, "EMP002", "Tran B", 1600)
    e3 = agent.add_entry(run.id, "EMP003", "Le C", 2200)

    print(f"\n💰 Entry: {e1.employee_name}")
    print(f"   Gross: ${e1.gross_pay:,.0f}")
    print(f"   Deductions: ${sum(e1.deductions.values()):,.0f}")
    print(f"   Net: ${e1.net_pay:,.0f}")

    # Process
    agent.process_run(run.id)
    agent.complete_run(run.id)

    print(f"\n✅ Run Status: {run.status.value}")
    print(f"   Total Net: ${run.total_net:,.0f}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total Paid: ${stats['total_paid']:,.0f}")
    print(f"   Total Deductions: ${stats['total_deductions']:,.0f}")
