"""Tests for ALGO 4 — MCU Gate (atomic check/lock/confirm/refund)."""

from __future__ import annotations

import pytest

from src.core.mcu_gate import MCUGate


@pytest.fixture
def gate():
    """Create an in-memory MCU gate for each test."""
    g = MCUGate(":memory:")
    yield g
    g.close()


class TestSeedBalance:
    def test_seed_creates_balance(self, gate: MCUGate):
        gate.seed_balance("t1", 100)
        bal = gate.get_balance("t1")
        assert bal["balance"] == 100
        assert bal["locked"] == 0
        assert bal["available"] == 100

    def test_seed_accumulates(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        gate.seed_balance("t1", 30)
        bal = gate.get_balance("t1")
        assert bal["balance"] == 80

    def test_seed_with_reason(self, gate: MCUGate):
        gate.seed_balance("t1", 200, reason="Polar Growth tier")
        assert gate.get_balance("t1")["balance"] == 200


class TestGetBalance:
    def test_unknown_tenant(self, gate: MCUGate):
        bal = gate.get_balance("nonexistent")
        assert bal["balance"] == 0
        assert bal["available"] == 0

    def test_available_accounts_for_locked(self, gate: MCUGate):
        gate.seed_balance("t1", 100)
        gate.check_and_lock("t1", "m1", 30)
        bal = gate.get_balance("t1")
        assert bal["balance"] == 100
        assert bal["locked"] == 30
        assert bal["available"] == 70


class TestCheckAndLock:
    def test_successful_lock(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        result = gate.check_and_lock("t1", "mission-1", 5)
        assert result.success is True
        assert result.locked_amount == 5
        assert len(result.lock_id) > 0

    def test_insufficient_balance(self, gate: MCUGate):
        gate.seed_balance("t1", 3)
        result = gate.check_and_lock("t1", "m1", 5)
        assert result.success is False
        assert result.error == "insufficient_mcu"
        assert result.available == 3
        assert result.required == 5

    def test_tenant_not_found(self, gate: MCUGate):
        result = gate.check_and_lock("ghost", "m1", 1)
        assert result.success is False
        assert result.error == "tenant_not_found"

    def test_lock_reduces_available(self, gate: MCUGate):
        gate.seed_balance("t1", 10)
        gate.check_and_lock("t1", "m1", 3)
        bal = gate.get_balance("t1")
        assert bal["available"] == 7
        assert bal["locked"] == 3

    def test_multiple_locks_concurrent(self, gate: MCUGate):
        gate.seed_balance("t1", 10)
        r1 = gate.check_and_lock("t1", "m1", 3)
        r2 = gate.check_and_lock("t1", "m2", 5)
        assert r1.success is True
        assert r2.success is True
        bal = gate.get_balance("t1")
        assert bal["locked"] == 8
        assert bal["available"] == 2

    def test_lock_fails_when_locked_exceeds_available(self, gate: MCUGate):
        gate.seed_balance("t1", 10)
        gate.check_and_lock("t1", "m1", 8)
        result = gate.check_and_lock("t1", "m2", 5)
        assert result.success is False
        assert result.available == 2

    def test_recharge_url_in_error(self, gate: MCUGate):
        gate.seed_balance("t1", 1)
        result = gate.check_and_lock("t1", "m1", 5)
        assert "agencyos.network/billing" in result.recharge_url
        assert "t1" in result.recharge_url


class TestConfirm:
    def test_confirm_full_amount(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        lock = gate.check_and_lock("t1", "m1", 5)
        result = gate.confirm(lock.lock_id)
        assert result.success is True
        assert result.charged == 5
        assert result.refunded == 0
        bal = gate.get_balance("t1")
        assert bal["balance"] == 45
        assert bal["locked"] == 0
        assert bal["lifetime_used"] == 5

    def test_confirm_partial_refund(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        lock = gate.check_and_lock("t1", "m1", 5)
        result = gate.confirm(lock.lock_id, actual_mcu=3)
        assert result.success is True
        assert result.charged == 3
        assert result.refunded == 2
        bal = gate.get_balance("t1")
        assert bal["balance"] == 47
        assert bal["locked"] == 0

    def test_confirm_nonexistent_lock(self, gate: MCUGate):
        result = gate.confirm("fake-lock-id")
        assert result.success is False
        assert result.error == "lock_not_found"

    def test_confirm_updates_lifetime(self, gate: MCUGate):
        gate.seed_balance("t1", 100)
        lock1 = gate.check_and_lock("t1", "m1", 3)
        gate.confirm(lock1.lock_id)
        lock2 = gate.check_and_lock("t1", "m2", 5)
        gate.confirm(lock2.lock_id)
        bal = gate.get_balance("t1")
        assert bal["lifetime_used"] == 8


class TestRefundFull:
    def test_full_refund(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        lock = gate.check_and_lock("t1", "m1", 5)
        result = gate.refund_full(lock.lock_id, reason="task_failed")
        assert result.success is True
        assert result.refunded == 5
        bal = gate.get_balance("t1")
        assert bal["balance"] == 50  # no deduction
        assert bal["locked"] == 0

    def test_refund_nonexistent_lock(self, gate: MCUGate):
        result = gate.refund_full("fake-id")
        assert result.success is False

    def test_refund_preserves_other_locks(self, gate: MCUGate):
        gate.seed_balance("t1", 50)
        lock1 = gate.check_and_lock("t1", "m1", 5)
        gate.check_and_lock("t1", "m2", 3)
        gate.refund_full(lock1.lock_id)
        bal = gate.get_balance("t1")
        assert bal["locked"] == 3  # only lock2 remains
        assert bal["balance"] == 50


class TestFullFlow:
    def test_seed_lock_confirm(self, gate: MCUGate):
        """Full happy path: seed → lock → confirm."""
        gate.seed_balance("t1", 200, "Polar Growth")
        lock = gate.check_and_lock("t1", "mission-42", 5)
        assert lock.success
        confirm = gate.confirm(lock.lock_id)
        assert confirm.success
        assert confirm.charged == 5
        bal = gate.get_balance("t1")
        assert bal["balance"] == 195
        assert bal["available"] == 195

    def test_seed_lock_fail_refund(self, gate: MCUGate):
        """Failure path: seed → lock → fail → refund."""
        gate.seed_balance("t1", 10)
        lock = gate.check_and_lock("t1", "m1", 5)
        assert lock.success
        refund = gate.refund_full(lock.lock_id, "model_crashed")
        assert refund.success
        assert refund.refunded == 5
        bal = gate.get_balance("t1")
        assert bal["balance"] == 10
        assert bal["available"] == 10

    def test_drain_balance_to_zero(self, gate: MCUGate):
        """Multiple missions drain balance exactly to 0."""
        gate.seed_balance("t1", 10)
        for i in range(2):
            lock = gate.check_and_lock("t1", f"m{i}", 5)
            assert lock.success
            gate.confirm(lock.lock_id)
        bal = gate.get_balance("t1")
        assert bal["balance"] == 0
        # Next lock should fail
        result = gate.check_and_lock("t1", "m-fail", 1)
        assert result.success is False
