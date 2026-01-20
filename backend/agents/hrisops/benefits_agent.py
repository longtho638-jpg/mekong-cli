"""
Benefits Agent - Benefits Enrollment & Administration
Manages employee benefits, enrollments, and claims.
"""

import random
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional


class EnrollmentStatus(Enum):
    NOT_ENROLLED = "not_enrolled"
    PENDING = "pending"
    ENROLLED = "enrolled"
    WAIVED = "waived"
    TERMINATED = "terminated"


class PlanType(Enum):
    HEALTH = "health"
    DENTAL = "dental"
    VISION = "vision"
    LIFE = "life"
    RETIREMENT = "retirement"
    PTO = "pto"


@dataclass
class BenefitPlan:
    """Benefit plan"""

    id: str
    name: str
    plan_type: PlanType
    monthly_cost: float
    employer_contribution: float
    coverage: str
    active: bool = True


@dataclass
class Enrollment:
    """Employee benefit enrollment"""

    id: str
    employee_id: str
    employee_name: str
    plan_id: str
    plan_name: str
    status: EnrollmentStatus = EnrollmentStatus.PENDING
    enrolled_at: Optional[datetime] = None
    effective_date: Optional[date] = None
    dependents: int = 0

    def __post_init__(self):
        if self.enrolled_at is None:
            self.enrolled_at = datetime.now()


class BenefitsAgent:
    """
    Benefits Agent - Quản lý Phúc lợi

    Responsibilities:
    - Manage benefit plans
    - Handle enrollments
    - Track claims
    - Open enrollment
    """

    def __init__(self):
        self.name = "Benefits"
        self.status = "ready"
        self.plans: Dict[str, BenefitPlan] = {}
        self.enrollments: Dict[str, Enrollment] = {}

    def add_plan(
        self,
        name: str,
        plan_type: PlanType,
        monthly_cost: float,
        employer_contribution: float,
        coverage: str,
    ) -> BenefitPlan:
        """Add benefit plan"""
        plan_id = f"plan_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        plan = BenefitPlan(
            id=plan_id,
            name=name,
            plan_type=plan_type,
            monthly_cost=monthly_cost,
            employer_contribution=employer_contribution,
            coverage=coverage,
        )

        self.plans[plan_id] = plan
        return plan

    def enroll(
        self,
        employee_id: str,
        employee_name: str,
        plan_id: str,
        dependents: int = 0,
        effective_date: date = None,
    ) -> Enrollment:
        """Enroll employee in plan"""
        if plan_id not in self.plans:
            raise ValueError(f"Plan not found: {plan_id}")

        enrollment_id = f"enroll_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        plan = self.plans[plan_id]

        enrollment = Enrollment(
            id=enrollment_id,
            employee_id=employee_id,
            employee_name=employee_name,
            plan_id=plan_id,
            plan_name=plan.name,
            status=EnrollmentStatus.ENROLLED,
            effective_date=effective_date or date.today(),
            dependents=dependents,
        )

        self.enrollments[enrollment_id] = enrollment
        return enrollment

    def waive(self, enrollment_id: str) -> Enrollment:
        """Waive benefit"""
        if enrollment_id not in self.enrollments:
            raise ValueError(f"Enrollment not found: {enrollment_id}")

        enrollment = self.enrollments[enrollment_id]
        enrollment.status = EnrollmentStatus.WAIVED

        return enrollment

    def get_employee_benefits(self, employee_id: str) -> List[Enrollment]:
        """Get employee's enrollments"""
        return [
            e
            for e in self.enrollments.values()
            if e.employee_id == employee_id and e.status == EnrollmentStatus.ENROLLED
        ]

    def get_stats(self) -> Dict:
        """Get benefits statistics"""
        plans = list(self.plans.values())
        enrollments = list(self.enrollments.values())
        enrolled = [e for e in enrollments if e.status == EnrollmentStatus.ENROLLED]

        total_cost = sum(
            self.plans[e.plan_id].monthly_cost * (1 + e.dependents * 0.5)
            for e in enrolled
            if e.plan_id in self.plans
        )

        return {
            "total_plans": len(plans),
            "active_enrollments": len(enrolled),
            "total_dependents": sum(e.dependents for e in enrolled),
            "monthly_cost": total_cost,
            "enrollment_rate": f"{len(enrolled) / len(enrollments) * 100:.0f}%"
            if enrollments
            else "0%",
        }
