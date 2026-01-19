"""
Patent Agent - Patent Filings & Prosecution
Manages patent applications, prosecution, and maintenance.
"""

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


class PatentStatus(Enum):
    DRAFT = "draft"
    FILED = "filed"
    PENDING = "pending"
    EXAMINATION = "examination"
    GRANTED = "granted"
    EXPIRED = "expired"
    ABANDONED = "abandoned"


class PatentType(Enum):
    UTILITY = "utility"
    DESIGN = "design"
    PROVISIONAL = "provisional"
    PCT = "pct"
    CONTINUATION = "continuation"


@dataclass
class Patent:
    """Patent application"""

    id: str
    title: str
    application_number: str
    patent_type: PatentType
    inventors: List[str]
    status: PatentStatus = PatentStatus.DRAFT
    filing_date: Optional[datetime] = None
    grant_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    next_maintenance_fee: Optional[datetime] = None
    claims: int = 0
    attorney: str = ""
    notes: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def days_until_maintenance(self) -> int:
        if self.next_maintenance_fee:
            return (self.next_maintenance_fee - datetime.now()).days
        return 0


class PatentAgent:
    """
    Patent Agent - Quản lý Bằng sáng chế

    Responsibilities:
    - File patent applications
    - Track prosecution
    - Manage maintenance fees
    - Prior art search
    """

    def __init__(self):
        self.name = "Patent"
        self.status = "ready"
        self.patents: Dict[str, Patent] = {}

    def file_patent(
        self,
        title: str,
        patent_type: PatentType,
        inventors: List[str],
        claims: int = 1,
        attorney: str = "",
    ) -> Patent:
        """File new patent application"""
        patent_id = f"patent_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        app_number = f"VN{datetime.now().year}{random.randint(10000, 99999)}"

        patent = Patent(
            id=patent_id,
            title=title,
            application_number=app_number,
            patent_type=patent_type,
            inventors=inventors,
            status=PatentStatus.FILED,
            filing_date=datetime.now(),
            claims=claims,
            attorney=attorney,
        )

        self.patents[patent_id] = patent
        return patent

    def update_status(self, patent_id: str, status: PatentStatus) -> Patent:
        """Update patent status"""
        if patent_id not in self.patents:
            raise ValueError(f"Patent not found: {patent_id}")

        patent = self.patents[patent_id]
        patent.status = status

        if status == PatentStatus.GRANTED:
            patent.grant_date = datetime.now()
            patent.expiry_date = datetime.now() + timedelta(days=20 * 365)
            patent.next_maintenance_fee = datetime.now() + timedelta(days=4 * 365)

        return patent

    def pay_maintenance(self, patent_id: str) -> Patent:
        """Pay maintenance fee"""
        if patent_id not in self.patents:
            raise ValueError(f"Patent not found: {patent_id}")

        patent = self.patents[patent_id]
        patent.next_maintenance_fee = datetime.now() + timedelta(days=4 * 365)

        return patent

    def get_granted(self) -> List[Patent]:
        """Get granted patents"""
        return [p for p in self.patents.values() if p.status == PatentStatus.GRANTED]

    def get_pending(self) -> List[Patent]:
        """Get pending patents"""
        return [
            p
            for p in self.patents.values()
            if p.status in [PatentStatus.FILED, PatentStatus.PENDING, PatentStatus.EXAMINATION]
        ]

    def get_stats(self) -> Dict:
        """Get patent statistics"""
        patents = list(self.patents.values())

        return {
            "total_patents": len(patents),
            "granted": len(self.get_granted()),
            "pending": len(self.get_pending()),
            "total_claims": sum(p.claims for p in patents),
            "maintenance_due": len(
                [p for p in patents if p.next_maintenance_fee and p.days_until_maintenance <= 90]
            ),
        }


# Demo
if __name__ == "__main__":
    agent = PatentAgent()

    print("📜 Patent Agent Demo\n")

    # File patents
    p1 = agent.file_patent(
        "AI-Powered Sales Agent",
        PatentType.UTILITY,
        ["Nguyen A", "Tran B"],
        claims=15,
        attorney="IP_001",
    )
    p2 = agent.file_patent(
        "Dashboard UI Design", PatentType.DESIGN, ["Le C"], claims=1, attorney="IP_001"
    )

    print(f"📋 Patent: {p1.title}")
    print(f"   App #: {p1.application_number}")
    print(f"   Type: {p1.patent_type.value}")
    print(f"   Claims: {p1.claims}")

    # Grant patent
    agent.update_status(p1.id, PatentStatus.GRANTED)

    print(f"\n✅ Status: {p1.status.value}")
    print(f"   Expires: {p1.expiry_date.strftime('%Y-%m-%d')}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Granted: {stats['granted']}")
    print(f"   Pending: {stats['pending']}")
    print(f"   Total Claims: {stats['total_claims']}")
