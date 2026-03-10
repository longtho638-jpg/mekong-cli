"""
RaaS API — MCU billing service: quota management and usage ledger per tenant.

In-memory ledger (dict-based, mirrors TaskStore singleton pattern).
Thread-safe via threading.RLock.
"""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

# Default MCU limits per plan
PLAN_LIMITS: dict[str, int] = {
    "free": 100,
    "starter": 500,
    "growth": 2000,
    "pro": 5000,
    "enterprise": 50000,
}

# MCU cost per task complexity tier
MCU_COSTS: dict[str, int] = {
    "simple": 1,
    "standard": 3,
    "complex": 5,
}
DEFAULT_MCU_COST = 1


@dataclass
class UsageEntry:
    """Single MCU usage record."""

    entry_id: str
    task_id: str
    mcu_cost: int
    balance_after: int
    timestamp: str


@dataclass
class TenantLedger:
    """Per-tenant MCU ledger."""

    tenant_id: str
    plan: str = "free"
    mcu_used: int = 0
    mcu_limit: int = PLAN_LIMITS["free"]
    history: List[UsageEntry] = field(default_factory=list)
    overage_credits: int = 0
    overage_charges_usd: float = 0.0

    @property
    def mcu_remaining(self) -> int:
        """Units remaining in current period."""
        return max(0, self.mcu_limit - self.mcu_used)

    @property
    def quota_exceeded(self) -> bool:
        """True when mcu_used >= mcu_limit."""
        return self.mcu_used >= self.mcu_limit

    @property
    def in_overage(self) -> bool:
        """True when usage exceeds plan limit."""
        return self.mcu_used > self.mcu_limit


class BillingService:
    """Thread-safe in-memory MCU billing ledger.

    Tracks per-tenant plan, usage, and history.
    Singleton via :func:`get_billing_service`.
    """

    def __init__(self) -> None:
        self._ledgers: Dict[str, TenantLedger] = {}
        self._lock = threading.RLock()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _get_or_create(self, tenant_id: str) -> TenantLedger:
        """Return existing ledger or create a new free-tier one."""
        if tenant_id not in self._ledgers:
            self._ledgers[tenant_id] = TenantLedger(tenant_id=tenant_id)
        return self._ledgers[tenant_id]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_quota(self, tenant_id: str) -> bool:
        """Return True if tenant has remaining MCU quota.

        Args:
            tenant_id: Target tenant identifier.

        Returns:
            True if quota available, False if exceeded.
        """
        with self._lock:
            ledger = self._get_or_create(tenant_id)
            if not ledger.quota_exceeded:
                return True
            # Check if tier allows overage
            from src.raas.credit_rate_limiter import get_overage_config
            overage_cfg = get_overage_config(ledger.plan)
            if overage_cfg.allow_overage:
                # Check max overage cap
                current_overage = ledger.mcu_used - ledger.mcu_limit
                if overage_cfg.max_overage_credits > 0 and current_overage >= overage_cfg.max_overage_credits:
                    return False  # Hit overage cap
                return True  # Allow overage
            return False  # Hard block

    def record_usage(self, tenant_id: str, mcu_cost: int, task_id: str) -> int:
        """Record MCU consumption for a completed task.

        Args:
            tenant_id: Target tenant identifier.
            mcu_cost: Units consumed by this task.
            task_id: Associated task identifier.

        Returns:
            Remaining MCU balance after recording.
        """
        with self._lock:
            ledger = self._get_or_create(tenant_id)
            ledger.mcu_used += mcu_cost
            # Track overage if usage exceeds limit
            if ledger.mcu_used > ledger.mcu_limit:
                from src.raas.credit_rate_limiter import get_overage_config
                overage_cfg = get_overage_config(ledger.plan)
                if overage_cfg.allow_overage:
                    new_overage = ledger.mcu_used - ledger.mcu_limit
                    ledger.overage_credits = new_overage
                    ledger.overage_charges_usd = round(
                        new_overage * overage_cfg.overage_rate_per_credit, 4
                    )
            entry = UsageEntry(
                entry_id=uuid.uuid4().hex,
                task_id=task_id,
                mcu_cost=mcu_cost,
                balance_after=ledger.mcu_remaining,
                timestamp=self._now_iso(),
            )
            ledger.history.append(entry)
            return ledger.mcu_remaining

    def get_balance(self, tenant_id: str) -> dict:
        """Return current balance and plan info for a tenant.

        Args:
            tenant_id: Target tenant identifier.

        Returns:
            Dict with plan, mcu_used, mcu_limit, mcu_remaining.
        """
        with self._lock:
            ledger = self._get_or_create(tenant_id)
            return {
                "tenant_id": tenant_id,
                "plan": ledger.plan,
                "mcu_used": ledger.mcu_used,
                "mcu_limit": ledger.mcu_limit,
                "mcu_remaining": ledger.mcu_remaining,
                "overage_credits": ledger.overage_credits,
                "overage_charges_usd": ledger.overage_charges_usd,
                "in_overage": ledger.in_overage,
            }

    def get_history(self, tenant_id: str, limit: int = 50) -> list:
        """Return recent usage entries for a tenant, newest first.

        Args:
            tenant_id: Target tenant identifier.
            limit: Max entries to return.

        Returns:
            List of usage entry dicts.
        """
        with self._lock:
            ledger = self._get_or_create(tenant_id)
            entries = ledger.history[-limit:][::-1]
            return [
                {
                    "entry_id": e.entry_id,
                    "task_id": e.task_id,
                    "mcu_cost": e.mcu_cost,
                    "balance_after": e.balance_after,
                    "timestamp": e.timestamp,
                }
                for e in entries
            ]

    def update_plan(
        self,
        tenant_id: str,
        plan: str,
        mcu_limit: Optional[int] = None,
    ) -> dict:
        """Update tenant plan and MCU limit (called from Polar webhooks).

        Args:
            tenant_id: Target tenant identifier.
            plan: New plan name (free/pro/enterprise).
            mcu_limit: Override limit; defaults to PLAN_LIMITS[plan].

        Returns:
            Updated balance dict.
        """
        with self._lock:
            ledger = self._get_or_create(tenant_id)
            ledger.plan = plan
            ledger.mcu_limit = mcu_limit or PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
            return {
                "tenant_id": tenant_id,
                "plan": ledger.plan,
                "mcu_limit": ledger.mcu_limit,
            }


# Module-level singleton
_service: Optional[BillingService] = None


def get_billing_service() -> BillingService:
    """Return the module-level BillingService singleton."""
    global _service
    if _service is None:
        _service = BillingService()
    return _service


__all__ = [
    "BillingService",
    "UsageEntry",
    "TenantLedger",
    "PLAN_LIMITS",
    "MCU_COSTS",
    "DEFAULT_MCU_COST",
    "get_billing_service",
]
