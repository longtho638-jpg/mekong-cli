"""
Compensation Agent - Salary & Pay Equity Management
Manages salary structures, benchmarking, and equity analysis.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict


class JobLevel(Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"


@dataclass
class SalaryBand:
    """Salary band for a job level"""

    id: str
    level: JobLevel
    job_family: str
    min_salary: float
    mid_salary: float
    max_salary: float
    currency: str = "USD"


@dataclass
class EmployeeCompensation:
    """Employee compensation record"""

    id: str
    employee_id: str
    name: str
    job_family: str
    level: JobLevel
    base_salary: float
    bonus_target: float  # percentage
    equity_value: float = 0
    compa_ratio: float = 0  # salary / mid_salary

    def calculate_total_comp(self) -> float:
        return self.base_salary * (1 + self.bonus_target / 100) + self.equity_value


class CompensationAgent:
    """
    Compensation Agent - Quản lý Lương thưởng

    Responsibilities:
    - Manage salary structures
    - Analyze pay equity
    - Market benchmarking
    - Bonus planning
    """

    def __init__(self):
        self.name = "Compensation"
        self.status = "ready"
        self.bands: Dict[str, SalaryBand] = {}
        self.employees: Dict[str, EmployeeCompensation] = {}

    def create_band(
        self,
        level: JobLevel,
        job_family: str,
        min_salary: float,
        mid_salary: float,
        max_salary: float,
    ) -> SalaryBand:
        """Create salary band"""
        band_id = f"band_{level.value}_{job_family}"

        band = SalaryBand(
            id=band_id,
            level=level,
            job_family=job_family,
            min_salary=min_salary,
            mid_salary=mid_salary,
            max_salary=max_salary,
        )

        self.bands[band_id] = band
        return band

    def add_employee(
        self,
        employee_id: str,
        name: str,
        job_family: str,
        level: JobLevel,
        base_salary: float,
        bonus_target: float = 10,
        equity_value: float = 0,
    ) -> EmployeeCompensation:
        """Add employee compensation"""
        comp_id = f"comp_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        # Calculate compa-ratio
        band_key = f"band_{level.value}_{job_family}"
        compa_ratio = 1.0
        if band_key in self.bands:
            compa_ratio = base_salary / self.bands[band_key].mid_salary

        comp = EmployeeCompensation(
            id=comp_id,
            employee_id=employee_id,
            name=name,
            job_family=job_family,
            level=level,
            base_salary=base_salary,
            bonus_target=bonus_target,
            equity_value=equity_value,
            compa_ratio=compa_ratio,
        )

        self.employees[comp_id] = comp
        return comp

    def analyze_pay_equity(self, job_family: str = None) -> Dict:
        """Analyze pay equity"""
        employees = list(self.employees.values())
        if job_family:
            employees = [e for e in employees if e.job_family == job_family]

        if not employees:
            return {"avg_compa_ratio": 0, "below_market": 0, "above_market": 0}

        below = [e for e in employees if e.compa_ratio < 0.9]
        above = [e for e in employees if e.compa_ratio > 1.1]

        return {
            "avg_compa_ratio": sum(e.compa_ratio for e in employees) / len(employees),
            "below_market": len(below),
            "above_market": len(above),
            "at_market": len(employees) - len(below) - len(above),
        }

    def get_stats(self) -> Dict:
        """Get compensation statistics"""
        employees = list(self.employees.values())

        return {
            "total_employees": len(employees),
            "total_payroll": sum(e.base_salary for e in employees),
            "avg_salary": sum(e.base_salary for e in employees) / len(employees)
            if employees
            else 0,
            "avg_compa_ratio": sum(e.compa_ratio for e in employees) / len(employees)
            if employees
            else 0,
            "total_bonus_liability": sum(e.base_salary * e.bonus_target / 100 for e in employees),
        }


# Demo
if __name__ == "__main__":
    agent = CompensationAgent()

    print("💰 Compensation Agent Demo\n")

    # Create bands
    b1 = agent.create_band(JobLevel.SENIOR, "Engineering", 2000, 2500, 3000)
    b2 = agent.create_band(JobLevel.MID, "Engineering", 1500, 1800, 2200)

    print(f"📊 Band: {b1.level.value} {b1.job_family}")
    print(f"   Range: ${b1.min_salary:,.0f} - ${b1.max_salary:,.0f}")
    print(f"   Midpoint: ${b1.mid_salary:,.0f}")

    # Add employees
    e1 = agent.add_employee(
        "EMP001", "Nguyen A", "Engineering", JobLevel.SENIOR, 2700, bonus_target=15
    )
    e2 = agent.add_employee("EMP002", "Tran B", "Engineering", JobLevel.MID, 1600, bonus_target=10)
    e3 = agent.add_employee("EMP003", "Le C", "Engineering", JobLevel.SENIOR, 2200, bonus_target=15)

    print(f"\n📋 Employee: {e1.name}")
    print(f"   Salary: ${e1.base_salary:,.0f}")
    print(f"   Compa-Ratio: {e1.compa_ratio:.2f}")

    # Pay equity
    print("\n⚖️ Pay Equity:")
    equity = agent.analyze_pay_equity("Engineering")
    print(f"   Avg Compa-Ratio: {equity['avg_compa_ratio']:.2f}")
    print(f"   Below Market: {equity['below_market']}")
    print(f"   At Market: {equity['at_market']}")
