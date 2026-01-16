"""
Employee Agent - Workforce & Performance Management
Manages employee records, performance, and leave.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class EmployeeStatus(Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    PROBATION = "probation"
    TERMINATED = "terminated"


class Department(Enum):
    ENGINEERING = "engineering"
    PRODUCT = "product"
    SALES = "sales"
    MARKETING = "marketing"
    OPERATIONS = "operations"
    HR = "hr"
    FINANCE = "finance"


@dataclass
class Employee:
    """Employee record"""
    id: str
    name: str
    email: str
    department: Department
    title: str
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    manager_id: Optional[str] = None
    salary: float = 0.0
    start_date: Optional[datetime] = None
    performance_score: float = 0.0  # 0-5
    leave_balance: int = 12  # days
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.start_date is None:
            self.start_date = datetime.now()

    @property
    def tenure_months(self) -> int:
        return (datetime.now() - self.start_date).days // 30


class EmployeeAgent:
    """
    Employee Agent - Quản lý Nhân viên
    
    Responsibilities:
    - Manage employee records
    - Track performance
    - Handle leave requests
    - Compensation management
    """

    def __init__(self):
        self.name = "Employee"
        self.status = "ready"
        self.employees: Dict[str, Employee] = {}

    def add_employee(
        self,
        name: str,
        email: str,
        department: Department,
        title: str,
        salary: float,
        manager_id: Optional[str] = None
    ) -> Employee:
        """Add new employee"""
        emp_id = f"emp_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        employee = Employee(
            id=emp_id,
            name=name,
            email=email,
            department=department,
            title=title,
            salary=salary,
            manager_id=manager_id,
            status=EmployeeStatus.PROBATION
        )

        self.employees[emp_id] = employee
        return employee

    def update_status(self, emp_id: str, status: EmployeeStatus) -> Employee:
        """Update employee status"""
        if emp_id not in self.employees:
            raise ValueError(f"Employee not found: {emp_id}")

        employee = self.employees[emp_id]
        employee.status = status

        return employee

    def set_performance(self, emp_id: str, score: float) -> Employee:
        """Set performance score"""
        if emp_id not in self.employees:
            raise ValueError(f"Employee not found: {emp_id}")

        employee = self.employees[emp_id]
        employee.performance_score = min(5, max(0, score))

        return employee

    def request_leave(self, emp_id: str, days: int) -> Employee:
        """Request leave"""
        if emp_id not in self.employees:
            raise ValueError(f"Employee not found: {emp_id}")

        employee = self.employees[emp_id]
        if employee.leave_balance >= days:
            employee.leave_balance -= days
            employee.status = EmployeeStatus.ON_LEAVE

        return employee

    def get_by_department(self, department: Department) -> List[Employee]:
        """Get employees by department"""
        return [e for e in self.employees.values() if e.department == department]

    def get_top_performers(self, count: int = 5) -> List[Employee]:
        """Get top performers"""
        return sorted(self.employees.values(), key=lambda e: e.performance_score, reverse=True)[:count]

    def get_stats(self) -> Dict:
        """Get employee statistics"""
        employees = list(self.employees.values())
        active = [e for e in employees if e.status == EmployeeStatus.ACTIVE]

        return {
            "total_employees": len(employees),
            "active": len(active),
            "on_leave": len([e for e in employees if e.status == EmployeeStatus.ON_LEAVE]),
            "avg_performance": sum(e.performance_score for e in employees) / len(employees) if employees else 0,
            "total_payroll": sum(e.salary for e in active),
            "departments": len(set(e.department for e in employees))
        }


# Demo
if __name__ == "__main__":
    agent = EmployeeAgent()

    print("👥 Employee Agent Demo\n")

    # Add employees
    e1 = agent.add_employee("Nguyen A", "a@company.vn", Department.ENGINEERING, "Senior Engineer", 2500)
    e2 = agent.add_employee("Tran B", "b@company.vn", Department.PRODUCT, "Product Manager", 3000)
    e3 = agent.add_employee("Le C", "c@company.vn", Department.SALES, "Account Executive", 2000)

    print(f"📋 Employee: {e1.name}")
    print(f"   Title: {e1.title}")
    print(f"   Department: {e1.department.value}")
    print(f"   Salary: ${e1.salary:,.0f}")

    # Update status and performance
    agent.update_status(e1.id, EmployeeStatus.ACTIVE)
    agent.set_performance(e1.id, 4.8)
    agent.set_performance(e2.id, 4.5)
    agent.set_performance(e3.id, 4.2)

    print(f"\n⭐ Performance: {e1.performance_score}/5")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_employees']}")
    print(f"   Avg Performance: {stats['avg_performance']:.1f}")
    print(f"   Payroll: ${stats['total_payroll']:,.0f}")
