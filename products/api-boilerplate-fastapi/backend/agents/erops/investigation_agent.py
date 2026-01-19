"""
Investigation Agent - Workplace Incident Investigation
Manages incident investigations and evidence collection.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class InvestigationStatus(Enum):
    INITIATED = "initiated"
    EVIDENCE_GATHERING = "evidence_gathering"
    INTERVIEWS = "interviews"
    ANALYSIS = "analysis"
    REPORT_DRAFT = "report_draft"
    COMPLETED = "completed"
    CLOSED = "closed"


class IncidentType(Enum):
    MISCONDUCT = "misconduct"
    THEFT = "theft"
    FRAUD = "fraud"
    SAFETY_VIOLATION = "safety_violation"
    CONFLICT = "conflict"
    POLICY_BREACH = "policy_breach"


@dataclass
class Interview:
    """Investigation interview"""
    id: str
    interviewee_name: str
    role: str
    scheduled_at: datetime
    completed: bool = False
    notes: str = ""


@dataclass
class Investigation:
    """Workplace investigation"""
    id: str
    title: str
    incident_type: IncidentType
    related_case_id: str
    status: InvestigationStatus = InvestigationStatus.INITIATED
    lead_investigator: str = ""
    interviews: List[Interview] = field(default_factory=list)
    evidence_count: int = 0
    findings: str = ""
    started_at: datetime = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.started_at is None:
            self.started_at = datetime.now()


class InvestigationAgent:
    """
    Investigation Agent - Điều tra Sự cố
    
    Responsibilities:
    - Investigate incidents
    - Collect evidence
    - Track interviews
    - Generate reports
    """

    def __init__(self):
        self.name = "Investigation"
        self.status = "ready"
        self.investigations: Dict[str, Investigation] = {}

    def start_investigation(
        self,
        title: str,
        incident_type: IncidentType,
        related_case_id: str,
        lead_investigator: str
    ) -> Investigation:
        """Start new investigation"""
        inv_id = f"inv_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        investigation = Investigation(
            id=inv_id,
            title=title,
            incident_type=incident_type,
            related_case_id=related_case_id,
            lead_investigator=lead_investigator
        )

        self.investigations[inv_id] = investigation
        return investigation

    def add_evidence(self, inv_id: str, count: int = 1) -> Investigation:
        """Add evidence to investigation"""
        if inv_id not in self.investigations:
            raise ValueError(f"Investigation not found: {inv_id}")

        inv = self.investigations[inv_id]
        inv.evidence_count += count
        inv.status = InvestigationStatus.EVIDENCE_GATHERING

        return inv

    def schedule_interview(
        self,
        inv_id: str,
        interviewee_name: str,
        role: str,
        scheduled_at: datetime
    ) -> Investigation:
        """Schedule interview"""
        if inv_id not in self.investigations:
            raise ValueError(f"Investigation not found: {inv_id}")

        inv = self.investigations[inv_id]
        interview = Interview(
            id=f"int_{random.randint(100,999)}",
            interviewee_name=interviewee_name,
            role=role,
            scheduled_at=scheduled_at
        )
        inv.interviews.append(interview)
        inv.status = InvestigationStatus.INTERVIEWS

        return inv

    def complete_investigation(self, inv_id: str, findings: str) -> Investigation:
        """Complete investigation with findings"""
        if inv_id not in self.investigations:
            raise ValueError(f"Investigation not found: {inv_id}")

        inv = self.investigations[inv_id]
        inv.status = InvestigationStatus.COMPLETED
        inv.findings = findings
        inv.completed_at = datetime.now()

        return inv

    def get_active(self) -> List[Investigation]:
        """Get active investigations"""
        return [i for i in self.investigations.values() if i.status != InvestigationStatus.CLOSED]

    def get_stats(self) -> Dict:
        """Get investigation statistics"""
        investigations = list(self.investigations.values())
        completed = [i for i in investigations if i.status == InvestigationStatus.COMPLETED]

        return {
            "total_investigations": len(investigations),
            "active": len(self.get_active()),
            "completed": len(completed),
            "total_interviews": sum(len(i.interviews) for i in investigations),
            "total_evidence": sum(i.evidence_count for i in investigations)
        }


# Demo
if __name__ == "__main__":
    agent = InvestigationAgent()

    print("🔍 Investigation Agent Demo\n")

    # Start investigation
    i1 = agent.start_investigation(
        "Harassment Investigation",
        IncidentType.MISCONDUCT,
        "GRV_001",
        "INV_SPEC_001"
    )

    print(f"📋 Investigation: {i1.title}")
    print(f"   Type: {i1.incident_type.value}")
    print(f"   Lead: {i1.lead_investigator}")

    # Add evidence and interviews
    agent.add_evidence(i1.id, 3)
    agent.schedule_interview(i1.id, "Witness A", "Colleague", datetime.now())
    agent.schedule_interview(i1.id, "Witness B", "Manager", datetime.now())

    # Complete
    agent.complete_investigation(i1.id, "Findings confirmed. Recommend disciplinary action.")

    print(f"\n✅ Status: {i1.status.value}")
    print(f"   Evidence: {i1.evidence_count}")
    print(f"   Interviews: {len(i1.interviews)}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Active: {stats['active']}")
    print(f"   Completed: {stats['completed']}")
    print(f"   Total Interviews: {stats['total_interviews']}")
