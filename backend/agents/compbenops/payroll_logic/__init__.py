"""
Payroll Agent Facade.
"""
from typing import Dict

from .engine import PayrollEngine
from .models import DeductionType, PayrollEntry, PayrollRun, PayrollStatus


class PayrollAgent(PayrollEngine):
    """Refactored Payroll Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Payroll"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_runs": len(self.runs), "total_paid": sum(r.total_net for r in self.runs.values() if r.status == PayrollStatus.PAID)}

__all__ = ['PayrollAgent', 'PayrollStatus', 'PayrollEntry', 'PayrollRun', 'DeductionType']
