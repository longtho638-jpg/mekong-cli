"""
FranchiseManager - Territory-based franchise system.

Creates Franchise Network Moat:
- Exclusive territory rights
- Revenue sharing (20% royalty)
- Local partner expansion

🏯 Binh Pháp: Địa Hình (Terrain) - Territory control
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class FranchiseStatus(Enum):
    """Franchise status levels."""

    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"


class Territory(Enum):
    """Available territories in Vietnam."""

    CAN_THO = "can_tho"
    DA_NANG = "da_nang"
    HA_NOI = "ha_noi"
    HCM = "hcm"
    HAI_PHONG = "hai_phong"
    NHA_TRANG = "nha_trang"
    HUE = "hue"
    VUNG_TAU = "vung_tau"


# Territory capacity limits
TERRITORY_CAPACITY = {
    Territory.CAN_THO: 1,
    Territory.DA_NANG: 2,
    Territory.HA_NOI: 3,
    Territory.HCM: 5,
    Territory.HAI_PHONG: 1,
    Territory.NHA_TRANG: 1,
    Territory.HUE: 1,
    Territory.VUNG_TAU: 1,
}


@dataclass
class Franchisee:
    """A franchise partner."""

    id: Optional[int] = None
    name: str = ""
    email: str = ""
    phone: str = ""
    territory: Territory = Territory.HCM
    status: FranchiseStatus = FranchiseStatus.PENDING
    royalty_rate: float = 0.20  # 20% default
    total_revenue: float = 0.0
    total_royalties: float = 0.0
    clients_count: int = 0
    joined_at: datetime = field(default_factory=datetime.now)

    def calculate_royalty(self, revenue: float) -> float:
        """Calculate royalty from revenue."""
        return revenue * self.royalty_rate


@dataclass
class FranchiseAgreement:
    """Franchise agreement terms."""

    territory: Territory
    exclusivity: bool = True
    royalty_rate: float = 0.20
    term_years: int = 3
    initial_fee: float = 5000.0
    monthly_minimum: float = 500.0


class FranchiseManager:
    """
    Manage franchise network for territorial expansion.

    Example:
        manager = FranchiseManager()
        franchisee = manager.add_franchisee(
            name="Anh Minh",
            territory=Territory.CAN_THO
        )
        manager.record_revenue(franchisee, 10000)
        # Royalty: $2,000 (20%)
    """

    def __init__(self):
        self.franchisees: List[Franchisee] = []
        self._next_id = 1

    def get_available_territories(self) -> List[Territory]:
        """Get territories with available capacity."""
        available = []
        for territory, capacity in TERRITORY_CAPACITY.items():
            current_count = len(
                [
                    f
                    for f in self.franchisees
                    if f.territory == territory and f.status == FranchiseStatus.ACTIVE
                ]
            )
            if current_count < capacity:
                available.append(territory)
        return available

    def add_franchisee(
        self, name: str, email: str = "", phone: str = "", territory: Territory = Territory.HCM
    ) -> Optional[Franchisee]:
        """Add a new franchisee if territory available."""
        available = self.get_available_territories()
        if territory not in available:
            return None  # Territory at capacity

        franchisee = Franchisee(
            id=self._next_id,
            name=name,
            email=email,
            phone=phone,
            territory=territory,
            status=FranchiseStatus.ACTIVE,
        )
        self.franchisees.append(franchisee)
        self._next_id += 1
        return franchisee

    def record_revenue(self, franchisee: Franchisee, revenue: float) -> float:
        """Record revenue and calculate royalty."""
        royalty = franchisee.calculate_royalty(revenue)
        franchisee.total_revenue += revenue
        franchisee.total_royalties += royalty
        return royalty

    def get_network_stats(self) -> Dict:
        """Get network-wide statistics."""
        active = [f for f in self.franchisees if f.status == FranchiseStatus.ACTIVE]
        return {
            "total_franchisees": len(self.franchisees),
            "active_franchisees": len(active),
            "territories_covered": len(set(f.territory for f in active)),
            "total_network_revenue": sum(f.total_revenue for f in self.franchisees),
            "total_royalties_collected": sum(f.total_royalties for f in self.franchisees),
            "avg_revenue_per_franchisee": sum(f.total_revenue for f in active) / len(active)
            if active
            else 0,
        }

    def get_territory_report(self) -> List[Dict]:
        """Get performance by territory."""
        report = []
        for territory in Territory:
            franchisees = [f for f in self.franchisees if f.territory == territory]
            capacity = TERRITORY_CAPACITY[territory]
            report.append(
                {
                    "territory": territory.value,
                    "capacity": capacity,
                    "filled": len([f for f in franchisees if f.status == FranchiseStatus.ACTIVE]),
                    "total_revenue": sum(f.total_revenue for f in franchisees),
                    "total_royalties": sum(f.total_royalties for f in franchisees),
                }
            )
        return report
