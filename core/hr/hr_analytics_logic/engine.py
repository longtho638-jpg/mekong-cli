"""
HR Analytics Engine logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict

from .models import AttritionRisk, Department, Employee, HRMetric

logger = logging.getLogger(__name__)

class HRAnalyticsEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.employees: Dict[str, Employee] = {}
        self.metrics: Dict[str, HRMetric] = {}

    def add_employee(
        self, name: str, department: Department, role: str, salary: float, enps: int = 0, performance: int = 3
    ) -> Employee:
        if not name or not role: raise ValueError("Name and role required")
        emp = Employee(
            id=f"EMP-{uuid.uuid4().hex[:6].upper()}",
            name=name, department=department, role=role,
            hire_date=datetime.now() - timedelta(days=180),
            salary=salary, enps_score=enps, performance_score=performance
        )
        if enps < 20 and performance < 3: emp.attrition_risk = AttritionRisk.CRITICAL
        elif enps < 40: emp.attrition_risk = AttritionRisk.HIGH
        elif enps < 60: emp.attrition_risk = AttritionRisk.MEDIUM
        self.employees[emp.id] = emp
        return emp

    def get_aggregate_stats(self) -> Dict[str, Any]:
        count = len(self.employees)
        if not count: return {"headcount": 0}
        avg_enps = sum(e.enps_score for e in self.employees.values()) / count
        avg_salary = sum(e.salary for e in self.employees.values()) / count
        return {"headcount": count, "avg_enps": avg_enps, "avg_salary": avg_salary}
