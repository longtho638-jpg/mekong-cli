"""
Account Manager Agent - Client Relationships & Growth
Manages account portfolio and relationship health.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class AccountTier(Enum):
    ENTERPRISE = "enterprise"
    MID_MARKET = "mid_market"
    SMB = "smb"
    STARTUP = "startup"


class AccountHealth(Enum):
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    CRITICAL = "critical"


@dataclass
class Account:
    """Client account"""
    id: str
    name: str
    company: str
    tier: AccountTier
    arr: float  # Annual Recurring Revenue
    health: AccountHealth = AccountHealth.HEALTHY
    renewal_date: Optional[datetime] = None
    last_contact: Optional[datetime] = None
    upsell_potential: float = 0.0
    notes: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def days_until_renewal(self) -> int:
        if self.renewal_date:
            return (self.renewal_date - datetime.now()).days
        return 0


class AccountManagerAgent:
    """
    Account Manager Agent - Quản lý Tài khoản
    
    Responsibilities:
    - Track account portfolio
    - Monitor relationship health
    - Identify upsell opportunities
    - Manage renewals
    """

    # ARR thresholds by tier
    TIER_THRESHOLDS = {
        AccountTier.ENTERPRISE: 50000,
        AccountTier.MID_MARKET: 20000,
        AccountTier.SMB: 5000,
        AccountTier.STARTUP: 0
    }

    def __init__(self):
        self.name = "Account Manager"
        self.status = "ready"
        self.accounts: Dict[str, Account] = {}

    def add_account(
        self,
        name: str,
        company: str,
        arr: float,
        renewal_days: int = 365
    ) -> Account:
        """Add new account"""
        account_id = f"account_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        # Determine tier based on ARR
        tier = AccountTier.STARTUP
        for t, threshold in self.TIER_THRESHOLDS.items():
            if arr >= threshold:
                tier = t
                break

        account = Account(
            id=account_id,
            name=name,
            company=company,
            tier=tier,
            arr=arr,
            renewal_date=datetime.now() + timedelta(days=renewal_days),
            last_contact=datetime.now()
        )

        self.accounts[account_id] = account
        return account

    def update_health(self, account_id: str, health: AccountHealth) -> Account:
        """Update account health"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        account = self.accounts[account_id]
        account.health = health

        return account

    def log_contact(self, account_id: str, notes: str = "") -> Account:
        """Log contact with account"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        account = self.accounts[account_id]
        account.last_contact = datetime.now()
        if notes:
            account.notes = notes

        return account

    def set_upsell(self, account_id: str, potential: float) -> Account:
        """Set upsell potential"""
        if account_id not in self.accounts:
            raise ValueError(f"Account not found: {account_id}")

        account = self.accounts[account_id]
        account.upsell_potential = potential

        return account

    def get_renewals_due(self, days: int = 90) -> List[Account]:
        """Get accounts with renewals due"""
        return [
            a for a in self.accounts.values()
            if a.renewal_date and a.days_until_renewal <= days
        ]

    def get_at_risk(self) -> List[Account]:
        """Get at-risk accounts"""
        return [a for a in self.accounts.values() if a.health in [AccountHealth.AT_RISK, AccountHealth.CRITICAL]]

    def get_stats(self) -> Dict:
        """Get portfolio statistics"""
        accounts = list(self.accounts.values())

        return {
            "total_accounts": len(accounts),
            "total_arr": sum(a.arr for a in accounts),
            "healthy": len([a for a in accounts if a.health == AccountHealth.HEALTHY]),
            "at_risk": len([a for a in accounts if a.health == AccountHealth.AT_RISK]),
            "upsell_pipeline": sum(a.upsell_potential for a in accounts),
            "renewals_90_days": len(self.get_renewals_due(90))
        }


# Demo
if __name__ == "__main__":
    agent = AccountManagerAgent()

    print("👥 Account Manager Agent Demo\n")

    # Add accounts
    a1 = agent.add_account("BigCorp", "BigCorp Inc", 75000)
    a2 = agent.add_account("MidSize Co", "MidSize Corp", 25000)
    a3 = agent.add_account("StartupX", "StartupX Ltd", 8000)

    print(f"📋 Account: {a1.company}")
    print(f"   Tier: {a1.tier.value}")
    print(f"   ARR: ${a1.arr:,.0f}")
    print(f"   Days to Renewal: {a1.days_until_renewal}")

    # Update health and upsell
    agent.update_health(a2.id, AccountHealth.AT_RISK)
    agent.set_upsell(a1.id, 25000)
    agent.set_upsell(a3.id, 5000)

    print(f"\n⚠️ At-Risk Accounts: {len(agent.get_at_risk())}")

    # Stats
    print("\n📊 Portfolio Stats:")
    stats = agent.get_stats()
    print(f"   Total ARR: ${stats['total_arr']:,.0f}")
    print(f"   Upsell Pipeline: ${stats['upsell_pipeline']:,.0f}")
    print(f"   At-Risk: {stats['at_risk']}")
