"""Hybrid LLM Router - MCU Gate (ALGO 4) - Stub for testing."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class LockResult:
    """Result của MCU lock operation."""

    is_error: bool
    lock_id: str = ""
    locked_amount: int = 0
    available: int = 0
    required: int = 0
    recharge_url: str = ""
    error: str = ""


@dataclass
class ConfirmResult:
    """Result của MCU confirm operation."""

    success: bool
    charged: int = 0
    refunded: int = 0
    error: str = ""


class MCUGate:
    """ALGO 4: MCU check/lock/confirm/refund."""

    def __init__(self):
        """Initialize MCU gate with in-memory store."""
        self._balances: dict[str, int] = {}  # tenant_id → balance
        self._locked: dict[str, int] = {}  # tenant_id → locked amount
        self._ledger: dict[str, dict] = {}  # lock_id → ledger entry

    def check_and_lock(
        self, tenant_id: str, mission_id: str, mcu_amount: int
    ) -> LockResult:
        """Check balance and lock MCU for mission.

        Args:
            tenant_id: Tenant identifier
            mission_id: Mission identifier
            mcu_amount: MCU amount to lock

        Returns:
            LockResult với lock_id nếu thành công, error nếu thất bại
        """
        # Initialize balance nếu chưa có
        if tenant_id not in self._balances:
            self._balances[tenant_id] = 100  # Default 100 MCU

        balance = self._balances.get(tenant_id, 0)
        locked = self._locked.get(tenant_id, 0)
        available = balance - locked

        if available < mcu_amount:
            return LockResult(
                is_error=True,
                available=available,
                required=mcu_amount,
                recharge_url=f"https://agencyos.network/billing?tenant={tenant_id}",
                error="insufficient_mcu",
            )

        # Create lock
        import uuid

        lock_id = str(uuid.uuid4())
        self._locked[tenant_id] = locked + mcu_amount
        self._ledger[lock_id] = {
            "tenant_id": tenant_id,
            "mission_id": mission_id,
            "amount": mcu_amount,
            "type": "lock",
            "status": "pending",
        }

        return LockResult(
            is_error=False,
            lock_id=lock_id,
            locked_amount=mcu_amount,
        )

    def confirm(
        self, lock_id: str, actual_tokens_used: int, model_config: object
    ) -> ConfirmResult:
        """Confirm MCU deduction after task completion.

        Args:
            lock_id: Lock identifier
            actual_tokens_used: Actual tokens consumed
            model_config: Model config for cost calculation

        Returns:
            ConfirmResult với charged/refunded amounts
        """
        if lock_id not in self._ledger:
            return ConfirmResult(
                success=False,
                error="lock_not_found",
            )

        ledger_entry = self._ledger[lock_id]
        tenant_id = ledger_entry["tenant_id"]
        locked_amount = ledger_entry["amount"]

        # Simple: charge full locked amount
        actual_mcu = locked_amount

        # Update balance
        self._balances[tenant_id] -= actual_mcu
        self._locked[tenant_id] -= locked_amount

        # Update ledger
        self._ledger[lock_id]["status"] = "confirmed"

        refund = 0
        if actual_mcu < locked_amount:
            refund = locked_amount - actual_mcu

        return ConfirmResult(
            success=True,
            charged=actual_mcu,
            refunded=refund,
        )

    def refund_full(self, lock_id: str, reason: str) -> ConfirmResult:
        """Refund full MCU amount (mission failed).

        Args:
            lock_id: Lock identifier
            reason: Reason for refund

        Returns:
            ConfirmResult
        """
        if lock_id not in self._ledger:
            return ConfirmResult(
                success=False,
                error="lock_not_found",
            )

        ledger_entry = self._ledger[lock_id]
        tenant_id = ledger_entry["tenant_id"]
        locked_amount = ledger_entry["amount"]

        # Release lock
        self._locked[tenant_id] = max(0, self._locked.get(tenant_id, 0) - locked_amount)

        # Update ledger
        self._ledger[lock_id]["status"] = "cancelled"

        return ConfirmResult(
            success=True,
            refunded=locked_amount,
        )

    def get_balance(self, tenant_id: str) -> dict[str, int]:
        """Get tenant balance info."""
        return {
            "balance": self._balances.get(tenant_id, 0),
            "locked": self._locked.get(tenant_id, 0),
            "available": self._balances.get(tenant_id, 0)
            - self._locked.get(tenant_id, 0),
        }

    def seed_balance(self, tenant_id: str, amount: int) -> None:
        """Seed initial balance for tenant."""
        self._balances[tenant_id] = amount
