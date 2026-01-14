"""
🏢 FranchiseManager - Territory-based Franchise System
=====================================================

Orchestrates the expansion of the Agency OS network through local partners.
Handles exclusive territory rights, revenue sharing, and performance tracking.

Territory Strategy:
- High Density: HCM, Ha Noi
- Emerging: Da Nang, Can Tho, Hai Phong
- Strategic: Nha Trang, Hue, Vung Tau

Binh Pháp: 🗺️ Địa Hình (Terrain) - Understanding and controlling the territory.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Any, Set
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class FranchiseStatus(Enum):
    """Lifecycle stages of a franchise partner."""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"


class Territory(Enum):
    """Core operational territories in Vietnam."""
    CAN_THO = "can_tho"
    DA_NANG = "da_nang"
    HA_NOI = "ha_noi"
    HCM = "hcm"
    HAI_PHONG = "hai_phong"
    NHA_TRANG = "nha_trang"
    HUE = "hue"
    VUNG_TAU = "vung_tau"


# Territory capacity limits (Max partners allowed per region)
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
    """Represents a franchise partner's data and financial performance."""
    id: Optional[int] = None
    name: str = ""
    email: str = ""
    phone: str = ""
    territory: Territory = Territory.HCM
    status: FranchiseStatus = FranchiseStatus.PENDING
    royalty_rate: float = 0.20  # Standard 20% royalty
    total_revenue: float = 0.0
    total_royalties: float = 0.0
    clients_count: int = 0
    joined_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def calculate_royalty(self, revenue: float) -> float:
        """Calculates the royalty amount for a given revenue stream."""
        return revenue * self.royalty_rate


class FranchiseManager:
    """
    🏢 Franchise Network Manager
    
    The brain of the Agency OS expansion model.
    Ensures optimal partner density and financial health across the network.
    """
    
    def __init__(self):
        self.franchisees: List[Franchisee] = []
        self._next_id = 1
    
    def get_available_territories(self) -> List[Territory]:
        """Identifies territories that have not yet reached partner capacity."""
        available = []
        for territory, capacity in TERRITORY_CAPACITY.items():
            # Only count active/pending partners against capacity
            current_count = sum(1 for f in self.franchisees 
                               if f.territory == territory and f.status in 
                               [FranchiseStatus.ACTIVE, FranchiseStatus.PENDING])
            if current_count < capacity:
                available.append(territory)
        return available
    
    def add_franchisee(
        self,
        name: str,
        email: str = "",
        phone: str = "",
        territory: Territory = Territory.HCM,
        royalty_rate: Optional[float] = None
    ) -> Optional[Franchisee]:
        """
        Attempts to register a new franchise partner.
        Returns the Franchisee object if successful, None if territory is full.
        """
        available = self.get_available_territories()
        if territory not in available:
            logger.warning(f"Registration failed: Territory {territory.value} is at capacity.")
            return None
        
        franchisee = Franchisee(
            id=self._next_id,
            name=name,
            email=email,
            phone=phone,
            territory=territory,
            status=FranchiseStatus.ACTIVE,
            royalty_rate=royalty_rate or 0.20
        )
        self.franchisees.append(franchisee)
        self._next_id += 1
        logger.info(f"Registered new partner: {name} in {territory.value}")
        return franchisee
    
    def record_revenue(self, franchisee_id: int, revenue: float) -> float:
        """
        Records revenue for a specific partner and updates royalty totals.
        Returns the royalty amount calculated.
        """
        franchisee = next((f for f in self.franchisees if f.id == franchisee_id), None)
        if not franchisee:
            raise ValueError(f"Franchisee ID {franchisee_id} not found.")
            
        royalty = franchisee.calculate_royalty(revenue)
        franchisee.total_revenue += revenue
        franchisee.total_royalties += royalty
        return royalty
    
    def get_network_stats(self) -> Dict[str, Any]:
        """Calculates high-level metrics for the entire franchise network."""
        active = [f for f in self.franchisees if f.status == FranchiseStatus.ACTIVE]
        
        return {
            "performance": {
                "total_network_revenue": sum(f.total_revenue for f in self.franchisees),
                "total_royalties_collected": sum(f.total_royalties for f in self.franchisees),
                "avg_revenue_per_partner": sum(f.total_revenue for f in active) / len(active) if active else 0
            },
            "network_size": {
                "total_partners": len(self.franchisees),
                "active_partners": len(active),
                "territories_covered": len(set(f.territory for f in active))
            },
            "growth": {
                "capacity_utilization": (len(self.franchisees) / sum(TERRITORY_CAPACITY.values())) * 100
            }
        }
    
    def get_territory_report(self) -> List[Dict[str, Any]]:
        """Generates a detailed performance report broken down by territory."""
        report = []
        for territory in Territory:
            partners = [f for f in self.franchisees if f.territory == territory]
            report.append({
                "territory": territory.value,
                "status": "AT_CAPACITY" if len(partners) >= TERRITORY_CAPACITY[territory] else "AVAILABLE",
                "partner_count": len(partners),
                "revenue": sum(f.total_revenue for f in partners),
                "royalties": sum(f.total_royalties for f in partners)
            })
        return report


# Global instance
franchise_manager = FranchiseManager()