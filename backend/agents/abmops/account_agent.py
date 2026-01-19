"""
Account Agent - Target Account Management
Manages target accounts, tiers, and ICP scoring.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List


class AccountTier(Enum):
    TIER_1 = "tier_1"  # Strategic
    TIER_2 = "tier_2"  # Priority
    TIER_3 = "tier_3"  # Scale


class AccountStage(Enum):
    IDENTIFIED = "identified"
    ENGAGED = "engaged"
    QUALIFIED = "qualified"
    OPPORTUNITY = "opportunity"
    CUSTOMER = "customer"


@dataclass
class Account:
    """Target account"""

    id: str
    name: str
    industry: str
    tier: AccountTier
    stage: AccountStage = AccountStage.IDENTIFIED
    icp_score: float = 0
    contacts: int = 0
    annual_revenue: str = ""
    employees: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class AccountAgent:
    """
    Account Agent - Quản lý Tài khoản Mục tiêu

    Responsibilities:
    - Target accounts
    - Account tiers
    - ICP scoring
    - Pipeline tracking
    """

    def __init__(self):
        self.name = "Account"
        self.status = "ready"
        self.accounts: Dict[str, Account] = {}

    def add_account(
        self,
        name: str,
        industry: str,
        tier: AccountTier,
        annual_revenue: str = "",
        employees: int = 0,
    ) -> Account:
        """Add target account"""
        account_id = f"acc_{random.randint(100, 999)}"

        account = Account(
            id=account_id,
            name=name,
            industry=industry,
            tier=tier,
            annual_revenue=annual_revenue,
            employees=employees,
        )

        self.accounts[account_id] = account
        return account

    def score_account(self, account_id: str, score: float) -> Account:
        """Score account ICP fit"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        self.accounts[account_id].icp_score = score
        return self.accounts[account_id]

    def update_stage(self, account_id: str, stage: AccountStage) -> Account:
        """Update account stage"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        self.accounts[account_id].stage = stage
        return self.accounts[account_id]

    def add_contacts(self, account_id: str, count: int) -> Account:
        """Add contacts to account"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        self.accounts[account_id].contacts += count
        return self.accounts[account_id]

    def get_by_tier(self, tier: AccountTier) -> List[Account]:
        """Get accounts by tier"""
        return [a for a in self.accounts.values() if a.tier == tier]

    def get_stats(self) -> Dict:
        """Get account statistics"""
        accounts = list(self.accounts.values())

        return {
            "total_accounts": len(accounts),
            "tier_1": len(self.get_by_tier(AccountTier.TIER_1)),
            "tier_2": len(self.get_by_tier(AccountTier.TIER_2)),
            "tier_3": len(self.get_by_tier(AccountTier.TIER_3)),
            "avg_icp_score": sum(a.icp_score for a in accounts) / len(accounts) if accounts else 0,
            "total_contacts": sum(a.contacts for a in accounts),
        }


# Demo
if __name__ == "__main__":
    agent = AccountAgent()

    print("🎯 Account Agent Demo\n")

    # Add accounts
    a1 = agent.add_account("Acme Corp", "Technology", AccountTier.TIER_1, "$50M", 500)
    a2 = agent.add_account("GlobalTech", "SaaS", AccountTier.TIER_1, "$100M", 1000)
    a3 = agent.add_account("StartupX", "Technology", AccountTier.TIER_2, "$10M", 50)

    print(f"📋 Account: {a1.name}")
    print(f"   Industry: {a1.industry}")
    print(f"   Tier: {a1.tier.value}")
    print(f"   Revenue: {a1.annual_revenue}")

    # Score and engage
    agent.score_account(a1.id, 85)
    agent.add_contacts(a1.id, 5)
    agent.update_stage(a1.id, AccountStage.ENGAGED)

    print(f"\n📊 ICP Score: {a1.icp_score}")
    print(f"   Contacts: {a1.contacts}")
    print(f"   Stage: {a1.stage.value}")

    # Stats
    stats = agent.get_stats()
    print("\n📈 Stats:")
    print(f"   Total: {stats['total_accounts']}")
    print(f"   Tier 1: {stats['tier_1']}")
