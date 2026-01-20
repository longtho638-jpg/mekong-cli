"""
Payroll Agent engine logic.
"""
import random
from datetime import datetime
from typing import Dict, List

from .models import PayrollEntry, PayrollRun, PayrollStatus


class PayrollEngine:
    TAX_RATE = 0.20
    INSURANCE_RATE = 0.08
    RETIREMENT_RATE = 0.06

    def __init__(self):
        self.runs: Dict[str, PayrollRun] = {}

    def create_run(self, period: str) -> PayrollRun:
        rid = f"payroll_{period}_{random.randint(100, 999)}"
        run = PayrollRun(id=rid, period=period)
        self.runs[rid] = run
        return run

    def add_entry(self, run_id: str, employee_id: str, employee_name: str, gross_pay: float) -> PayrollEntry:
        if run_id not in self.runs: raise ValueError("Run not found")
        deductions = {"Tax": gross_pay * self.TAX_RATE, "Insurance": gross_pay * self.INSURANCE_RATE, "Retirement": gross_pay * self.RETIREMENT_RATE}
        entry = PayrollEntry(id=f"entry_{int(datetime.now().timestamp())}", employee_id=employee_id, employee_name=employee_name, gross_pay=gross_pay, deductions=deductions)
        entry.calculate_net()
        run = self.runs[run_id]
        run.entries.append(entry)
        run.total_gross += entry.gross_pay
        run.total_deductions += sum(entry.deductions.values())
        run.total_net += entry.net_pay
        return entry
