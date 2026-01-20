"""
Franchise System core logic.
"""
import logging
import uuid
from datetime import datetime

from .models import Franchisee, FranchiseStatus, FranchiseTier, Territory, TerritoryStatus

logger = logging.getLogger(__name__)

class FranchiseEngine:
    TIER_LIMITS = {FranchiseTier.STARTER: 1, FranchiseTier.FRANCHISE: 3, FranchiseTier.ENTERPRISE: 999}
    PRICING = {FranchiseTier.STARTER: 0.0, FranchiseTier.FRANCHISE: 500.0, FranchiseTier.ENTERPRISE: 2000.0}

    def __init__(self):
        self.franchisees: dict = {}
        self.territories: dict = {}

    def onboard_franchisee(self, name: str, email: str, company: str, tier: FranchiseTier) -> Franchisee:
        f = Franchisee(id=f"FR-{uuid.uuid4().hex[:6].upper()}", name=name, email=email, company=company, tier=tier, status=FranchiseStatus.ACTIVE, monthly_fee=self.PRICING.get(tier, 500.0))
        self.franchisees[f.id] = f
        return f

    def claim_territory(self, franchisee_id: str, territory_id: str) -> bool:
        if franchisee_id not in self.franchisees or territory_id not in self.territories: return False
        f, t = self.franchisees[franchisee_id], self.territories[territory_id]
        if t.status != TerritoryStatus.AVAILABLE or len(f.territories) >= self.TIER_LIMITS.get(f.tier, 1): return False
        t.status, t.franchisee_id, t.claimed_at = TerritoryStatus.CLAIMED, franchisee_id, datetime.now()
        f.territories.append(territory_id)
        return True
