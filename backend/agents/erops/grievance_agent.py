"""
Grievance Agent - Complaint Handling & Resolution
Manages employee complaints and case resolutions.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class GrievanceStatus(Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INVESTIGATING = "investigating"
    PENDING_RESOLUTION = "pending_resolution"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class GrievanceType(Enum):
    HARASSMENT = "harassment"
    DISCRIMINATION = "discrimination"
    POLICY_VIOLATION = "policy_violation"
    WORKPLACE_SAFETY = "workplace_safety"
    COMPENSATION = "compensation"
    MANAGEMENT = "management"
    OTHER = "other"


class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Grievance:
    """Employee grievance case"""

    id: str
    title: str
    description: str
    grievance_type: GrievanceType
    complainant_id: str
    status: GrievanceStatus = GrievanceStatus.SUBMITTED
    priority: Priority = Priority.MEDIUM
    assigned_to: str = ""
    resolution: str = ""
    submitted_at: datetime = None
    resolved_at: Optional[datetime] = None

    def __post_init__(self):
        if self.submitted_at is None:
            self.submitted_at = datetime.now()

    @property
    def days_open(self) -> int:
        if self.resolved_at:
            return (self.resolved_at - self.submitted_at).days
        return (datetime.now() - self.submitted_at).days


class GrievanceAgent:
    """
    Grievance Agent - Xử lý Khiếu nại

    Responsibilities:
    - Intake complaints
    - Track cases
    - Manage resolutions
    - Ensure policy compliance
    """

    def __init__(self):
        self.name = "Grievance"
        self.status = "ready"
        self.cases: Dict[str, Grievance] = {}

    def submit_grievance(
        self,
        title: str,
        description: str,
        grievance_type: GrievanceType,
        complainant_id: str,
        priority: Priority = Priority.MEDIUM,
    ) -> Grievance:
        """Submit new grievance"""
        case_id = f"grv_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        grievance = Grievance(
            id=case_id,
            title=title,
            description=description,
            grievance_type=grievance_type,
            complainant_id=complainant_id,
            priority=priority,
        )

        self.cases[case_id] = grievance
        return grievance

    def assign(self, case_id: str, assigned_to: str) -> Grievance:
        """Assign case to specialist"""
        if case_id not in self.cases:
            raise ValueError(f"Case not found: {case_id}")

        case = self.cases[case_id]
        case.assigned_to = assigned_to
        case.status = GrievanceStatus.UNDER_REVIEW

        return case

    def update_status(self, case_id: str, status: GrievanceStatus) -> Grievance:
        """Update case status"""
        if case_id not in self.cases:
            raise ValueError(f"Case not found: {case_id}")

        case = self.cases[case_id]
        case.status = status

        return case

    def resolve(self, case_id: str, resolution: str) -> Grievance:
        """Resolve case"""
        if case_id not in self.cases:
            raise ValueError(f"Case not found: {case_id}")

        case = self.cases[case_id]
        case.status = GrievanceStatus.RESOLVED
        case.resolution = resolution
        case.resolved_at = datetime.now()

        return case

    def get_open_cases(self) -> List[Grievance]:
        """Get open cases"""
        return [
            c
            for c in self.cases.values()
            if c.status not in [GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED]
        ]

    def get_stats(self) -> Dict:
        """Get grievance statistics"""
        cases = list(self.cases.values())
        resolved = [c for c in cases if c.status == GrievanceStatus.RESOLVED]

        return {
            "total_cases": len(cases),
            "open": len(self.get_open_cases()),
            "resolved": len(resolved),
            "resolution_rate": f"{len(resolved) / len(cases) * 100:.0f}%" if cases else "0%",
            "avg_days_to_resolve": sum(c.days_open for c in resolved) / len(resolved)
            if resolved
            else 0,
            "critical": len([c for c in cases if c.priority == Priority.CRITICAL]),
        }


# Demo
if __name__ == "__main__":
    agent = GrievanceAgent()

    print("🤝 Grievance Agent Demo\n")

    # Submit grievances
    g1 = agent.submit_grievance(
        "Workplace harassment complaint",
        "Description of incident...",
        GrievanceType.HARASSMENT,
        "EMP_001",
        Priority.HIGH,
    )
    g2 = agent.submit_grievance(
        "Pay discrepancy issue",
        "Description...",
        GrievanceType.COMPENSATION,
        "EMP_002",
        Priority.MEDIUM,
    )

    print(f"📋 Case: {g1.title}")
    print(f"   Type: {g1.grievance_type.value}")
    print(f"   Priority: {g1.priority.value}")

    # Process case
    agent.assign(g1.id, "ER_SPEC_001")
    agent.update_status(g1.id, GrievanceStatus.INVESTIGATING)
    agent.resolve(g1.id, "Investigation complete. Action taken.")

    print(f"\n✅ Status: {g1.status.value}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Open: {stats['open']}")
    print(f"   Resolved: {stats['resolved']}")
    print(f"   Resolution Rate: {stats['resolution_rate']}")
