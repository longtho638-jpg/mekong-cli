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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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


class AccountError(Exception):
    """Base exception for AccountManager operations."""
    pass


@dataclass
class Account:
    """A client account entity."""
    id: str
    name: str
    tier: AccountTier
    status: AccountStatus
    mrr: float
    contract_end: datetime
    account_manager: str
    _health_score: int = 80
    last_contact: datetime = field(default_factory=datetime.now)
    notes: List[str] = field(default_factory=list)

    @property
    def health_score(self) -> int:
        return self._health_score

    @health_score.setter
    def health_score(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("Health score must be between 0 and 100")
        self._health_score = value

    @property
    def days_until_renewal(self) -> int:
        """Calculate days remaining until contract renewal."""
        return (self.contract_end - datetime.now()).days


@dataclass
class AccountPlan:
    """Account strategic plan entity."""
    account_id: str
    goals: List[str]
    expansion_opportunities: List[str]
    risks: List[str]
    next_actions: List[str]


class AccountManager:
    """
    Account Manager System.
    
    Manages client relationships, tracks health scores, and generates dashboards.
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
        """
        Add a new client account to the system.

        Args:
            name: Client name.
            tier: Account tier (Starter, Business, Enterprise).
            mrr: Monthly Recurring Revenue.
            account_manager: Name of the AM.
            contract_months: Duration of contract in months.

        Returns:
            Account: The created account object.

        Raises:
            AccountError: If validation fails.
        """
        try:
            if mrr < 0:
                raise ValueError("MRR cannot be negative")

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
            logger.info(f"Account added: {name} ({account.id})")
            return account
        except ValueError as e:
            logger.error(f"Failed to add account {name}: {str(e)}")
            raise AccountError(f"Validation error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error adding account {name}: {str(e)}")
            raise AccountError(f"System error: {str(e)}")
    
    def create_account_plan(
        self,
        account: Account,
        goals: List[str],
        opportunities: List[str],
        risks: List[str]
    ) -> AccountPlan:
        """Create a strategic plan for an account."""
        if account.id not in self.accounts:
            raise AccountError(f"Account ID {account.id} not found")

        try:
            plan = AccountPlan(
                account_id=account.id,
                goals=goals,
                expansion_opportunities=opportunities,
                risks=risks,
                next_actions=["Schedule QBR", "Review contract terms"]
            )
            self.plans[account.id] = plan
            logger.info(f"Plan created for account: {account.name}")
            return plan
        except Exception as e:
            logger.error(f"Failed to create plan for {account.name}: {str(e)}")
            raise AccountError(f"Could not create plan: {str(e)}")
    
    def get_renewals_due(self, days: int = 90) -> List[Account]:
        """Get list of accounts with renewals due within 'days'."""
        cutoff = datetime.now() + timedelta(days=days)
        return [a for a in self.accounts.values() if a.contract_end <= cutoff]
    
    def get_at_risk(self) -> List[Account]:
        """Get list of accounts with health score < 60."""
        return [a for a in self.accounts.values() if a.health_score < 60]
    
    def format_dashboard(self) -> str:
        """
        Render the Account Manager text-based dashboard.
        """
        total_mrr = sum(a.mrr for a in self.accounts.values())
        at_risk_count = len(self.get_at_risk())
        renewals_count = len(self.get_renewals_due(90))
        account_count = len(self.accounts)
        
        # --- UI Components ---
        separator = "╠" + "═" * 59 + "╣"
        header_top = "╔" + "═" * 59 + "╗"
        footer_bottom = "╚" + "═" * 59 + "╝"
        
        tier_icons = {
            AccountTier.ENTERPRISE: "👑", 
            AccountTier.BUSINESS: "💼", 
            AccountTier.STARTER: "🌱"
        }
        status_icons = {
            AccountStatus.ACTIVE: "🟢", 
            AccountStatus.AT_RISK: "🟠", 
            AccountStatus.CHURNED: "🔴", 
            AccountStatus.EXPANSION: "💎"
        }
        
        # --- Build Dashboard ---
        lines = [
            header_top,
            f"║  👤 ACCOUNT MANAGER{' ' * 40}║",
            f"║  {account_count} accounts │ ${total_mrr:,.0f} MRR │ {at_risk_count} at-risk{' ' * (22 - len(str(total_mrr)) - len(str(at_risk_count)))}║",
            separator,
            "║  📊 ACCOUNT PORTFOLIO                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Sort by MRR descending, top 5
        top_accounts = sorted(self.accounts.values(), key=lambda x: x.mrr, reverse=True)[:5]
        
        for acc in top_accounts:
            t_icon = tier_icons.get(acc.tier, "📦")
            s_icon = status_icons.get(acc.status, "⚪")
            name_display = (acc.name[:20] + '..') if len(acc.name) > 20 else acc.name
            
            # Formatted row
            row_content = f"{s_icon} {t_icon} {name_display:<22} │ ${acc.mrr:>7,.0f} │ {acc.health_score:>3}%"
            lines.append(f"║  {row_content:<57}║")
        
        lines.extend([
            "║                                                           ║",
            f"║  ⚠️ RENEWALS DUE (90 days): {renewals_count:<28}║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for acc in self.get_renewals_due(90)[:3]:
            name_display = (acc.name[:25] + '..') if len(acc.name) > 25 else acc.name
            row_content = f"📅 {name_display:<27} │ {acc.days_until_renewal:>3} days"
            lines.append(f"║    {row_content:<55}║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Account Plan]  [📞 Log Activity]  [📊 QBR Prep]      ║",
            separator,
            f"║  🏯 {self.agency_name[:40]:<40} - Relationship first!  ║",
            footer_bottom,
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    am = AccountManager("Saigon Digital Hub")
    
    print("👤 Initializing Account Manager...")
    print("=" * 60)
    
    try:
        # Add accounts
        a1 = am.add_account("Sunrise Realty", AccountTier.ENTERPRISE, 5000, "Alex")
        a2 = am.add_account("Coffee Lab", AccountTier.BUSINESS, 2500, "Sarah")
        a3 = am.add_account("Tech Startup VN", AccountTier.BUSINESS, 3000, "Alex")
        a4 = am.add_account("Fashion Brand", AccountTier.STARTER, 1500, "Sarah", contract_months=3)
        
        # Mark one at risk
        try:
            a4.health_score = 45 # Valid
            a4.status = AccountStatus.AT_RISK
            # a4.health_score = 150 # Would raise ValueError
        except ValueError as e:
            logger.error(f"Health score error: {e}")
        
        # Create plan
        am.create_account_plan(
            a1, 
            goals=["Expand SEO services", "Add PPC"],
            opportunities=["Content marketing", "Social media"],
            risks=["Budget constraints", "Slow approval"]
        )
        
        print("\n" + am.format_dashboard())
        
    except AccountError as e:
        print(f"❌ Application Error: {e}")
