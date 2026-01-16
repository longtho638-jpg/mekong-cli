"""
🌍 Franchise System - Global Agency Network
=============================================

Manage franchisees, territories, and revenue sharing.

Features:
- Franchise onboarding
- Territory management  
- Revenue sharing & commission tracking
- Performance analytics
"""

import uuid
import logging
from typing import Optional, Dict, List
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FranchiseTier(Enum):
    """Franchise tier levels."""
    STARTER = "starter"       
    FRANCHISE = "franchise"   
    ENTERPRISE = "enterprise" 


class FranchiseStatus(Enum):
    """Franchisee lifecycle status."""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CHURNED = "churned"


class TerritoryStatus(Enum):
    """Current status of a geographical territory."""
    AVAILABLE = "available"
    CLAIMED = "claimed"
    EXCLUSIVE = "exclusive"


@dataclass
class Territory:
    """A franchise territory entity."""
    id: str
    country: str
    region: str
    city: Optional[str] = None
    population: int = 0  # thousands
    status: TerritoryStatus = TerritoryStatus.AVAILABLE
    franchisee_id: Optional[str] = None
    claimed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.population < 0:
            raise ValueError("Population cannot be negative")


@dataclass
class Franchisee:
    """A franchise partner record."""
    id: str
    name: str
    email: str
    company: str
    tier: FranchiseTier
    status: FranchiseStatus = FranchiseStatus.PENDING
    joined_at: datetime = field(default_factory=datetime.now)
    territories: List[str] = field(default_factory=list)
    monthly_fee: float = 0.0
    total_revenue: float = 0.0


class FranchiseSystem:
    """
    Franchise Management System.
    
    Orchestrates the global expansion of the agency network through partnerships and territory claims.
    """
    
    TIER_LIMITS = {
        FranchiseTier.STARTER: 1,
        FranchiseTier.FRANCHISE: 3,
        FranchiseTier.ENTERPRISE: 999
    }
    
    PRICING = {
        FranchiseTier.STARTER: 0.0,
        FranchiseTier.FRANCHISE: 500.0,
        FranchiseTier.ENTERPRISE: 2000.0
    }
    
    def __init__(self):
        self.franchisees: Dict[str, Franchisee] = {}
        self.territories: Dict[str, Territory] = {}
        
        logger.info("Franchise System initialized.")
        self._create_demo_data()
    
    def _create_demo_data(self):
        """Seed the system with sample territories and a franchisee."""
        logger.info("Loading demo franchise data...")
        # Add basic territories
        t1 = Territory("VN-HCM", "Vietnam", "HCM City", population=9000)
        self.territories[t1.id] = t1
        
        # Add a sample franchisee
        self.onboard_franchisee("Minh Nguyen", "minh@agency.vn", "Minh Digital", FranchiseTier.FRANCHISE)
    
    def onboard_franchisee(
        self,
        name: str,
        email: str,
        company: str,
        tier: FranchiseTier = FranchiseTier.FRANCHISE
    ) -> Franchisee:
        """Register a new partner into the network."""
        if not name or not email:
            raise ValueError("Name and email are required")

        f = Franchisee(
            id=f"FR-{uuid.uuid4().hex[:6].upper()}",
            name=name, email=email, company=company,
            tier=tier, status=FranchiseStatus.ACTIVE,
            monthly_fee=self.PRICING.get(tier, 500.0)
        )
        self.franchisees[f.id] = f
        logger.info(f"Franchisee onboarded: {company} ({tier.value})")
        return f
    
    def claim_territory(self, franchisee_id: str, territory_id: str) -> bool:
        """Assign an available territory to a franchisee."""
        if franchisee_id not in self.franchisees: return False
        if territory_id not in self.territories: return False
        
        f = self.franchisees[franchisee_id]
        t = self.territories[territory_id]
        
        if t.status != TerritoryStatus.AVAILABLE:
            logger.error(f"Territory {territory_id} is not available")
            return False
            
        if len(f.territories) >= self.TIER_LIMITS.get(f.tier, 1):
            logger.warning(f"Franchisee {f.company} reached tier limit for territories")
            return False
            
        t.status = TerritoryStatus.CLAIMED
        t.franchisee_id = franchisee_id
        t.claimed_at = datetime.now()
        f.territories.append(territory_id)
        
        logger.info(f"Territory {territory_id} claimed by {f.company}")
        return True
    
    def format_dashboard(self) -> str:
        """Render the Franchise Network Dashboard."""
        active_f = [f for f in self.franchisees.values() if f.status == FranchiseStatus.ACTIVE]
        claimed_t = sum(1 for t in self.territories.values() if t.status != TerritoryStatus.AVAILABLE)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌍 FRANCHISE NETWORK DASHBOARD{' ' * 30}║",
            f"║  {len(active_f)} active partners │ {claimed_t} territories claimed{' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PARTNER OVERVIEW                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for f in list(self.franchisees.values())[:5]:
            tier_icon = "💎" if f.tier == FranchiseTier.ENTERPRISE else "⭐"
            lines.append(f"║  {tier_icon} {f.company[:20]:<20} │ {len(f.territories)} terr │ ${f.monthly_fee:>8,.0f}/mo ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🗺️ TERRITORY STATUS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for t in list(self.territories.values())[:3]:
            s_icon = "🔴" if t.status == TerritoryStatus.CLAIMED else "🟢"
            lines.append(f"║    {s_icon} {t.id:<10} │ {t.region:<15} │ {t.status.value:<12} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Partner]  [🗺️ Map]  [💰 Revenue]  [⚙️ Settings]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 Global HQ - \"Không đánh mà thắng\"{' ' * 21}║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🌍 Initializing Franchise System...")
    print("=" * 60)
    
    try:
        franchise_system = FranchiseSystem()
        # Claim
        fid = list(franchise_system.franchisees.keys())[0]
        tid = "VN-HCM"
        franchise_system.claim_territory(fid, tid)
        
        print("\n" + franchise_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Franchise Error: {e}")
