"""
Account Selector - Multi-Account Quota Fallback
================================================

When one account has no quota, automatically fallback to another account.
Solves: "Account A exhausted → Switch to Account B automatically"

Usage:
    selector = AccountSelector()
    account = selector.get_best_account(model_id="claude-sonnet-4-5-thinking")
"""

import logging
import random
from dataclasses import dataclass
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class QuotaAccount:
    """Account with quota information."""

    email: str
    remaining_percent: float
    model_quotas: Dict[str, float]  # model_id -> remaining_percent
    is_active: bool = True
    priority: int = 1  # Lower = higher priority


class AccountSelector:
    """
    Selects the best account for API requests based on quota.

    Key Features:
    - Auto-fallback when account exhausted (remaining < threshold)
    - Random selection among accounts with similar quota
    - Priority-based selection for premium accounts
    """

    # Minimum quota threshold before fallback
    EXHAUSTED_THRESHOLD = 5.0  # 5%
    LOW_QUOTA_THRESHOLD = 20.0  # 20%

    def __init__(self):
        self.accounts: List[QuotaAccount] = []
        self._load_accounts()

    def _load_accounts(self):
        """Load accounts from config/environment."""
        # TODO: Load from actual config file or environment
        # For now, using mock data matching dashboard display
        self.accounts = [
            QuotaAccount(
                email="minhlong.rice@gmail.com",
                remaining_percent=100.0,
                model_quotas={
                    "claude-opus-4-5-thinking": 40.0,
                    "claude-sonnet-4-5": 40.0,
                    "claude-sonnet-4-5-thinking": 40.0,
                    "gemini-3-pro-high": 60.0,
                    "gemini-3-pro-low": 60.0,
                    "gemini-3-pro-image": 100.0,
                },
                priority=1,  # Primary account
            ),
            # Add more accounts as configured
        ]

    def get_best_account(
        self, model_id: Optional[str] = None, fallback_on_low: bool = True
    ) -> Optional[QuotaAccount]:
        """
        Get the best account for the given model.

        Args:
            model_id: Specific model to check quota for
            fallback_on_low: If True, skip accounts with low quota

        Returns:
            Best account, or None if all exhausted
        """
        if not self.accounts:
            logger.warning("No accounts configured!")
            return None

        # Filter active accounts
        active_accounts = [a for a in self.accounts if a.is_active]

        if not active_accounts:
            logger.warning("No active accounts available!")
            return None

        if model_id:
            # Filter accounts with sufficient quota for this model
            sufficient_accounts = []

            for account in active_accounts:
                model_quota = account.model_quotas.get(model_id, 0.0)

                if model_quota >= self.EXHAUSTED_THRESHOLD:
                    if fallback_on_low and model_quota < self.LOW_QUOTA_THRESHOLD:
                        # Low but not exhausted - add with lower priority
                        sufficient_accounts.append((account, model_quota, 2))
                    else:
                        sufficient_accounts.append((account, model_quota, 1))

            if not sufficient_accounts:
                logger.warning(f"All accounts exhausted for model {model_id}!")
                # Return any account as last resort (API will fail but that's expected)
                return random.choice(active_accounts)

            # Sort by priority then by quota (highest first)
            sufficient_accounts.sort(key=lambda x: (x[2], -x[1]))

            # Get accounts with same priority level
            top_priority = sufficient_accounts[0][2]
            top_accounts = [a for a, q, p in sufficient_accounts if p == top_priority]

            # Random selection among top accounts for load distribution
            selected = random.choice(top_accounts)

            logger.info(
                f"Selected account {selected.email} for {model_id} "
                f"(quota: {selected.model_quotas.get(model_id, 0):.1f}%)"
            )
            return selected

        else:
            # No specific model - select by overall remaining percent
            sorted_accounts = sorted(
                active_accounts, key=lambda a: (a.priority, -a.remaining_percent)
            )
            return sorted_accounts[0]

    def mark_exhausted(self, email: str, model_id: str):
        """Mark an account/model as exhausted after API failure."""
        for account in self.accounts:
            if account.email == email:
                account.model_quotas[model_id] = 0.0
                logger.info(f"Marked {email}/{model_id} as exhausted")
                break

    def refresh_quotas(self, quota_data: Dict[str, Dict[str, float]]):
        """
        Refresh quota data from external source.

        Args:
            quota_data: {email: {model_id: remaining_percent, ...}, ...}
        """
        for account in self.accounts:
            if account.email in quota_data:
                account.model_quotas.update(quota_data[account.email])
                # Calculate overall remaining
                if account.model_quotas:
                    account.remaining_percent = sum(account.model_quotas.values()) / len(
                        account.model_quotas
                    )
                logger.info(f"Refreshed quotas for {account.email}")

    def get_fallback_account(self, current_email: str, model_id: str) -> Optional[QuotaAccount]:
        """
        Get fallback account when current is exhausted.

        Args:
            current_email: Current exhausted account
            model_id: Model that needs quota

        Returns:
            Alternative account with quota, or None
        """
        # Mark current as exhausted for this model
        self.mark_exhausted(current_email, model_id)

        # Get next best account
        alternative = self.get_best_account(model_id, fallback_on_low=True)

        if alternative and alternative.email != current_email:
            logger.info(f"Fallback from {current_email} to {alternative.email}")
            return alternative

        logger.warning(f"No fallback available for {model_id}")
        return None


# Global singleton
_selector: Optional[AccountSelector] = None


def get_account_selector() -> AccountSelector:
    """Get or create the global account selector."""
    global _selector
    if _selector is None:
        _selector = AccountSelector()
    return _selector


# CLI Test
if __name__ == "__main__":
    selector = AccountSelector()

    print("🔄 Account Selector Test\n")

    # Test model selection
    for model in ["claude-sonnet-4-5-thinking", "gemini-3-pro-high"]:
        account = selector.get_best_account(model)
        if account:
            print(f"Model: {model}")
            print(f"  Account: {account.email}")
            print(f"  Quota: {account.model_quotas.get(model, 0):.1f}%")
            print()

    # Test fallback
    print("Testing fallback...")
    selector.mark_exhausted("minhlong.rice@gmail.com", "claude-sonnet-4-5-thinking")
    fallback = selector.get_best_account("claude-sonnet-4-5-thinking")
    if fallback:
        print(f"Fallback account: {fallback.email}")
