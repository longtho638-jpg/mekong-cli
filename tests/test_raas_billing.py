"""Tests for RaaS billing service — MCU quota, usage ledger, plan management."""
from __future__ import annotations

import pytest

from src.api.raas_billing_service import (
    BillingService,
    PLAN_LIMITS,
    MCU_COSTS,
    TenantLedger,
)


class TestBillingService:
    """BillingService quota + usage tracking."""

    def setup_method(self) -> None:
        self.svc = BillingService()

    def test_new_tenant_has_free_quota(self) -> None:
        assert self.svc.check_quota("new-t") is True
        balance = self.svc.get_balance("new-t")
        assert balance["plan"] == "free"
        assert balance["mcu_limit"] == PLAN_LIMITS["free"]
        assert balance["mcu_used"] == 0
        assert balance["mcu_remaining"] == PLAN_LIMITS["free"]

    def test_record_usage_decrements_balance(self) -> None:
        remaining = self.svc.record_usage("t1", mcu_cost=10, task_id="task-1")
        assert remaining == PLAN_LIMITS["free"] - 10
        balance = self.svc.get_balance("t1")
        assert balance["mcu_used"] == 10

    def test_quota_exceeded_blocks(self) -> None:
        limit = PLAN_LIMITS["free"]
        self.svc.record_usage("t1", mcu_cost=limit, task_id="task-big")
        assert self.svc.check_quota("t1") is False
        balance = self.svc.get_balance("t1")
        assert balance["mcu_remaining"] == 0

    def test_usage_history_recorded(self) -> None:
        self.svc.record_usage("t1", mcu_cost=5, task_id="task-a")
        self.svc.record_usage("t1", mcu_cost=3, task_id="task-b")
        history = self.svc.get_history("t1")
        assert len(history) == 2
        # newest first
        assert history[0]["task_id"] == "task-b"
        assert history[1]["task_id"] == "task-a"

    def test_update_plan_changes_limits(self) -> None:
        result = self.svc.update_plan("t1", plan="pro")
        assert result["plan"] == "pro"
        assert result["mcu_limit"] == PLAN_LIMITS["pro"]
        balance = self.svc.get_balance("t1")
        assert balance["mcu_limit"] == PLAN_LIMITS["pro"]

    def test_update_plan_custom_limit(self) -> None:
        self.svc.update_plan("t1", plan="enterprise", mcu_limit=99999)
        balance = self.svc.get_balance("t1")
        assert balance["mcu_limit"] == 99999

    def test_pro_plan_has_higher_limit(self) -> None:
        assert PLAN_LIMITS["pro"] > PLAN_LIMITS["free"]
        assert PLAN_LIMITS["enterprise"] > PLAN_LIMITS["pro"]

    def test_multiple_tenants_independent(self) -> None:
        self.svc.record_usage("t1", mcu_cost=50, task_id="x")
        self.svc.record_usage("t2", mcu_cost=10, task_id="y")
        b1 = self.svc.get_balance("t1")
        b2 = self.svc.get_balance("t2")
        assert b1["mcu_used"] == 50
        assert b2["mcu_used"] == 10


class TestTenantLedger:
    """TenantLedger dataclass properties."""

    def test_remaining_calculation(self) -> None:
        ledger = TenantLedger(tenant_id="t1", mcu_used=30, mcu_limit=100)
        assert ledger.mcu_remaining == 70

    def test_quota_exceeded_flag(self) -> None:
        ledger = TenantLedger(tenant_id="t1", mcu_used=100, mcu_limit=100)
        assert ledger.quota_exceeded is True

    def test_remaining_never_negative(self) -> None:
        ledger = TenantLedger(tenant_id="t1", mcu_used=200, mcu_limit=100)
        assert ledger.mcu_remaining == 0


class TestMCUCosts:
    """MCU cost tier definitions."""

    def test_cost_tiers_defined(self) -> None:
        assert "simple" in MCU_COSTS
        assert "standard" in MCU_COSTS
        assert "complex" in MCU_COSTS

    def test_cost_ordering(self) -> None:
        assert MCU_COSTS["simple"] < MCU_COSTS["standard"]
        assert MCU_COSTS["standard"] < MCU_COSTS["complex"]
