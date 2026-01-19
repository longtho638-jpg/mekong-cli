"""
Trademark Agent - Trademark Registration & Monitoring
Manages trademark applications, renewals, and protection.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


class TrademarkStatus(Enum):
    SEARCHED = "searched"
    FILED = "filed"
    PUBLISHED = "published"
    REGISTERED = "registered"
    RENEWED = "renewed"
    EXPIRED = "expired"
    OPPOSED = "opposed"


class TrademarkClass(Enum):
    CLASS_9 = "class_9"  # Software
    CLASS_35 = "class_35"  # Business services
    CLASS_42 = "class_42"  # Tech services
    CLASS_38 = "class_38"  # Telecom
    CLASS_41 = "class_41"  # Education


@dataclass
class Trademark:
    """Trademark registration"""

    id: str
    name: str
    registration_number: str
    classes: List[TrademarkClass]
    status: TrademarkStatus = TrademarkStatus.SEARCHED
    filing_date: Optional[datetime] = None
    registration_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    territories: List[str] = field(default_factory=list)
    logo_url: str = ""
    attorney: str = ""
    notes: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if not self.territories:
            self.territories = ["VN"]

    @property
    def days_until_expiry(self) -> int:
        if self.expiry_date:
            return (self.expiry_date - datetime.now()).days
        return 0


class TrademarkAgent:
    """
    Trademark Agent - Quản lý Nhãn hiệu

    Responsibilities:
    - Register trademarks
    - Search & clearance
    - Track renewals
    - Monitor infringement
    """

    def __init__(self):
        self.name = "Trademark"
        self.status = "ready"
        self.trademarks: Dict[str, Trademark] = {}

    def file_trademark(
        self,
        name: str,
        classes: List[TrademarkClass],
        territories: List[str] = None,
        attorney: str = "",
    ) -> Trademark:
        """File new trademark"""
        tm_id = f"tm_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        reg_number = f"TM{datetime.now().year}{random.randint(10000, 99999)}"

        trademark = Trademark(
            id=tm_id,
            name=name,
            registration_number=reg_number,
            classes=classes,
            status=TrademarkStatus.FILED,
            filing_date=datetime.now(),
            territories=territories or ["VN"],
            attorney=attorney,
        )

        self.trademarks[tm_id] = trademark
        return trademark

    def register(self, tm_id: str) -> Trademark:
        """Mark trademark as registered"""
        if tm_id not in self.trademarks:
            raise ValueError(f"Trademark not found: {tm_id}")

        tm = self.trademarks[tm_id]
        tm.status = TrademarkStatus.REGISTERED
        tm.registration_date = datetime.now()
        tm.expiry_date = datetime.now() + timedelta(days=10 * 365)

        return tm

    def renew(self, tm_id: str) -> Trademark:
        """Renew trademark"""
        if tm_id not in self.trademarks:
            raise ValueError(f"Trademark not found: {tm_id}")

        tm = self.trademarks[tm_id]
        tm.status = TrademarkStatus.RENEWED
        tm.expiry_date = datetime.now() + timedelta(days=10 * 365)

        return tm

    def get_registered(self) -> List[Trademark]:
        """Get registered trademarks"""
        return [
            t
            for t in self.trademarks.values()
            if t.status in [TrademarkStatus.REGISTERED, TrademarkStatus.RENEWED]
        ]

    def get_expiring_soon(self, days: int = 180) -> List[Trademark]:
        """Get trademarks expiring soon"""
        return [
            t for t in self.trademarks.values() if t.expiry_date and 0 < t.days_until_expiry <= days
        ]

    def get_stats(self) -> Dict:
        """Get trademark statistics"""
        trademarks = list(self.trademarks.values())

        return {
            "total_trademarks": len(trademarks),
            "registered": len(self.get_registered()),
            "pending": len([t for t in trademarks if t.status == TrademarkStatus.FILED]),
            "territories": len(set(t for tm in trademarks for t in tm.territories)),
            "expiring_180_days": len(self.get_expiring_soon(180)),
        }


# Demo
if __name__ == "__main__":
    agent = TrademarkAgent()

    print("™️ Trademark Agent Demo\n")

    # File trademarks
    t1 = agent.file_trademark(
        "Mekong-CLI",
        [TrademarkClass.CLASS_9, TrademarkClass.CLASS_42],
        ["VN", "US", "EU"],
        attorney="IP_001",
    )
    t2 = agent.file_trademark("AgenticOps", [TrademarkClass.CLASS_42], ["VN"], attorney="IP_001")

    print(f"📋 Trademark: {t1.name}")
    print(f"   Reg #: {t1.registration_number}")
    print(f"   Classes: {[c.value for c in t1.classes]}")
    print(f"   Territories: {t1.territories}")

    # Register
    agent.register(t1.id)

    print(f"\n✅ Status: {t1.status.value}")
    print(f"   Expires: {t1.expiry_date.strftime('%Y-%m-%d')}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Registered: {stats['registered']}")
    print(f"   Territories: {stats['territories']}")
