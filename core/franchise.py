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

import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class FranchiseTier(Enum):
    """Franchise tier levels."""
    STARTER = "starter"       # Free - personal use
    FRANCHISE = "franchise"   # $500/month - up to 3 territories
    ENTERPRISE = "enterprise" # Custom - unlimited


class FranchiseStatus(Enum):
    """Franchisee status."""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CHURNED = "churned"


class TerritoryStatus(Enum):
    """Territory status."""
    AVAILABLE = "available"
    CLAIMED = "claimed"
    EXCLUSIVE = "exclusive"


@dataclass
class Territory:
    """A franchise territory."""
    id: str
    country: str
    region: str
    city: Optional[str] = None
    population: int = 0  # thousands
    status: TerritoryStatus = TerritoryStatus.AVAILABLE
    franchisee_id: Optional[str] = None
    claimed_at: Optional[datetime] = None


@dataclass
class Franchisee:
    """A franchise partner."""
    id: str
    name: str
    email: str
    company: str
    tier: FranchiseTier
    status: FranchiseStatus
    joined_at: datetime
    territories: List[str] = field(default_factory=list)
    
    # Revenue tracking
    monthly_fee: float = 0.0
    local_revenue: float = 0.0
    saas_revenue: float = 0.0
    
    # Performance
    clients_count: int = 0
    mrr: float = 0.0


@dataclass
class RevenueShare:
    """Revenue sharing configuration."""
    franchisee_id: str
    period: str  # "2024-12"
    
    # Local client revenue (franchisee keeps 100%)
    local_revenue: float = 0.0
    local_fee: float = 0.0  # 0% to HQ
    
    # SaaS affiliate revenue (franchisee keeps 100%)
    saas_revenue: float = 0.0  
    saas_fee: float = 0.0  # 0% to HQ
    
    # Platform fee (franchisee pays to HQ)
    platform_fee: float = 500.0  # Monthly fee


class FranchiseSystem:
    """
    Global Franchise Management System.
    
    "Win Without Fighting" - Scale globally through partnerships.
    """
    
    def __init__(self):
        self.franchisees: Dict[str, Franchisee] = {}
        self.territories: Dict[str, Territory] = {}
        self.revenue_records: List[RevenueShare] = []
        
        # Pricing
        self.pricing = {
            FranchiseTier.STARTER: 0,
            FranchiseTier.FRANCHISE: 500,
            FranchiseTier.ENTERPRISE: 2000
        }
        
        # Initialize demo data
        self._create_demo_data()
    
    def _create_demo_data(self):
        """Create demo franchisees and territories."""
        # Create territories
        territories_data = [
            # Vietnam
            ("VN-HN", "Vietnam", "Hanoi", None, 8053),
            ("VN-HCM", "Vietnam", "Ho Chi Minh", None, 9000),
            ("VN-DN", "Vietnam", "Da Nang", None, 1134),
            
            # USA
            ("US-NY", "USA", "New York", "Manhattan", 1630),
            ("US-LA", "USA", "California", "Los Angeles", 3970),
            ("US-SF", "USA", "California", "San Francisco", 874),
            
            # Europe
            ("UK-LON", "UK", "England", "London", 8982),
            ("DE-BER", "Germany", "Berlin", None, 3645),
            ("FR-PAR", "France", "Paris", None, 2161),
            
            # Asia
            ("JP-TKY", "Japan", "Tokyo", None, 13960),
            ("SG-SG", "Singapore", "Singapore", None, 5454),
            ("TH-BKK", "Thailand", "Bangkok", None, 10539),
        ]
        
        for tid, country, region, city, pop in territories_data:
            self.territories[tid] = Territory(
                id=tid,
                country=country,
                region=region,
                city=city,
                population=pop
            )
        
        # Create demo franchisees
        demo_franchisees = [
            ("Minh Nguyen", "minh@nova-vn.com", "Nova Digital Vietnam", 
             FranchiseTier.FRANCHISE, ["VN-HN", "VN-HCM"]),
            ("John Smith", "john@agency-us.com", "Smith Agency", 
             FranchiseTier.FRANCHISE, ["US-NY"]),
            ("Emma Wilson", "emma@london-agency.co.uk", "London Digital", 
             FranchiseTier.ENTERPRISE, ["UK-LON"]),
        ]
        
        for name, email, company, tier, territory_ids in demo_franchisees:
            franchisee = self.onboard_franchisee(name, email, company, tier)
            for tid in territory_ids:
                self.claim_territory(franchisee.id, tid)
    
    # ═══════════════════════════════════════════════════════════
    # Onboarding
    # ═══════════════════════════════════════════════════════════
    
    def onboard_franchisee(
        self,
        name: str,
        email: str,
        company: str,
        tier: FranchiseTier = FranchiseTier.FRANCHISE
    ) -> Franchisee:
        """Onboard a new franchisee."""
        franchisee = Franchisee(
            id=f"FR-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            email=email,
            company=company,
            tier=tier,
            status=FranchiseStatus.ACTIVE,
            joined_at=datetime.now(),
            monthly_fee=self.pricing[tier]
        )
        
        self.franchisees[franchisee.id] = franchisee
        return franchisee
    
    def get_onboarding_checklist(self) -> List[Dict[str, Any]]:
        """Get franchisee onboarding checklist."""
        return [
            {"step": 1, "title": "Sign Agreement", "description": "Review and sign franchise agreement"},
            {"step": 2, "title": "Setup Account", "description": "Create Agency OS account"},
            {"step": 3, "title": "Claim Territory", "description": "Select your operating territory"},
            {"step": 4, "title": "Complete Training", "description": "Watch onboarding videos"},
            {"step": 5, "title": "Setup Payment", "description": "Add billing information"},
            {"step": 6, "title": "Launch", "description": "Start acquiring clients!"},
        ]
    
    # ═══════════════════════════════════════════════════════════
    # Territory Management
    # ═══════════════════════════════════════════════════════════
    
    def claim_territory(self, franchisee_id: str, territory_id: str) -> bool:
        """Claim a territory for a franchisee."""
        if territory_id not in self.territories:
            return False
        
        territory = self.territories[territory_id]
        
        if territory.status != TerritoryStatus.AVAILABLE:
            return False
        
        franchisee = self.franchisees.get(franchisee_id)
        if not franchisee:
            return False
        
        # Check tier limits
        max_territories = {
            FranchiseTier.STARTER: 1,
            FranchiseTier.FRANCHISE: 3,
            FranchiseTier.ENTERPRISE: 100
        }
        
        if len(franchisee.territories) >= max_territories[franchisee.tier]:
            return False
        
        # Claim territory
        territory.status = TerritoryStatus.CLAIMED
        territory.franchisee_id = franchisee_id
        territory.claimed_at = datetime.now()
        
        franchisee.territories.append(territory_id)
        
        return True
    
    def get_available_territories(self, country: Optional[str] = None) -> List[Territory]:
        """Get available territories."""
        territories = [t for t in self.territories.values() 
                      if t.status == TerritoryStatus.AVAILABLE]
        
        if country:
            territories = [t for t in territories if t.country == country]
        
        return territories
    
    def get_territory_stats(self) -> Dict[str, Any]:
        """Get territory statistics."""
        total = len(self.territories)
        claimed = len([t for t in self.territories.values() 
                      if t.status != TerritoryStatus.AVAILABLE])
        
        by_country = {}
        for t in self.territories.values():
            by_country[t.country] = by_country.get(t.country, 0) + 1
        
        return {
            "total_territories": total,
            "claimed": claimed,
            "available": total - claimed,
            "claim_rate": (claimed / max(1, total)) * 100,
            "by_country": by_country
        }
    
    # ═══════════════════════════════════════════════════════════
    # Revenue Sharing
    # ═══════════════════════════════════════════════════════════
    
    def record_revenue(
        self,
        franchisee_id: str,
        local_revenue: float = 0,
        saas_revenue: float = 0
    ) -> RevenueShare:
        """Record monthly revenue for a franchisee."""
        period = datetime.now().strftime("%Y-%m")
        
        franchisee = self.franchisees.get(franchisee_id)
        platform_fee = franchisee.monthly_fee if franchisee else 500
        
        record = RevenueShare(
            franchisee_id=franchisee_id,
            period=period,
            local_revenue=local_revenue,
            saas_revenue=saas_revenue,
            platform_fee=platform_fee
        )
        
        self.revenue_records.append(record)
        
        # Update franchisee stats
        if franchisee:
            franchisee.local_revenue += local_revenue
            franchisee.saas_revenue += saas_revenue
            franchisee.mrr = local_revenue + saas_revenue
        
        return record
    
    def get_hq_revenue(self) -> Dict[str, Any]:
        """Get HQ revenue from franchise fees."""
        active = [f for f in self.franchisees.values() 
                 if f.status == FranchiseStatus.ACTIVE]
        
        monthly_fees = sum(f.monthly_fee for f in active)
        annual_projection = monthly_fees * 12
        
        return {
            "active_franchisees": len(active),
            "monthly_platform_fees": f"${monthly_fees:,.0f}",
            "annual_projection": f"${annual_projection:,.0f}",
            "avg_fee_per_franchisee": f"${monthly_fees / max(1, len(active)):,.0f}"
        }
    
    def get_network_stats(self) -> Dict[str, Any]:
        """Get complete franchise network stats."""
        franchisees = list(self.franchisees.values())
        active = [f for f in franchisees if f.status == FranchiseStatus.ACTIVE]
        
        total_local = sum(f.local_revenue for f in franchisees)
        total_saas = sum(f.saas_revenue for f in franchisees)
        
        territories = self.get_territory_stats()
        hq_revenue = self.get_hq_revenue()
        
        return {
            "franchisees": {
                "total": len(franchisees),
                "active": len(active),
                "by_tier": {
                    "starter": len([f for f in franchisees if f.tier == FranchiseTier.STARTER]),
                    "franchise": len([f for f in franchisees if f.tier == FranchiseTier.FRANCHISE]),
                    "enterprise": len([f for f in franchisees if f.tier == FranchiseTier.ENTERPRISE])
                }
            },
            "territories": territories,
            "revenue": {
                "network_local_revenue": f"${total_local:,.0f}",
                "network_saas_revenue": f"${total_saas:,.0f}",
                "hq_platform_fees": hq_revenue["monthly_platform_fees"]
            }
        }
    
    def format_dashboard(self) -> str:
        """Format franchise dashboard as text."""
        stats = self.get_network_stats()
        hq = self.get_hq_revenue()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🌍 AGENCY OS - FRANCHISE NETWORK                        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║                                                           ║",
            "║  📊 FRANCHISEES                                          ║",
            f"║  Total: {stats['franchisees']['total']}    Active: {stats['franchisees']['active']}    Enterprise: {stats['franchisees']['by_tier']['enterprise']}     ║",
            "║                                                           ║",
            "║  🗺️ TERRITORIES                                          ║",
            f"║  Total: {stats['territories']['total_territories']}   Claimed: {stats['territories']['claimed']}   Available: {stats['territories']['available']}      ║",
            "║                                                           ║",
            "║  💰 HQ REVENUE                                            ║",
            f"║  Monthly: {hq['monthly_platform_fees']}                                   ║",
            f"║  Annual Projection: {hq['annual_projection']}                       ║",
            "║                                                           ║",
            "╚═══════════════════════════════════════════════════════════╝"
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    # Initialize franchise system
    system = FranchiseSystem()
    
    print("🌍 Franchise System Initialized!")
    print()
    
    # Onboarding checklist
    print("📋 Onboarding Checklist:")
    for step in system.get_onboarding_checklist()[:3]:
        print(f"   {step['step']}. {step['title']}")
    print()
    
    # Available territories
    available = system.get_available_territories()
    print(f"🗺️ Available Territories: {len(available)}")
    for t in available[:5]:
        print(f"   • {t.country} - {t.region} ({t.population}k pop)")
    print()
    
    # Network stats
    stats = system.get_network_stats()
    print("📊 Network Stats:")
    print(f"   Franchisees: {stats['franchisees']['total']}")
    print(f"   Territories: {stats['territories']['total_territories']}")
    print()
    
    # HQ Revenue
    hq = system.get_hq_revenue()
    print("💰 HQ Revenue:")
    print(f"   Active: {hq['active_franchisees']} franchisees")
    print(f"   Monthly: {hq['monthly_platform_fees']}")
    print(f"   Annual: {hq['annual_projection']}")
    print()
    
    # Dashboard
    print(system.format_dashboard())
