"""
👤 Account Manager - Client Relationship Management
=====================================================

Manage client accounts and relationships.
Be the trusted advisor for every client!

Roles:
- Relationship building
- Account planning
- Upselling/Cross-selling
- Renewal management
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class AccountStatus(Enum):
    """Account status."""
    ACTIVE = "active"
    AT_RISK = "at_risk"
    CHURNED = "churned"
    EXPANSION = "expansion"


class AccountTier(Enum):
    """Account tier."""
    ENTERPRISE = "enterprise"
    BUSINESS = "business"
    STARTER = "starter"


@dataclass
class Account:
    """A client account."""
    id: str
    name: str
    tier: AccountTier
    status: AccountStatus
    mrr: float
    contract_end: datetime
    account_manager: str
    health_score: int = 80
    last_contact: datetime = field(default_factory=datetime.now)
    notes: List[str] = field(default_factory=list)


@dataclass
class AccountPlan:
    """Account strategic plan."""
    account_id: str
    goals: List[str]
    expansion_opportunities: List[str]
    risks: List[str]
    next_actions: List[str]


class AccountManager:
    """
    Account Manager System.
    
    Manage client relationships.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.accounts: Dict[str, Account] = {}
        self.plans: Dict[str, AccountPlan] = {}
    
    def add_account(
        self,
        name: str,
        tier: AccountTier,
        mrr: float,
        account_manager: str,
        contract_months: int = 12
    ) -> Account:
        """Add a client account."""
        account = Account(
            id=f"ACC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            tier=tier,
            status=AccountStatus.ACTIVE,
            mrr=mrr,
            contract_end=datetime.now() + timedelta(days=contract_months * 30),
            account_manager=account_manager
        )
        self.accounts[account.id] = account
        return account
    
    def create_account_plan(
        self,
        account: Account,
        goals: List[str],
        opportunities: List[str],
        risks: List[str]
    ) -> AccountPlan:
        """Create account strategic plan."""
        plan = AccountPlan(
            account_id=account.id,
            goals=goals,
            expansion_opportunities=opportunities,
            risks=risks,
            next_actions=["Schedule QBR", "Review contract terms"]
        )
        self.plans[account.id] = plan
        return plan
    
    def get_renewals_due(self, days: int = 90) -> List[Account]:
        """Get accounts with renewals due."""
        cutoff = datetime.now() + timedelta(days=days)
        return [a for a in self.accounts.values() if a.contract_end <= cutoff]
    
    def get_at_risk(self) -> List[Account]:
        """Get at-risk accounts."""
        return [a for a in self.accounts.values() if a.health_score < 60]
    
    def format_dashboard(self) -> str:
        """Format account manager dashboard."""
        total_mrr = sum(a.mrr for a in self.accounts.values())
        at_risk = len(self.get_at_risk())
        renewals = len(self.get_renewals_due(90))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👤 ACCOUNT MANAGER                                       ║",
            f"║  {len(self.accounts)} accounts │ ${total_mrr:,.0f} MRR │ {at_risk} at-risk       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 ACCOUNT PORTFOLIO                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        tier_icons = {"enterprise": "👑", "business": "💼", "starter": "🌱"}
        status_icons = {"active": "🟢", "at_risk": "🟠", "churned": "🔴", "expansion": "💎"}
        
        for account in sorted(self.accounts.values(), key=lambda x: x.mrr, reverse=True)[:5]:
            tier_icon = tier_icons.get(account.tier.value, "📦")
            status_icon = status_icons.get(account.status.value, "⚪")
            
            lines.append(f"║  {status_icon} {tier_icon} {account.name[:20]:<20} │ ${account.mrr:>8,.0f} │ {account.health_score}%  ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  ⚠️ RENEWALS DUE (90 days): {renewals}                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for account in self.get_renewals_due(90)[:3]:
            days_left = (account.contract_end - datetime.now()).days
            lines.append(f"║    📅 {account.name[:25]:<25} │ {days_left} days     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Account Plan]  [📞 Log Activity]  [📊 QBR Prep]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Relationship first!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    am = AccountManager("Saigon Digital Hub")
    
    print("👤 Account Manager")
    print("=" * 60)
    print()
    
    # Add accounts
    a1 = am.add_account("Sunrise Realty", AccountTier.ENTERPRISE, 5000, "Alex")
    a2 = am.add_account("Coffee Lab", AccountTier.BUSINESS, 2500, "Sarah")
    a3 = am.add_account("Tech Startup VN", AccountTier.BUSINESS, 3000, "Alex")
    a4 = am.add_account("Fashion Brand", AccountTier.STARTER, 1500, "Sarah", 3)  # Short contract
    
    # Mark one at risk
    a4.health_score = 45
    a4.status = AccountStatus.AT_RISK
    
    # Create plan
    am.create_account_plan(a1, 
        ["Expand SEO services", "Add PPC"],
        ["Content marketing", "Social media"],
        ["Budget constraints", "Slow approval"])
    
    print(am.format_dashboard())
