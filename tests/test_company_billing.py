"""Tests for company_billing.py — /company billing backend."""

import json
import tempfile
from pathlib import Path


from src.core.company_billing import (
    BillingStatus,
    MCU_PACKS,
    TIER_PRICE,
    get_billing_status,
    get_history,
    get_tenants,
    get_topup_info,
    reconcile,
)
from src.core.mcu_gate import MCUGate


def _setup_gate_with_tenant(tenant_id="t1", balance=500) -> MCUGate:
    gate = MCUGate(":memory:")
    gate.seed_balance(tenant_id, balance, reason="test_seed")
    return gate


def _make_company_dir(tmpdir: str, balance=100, tier="starter") -> Path:
    base = Path(tmpdir)
    mekong = base / ".mekong"
    mekong.mkdir(parents=True)

    company = {"company_name": "TestCorp", "product_type": "saas"}
    (mekong / "company.json").write_text(json.dumps(company))

    bal = {"balance": balance, "locked": 0, "lifetime_used": 50, "tier": tier}
    (mekong / "mcu_balance.json").write_text(json.dumps(bal))

    return base


class TestGetBillingStatus:
    def test_status_from_gate(self):
        gate = _setup_gate_with_tenant("t1", 500)
        status = get_billing_status(mcu_gate=gate, tenant_id="t1")
        assert isinstance(status, BillingStatus)
        assert status.balance == 500
        assert status.locked == 0

    def test_status_from_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _make_company_dir(tmpdir, balance=200)
            status = get_billing_status(base_dir=tmpdir)
            assert status.company_name == "TestCorp"
            assert status.balance == 200

    def test_low_balance_flag(self):
        gate = _setup_gate_with_tenant("t1", 30)
        status = get_billing_status(mcu_gate=gate, tenant_id="t1")
        assert status.low_balance is True

    def test_high_balance_no_flag(self):
        gate = _setup_gate_with_tenant("t1", 500)
        status = get_billing_status(mcu_gate=gate, tenant_id="t1")
        assert status.low_balance is False

    def test_missing_company_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            status = get_billing_status(base_dir=tmpdir)
            assert status.company_name == "Unknown"
            assert status.balance == 0


class TestGetHistory:
    def test_history_from_gate(self):
        gate = _setup_gate_with_tenant("t1", 100)
        gate.seed_balance("t1", 50, reason="topup")
        entries = get_history(mcu_gate=gate, tenant_id="t1")
        assert len(entries) == 2
        assert entries[0]["type"] == "seed"

    def test_history_limit(self):
        gate = _setup_gate_with_tenant("t1", 10)
        for i in range(5):
            gate.seed_balance("t1", 10, reason=f"seed_{i}")
        entries = get_history(mcu_gate=gate, tenant_id="t1", limit=3)
        assert len(entries) == 3

    def test_history_from_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir) / ".mekong"
            base.mkdir()
            ledger = [
                {"type": "seed", "amount": 100, "created_at": "2026-03-10"},
                {"type": "confirm", "amount": -5, "created_at": "2026-03-10"},
            ]
            (base / "mcu_ledger.json").write_text(json.dumps(ledger))
            entries = get_history(base_dir=tmpdir)
            assert len(entries) == 2

    def test_history_empty(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            entries = get_history(base_dir=tmpdir)
            assert entries == []


class TestGetTopupInfo:
    def test_valid_500(self):
        info = get_topup_info(500)
        assert info["amount"] == 500
        assert info["price"] == 24.50
        assert "checkout_url" in info

    def test_valid_2000(self):
        info = get_topup_info(2000)
        assert info["price"] == 90.00
        assert info["discount"] == "8%"

    def test_valid_5000(self):
        info = get_topup_info(5000)
        assert info["price"] == 200.00
        assert info["discount"] == "18%"

    def test_invalid_amount(self):
        info = get_topup_info(999)
        assert "error" in info


class TestGetTenants:
    def test_single_tenant(self):
        gate = _setup_gate_with_tenant("acme", 500)
        tenants = get_tenants(gate)
        assert len(tenants) == 1
        assert tenants[0]["tenant_id"] == "acme"

    def test_multiple_tenants(self):
        gate = MCUGate(":memory:")
        gate.seed_balance("a", 100, reason="init")
        gate.seed_balance("b", 500, reason="init")
        tenants = get_tenants(gate)
        assert len(tenants) == 2

    def test_sort_by_usage(self):
        gate = MCUGate(":memory:")
        gate.seed_balance("low", 50, reason="init")
        gate.seed_balance("high", 1000, reason="init")
        # Simulate usage for "high"
        lock = gate.check_and_lock("high", "m1", 200)
        gate.confirm(lock.lock_id)
        tenants = get_tenants(gate, sort_by="usage")
        assert tenants[0]["tenant_id"] == "high"

    def test_empty(self):
        gate = MCUGate(":memory:")
        tenants = get_tenants(gate)
        assert tenants == []


class TestReconcile:
    def test_reconcile_with_gate(self):
        gate = _setup_gate_with_tenant("t1", 100)
        gate.seed_balance("t1", 200, reason="topup")
        report = reconcile(mcu_gate=gate, tenant_id="t1")
        assert report["mcu_sold"] == 300  # 100 + 200
        assert report["seed_count"] == 2
        assert report["expected_revenue"] > 0

    def test_reconcile_zero_revenue(self):
        gate = MCUGate(":memory:")
        gate.seed_balance("t1", 0, reason="free")
        report = reconcile(mcu_gate=gate, tenant_id="t1")
        assert report["mcu_sold"] == 0
        assert report["status"] == "reconciled"

    def test_reconcile_saves_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir) / ".mekong"
            base.mkdir()
            gate = _setup_gate_with_tenant("t1", 100)
            reconcile(base_dir=tmpdir, mcu_gate=gate, tenant_id="t1")
            reconcile_files = list(base.glob("reconcile-*.json"))
            assert len(reconcile_files) == 1

    def test_reconcile_with_recorded_revenue(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir) / ".mekong"
            base.mkdir()
            revenue = {"total_revenue": 4.90}
            (base / "revenue.json").write_text(json.dumps(revenue))
            gate = _setup_gate_with_tenant("t1", 100)
            report = reconcile(base_dir=tmpdir, mcu_gate=gate, tenant_id="t1")
            assert report["recorded_revenue"] == 4.90

    def test_reconcile_discrepancy(self):
        gate = _setup_gate_with_tenant("t1", 1000)
        report = reconcile(mcu_gate=gate, tenant_id="t1")
        # No recorded revenue file → discrepancy
        assert report["status"] == "discrepancy_found"
        assert report["discrepancy"] > 0


class TestConstants:
    def test_mcu_packs_keys(self):
        assert set(MCU_PACKS.keys()) == {500, 2000, 5000}

    def test_tier_prices(self):
        assert TIER_PRICE["starter"] == 49
        assert TIER_PRICE["growth"] == 149
        assert TIER_PRICE["premium"] == 499
