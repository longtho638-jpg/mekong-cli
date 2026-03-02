"""Tests for CreditMeter — credit metering middleware for RaaS PEV pipeline.

Covers: check_balance enforcement, record_usage persistence, get_usage_summary
aggregation (daily/monthly), list_events retrieval, and error edge cases.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.credits import CreditStore
from src.raas.credit_metering_middleware import (
    TASK_COSTS,
    CreditMeter,
    InsufficientCreditsError,
    UsageEvent,
    UsageSummary,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    """Isolated SQLite DB file per test."""
    return tmp_path / "test_metering.db"


@pytest.fixture()
def meter(db_path: Path) -> CreditMeter:
    """CreditMeter backed by an isolated temp DB."""
    return CreditMeter(db_path=db_path)


@pytest.fixture()
def credit_store(db_path: Path) -> CreditStore:
    """CreditStore sharing the same isolated temp DB."""
    return CreditStore(db_path=db_path)


@pytest.fixture()
def funded_tenant(credit_store: CreditStore) -> str:
    """A tenant pre-loaded with 100 credits."""
    tenant_id = "tenant-test-001"
    credit_store.add(tenant_id, 100, reason="test setup")
    return tenant_id


# ---------------------------------------------------------------------------
# Test 1: check_balance passes when tenant has sufficient credits
# ---------------------------------------------------------------------------


def test_check_balance_passes_with_sufficient_credits(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """check_balance should not raise when balance >= task cost."""
    # execute_llm costs 2 credits; tenant has 100
    meter.check_balance(funded_tenant, "execute_llm")  # must not raise


# ---------------------------------------------------------------------------
# Test 2: check_balance raises InsufficientCreditsError when balance too low
# ---------------------------------------------------------------------------


def test_check_balance_raises_when_insufficient(
    meter: CreditMeter, db_path: Path
) -> None:
    """check_balance should raise InsufficientCreditsError for broke tenant."""
    broke_tenant = "tenant-broke-001"
    # No credits added → balance == 0; cook_complex costs 5
    with pytest.raises(InsufficientCreditsError) as exc_info:
        meter.check_balance(broke_tenant, "cook_complex")

    err = exc_info.value
    assert err.tenant_id == broke_tenant
    assert err.required == TASK_COSTS["cook_complex"]
    assert err.available == 0


# ---------------------------------------------------------------------------
# Test 3: check_balance raises ValueError for unknown task type
# ---------------------------------------------------------------------------


def test_check_balance_raises_for_unknown_task_type(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """check_balance should raise ValueError when task type is not in TASK_COSTS."""
    with pytest.raises(ValueError, match="Unknown task type"):
        meter.check_balance(funded_tenant, "nonexistent_task")


# ---------------------------------------------------------------------------
# Test 4: record_usage persists a usage event correctly
# ---------------------------------------------------------------------------


def test_record_usage_persists_event(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """record_usage should insert a retrievable UsageEvent into the DB."""
    event = meter.record_usage(
        tenant_id=funded_tenant,
        task_type="execute_llm",
        credits_used=2,
        mission_id="mission-abc",
    )

    assert isinstance(event, UsageEvent)
    assert event.tenant_id == funded_tenant
    assert event.task_type == "execute_llm"
    assert event.credits_used == 2
    assert event.mission_id == "mission-abc"
    assert event.id  # non-empty UUID string
    assert event.timestamp  # non-empty ISO timestamp

    # Verify the event is retrievable
    events = meter.list_events(funded_tenant)
    assert len(events) == 1
    assert events[0].id == event.id


# ---------------------------------------------------------------------------
# Test 5: record_usage works without mission_id (optional field)
# ---------------------------------------------------------------------------


def test_record_usage_without_mission_id(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """record_usage should accept None mission_id (pipeline-level usage)."""
    event = meter.record_usage(
        tenant_id=funded_tenant,
        task_type="plan",
        credits_used=1,
    )
    assert event.mission_id is None
    events = meter.list_events(funded_tenant)
    assert any(e.id == event.id for e in events)


# ---------------------------------------------------------------------------
# Test 6: get_usage_summary aggregates daily totals correctly
# ---------------------------------------------------------------------------


def test_get_usage_summary_daily_aggregation(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """get_usage_summary daily should sum credits per task_type for today."""
    meter.record_usage(funded_tenant, "plan", 1)
    meter.record_usage(funded_tenant, "execute_llm", 2)
    meter.record_usage(funded_tenant, "execute_llm", 2)
    meter.record_usage(funded_tenant, "verify", 1)

    summary = meter.get_usage_summary(funded_tenant, period="daily")

    assert isinstance(summary, UsageSummary)
    assert summary.tenant_id == funded_tenant
    assert summary.period == "daily"
    assert summary.total_credits_used == 6  # 1+2+2+1
    assert summary.event_count == 4
    assert summary.breakdown["plan"] == 1
    assert summary.breakdown["execute_llm"] == 4
    assert summary.breakdown["verify"] == 1


# ---------------------------------------------------------------------------
# Test 7: get_usage_summary monthly period is accepted
# ---------------------------------------------------------------------------


def test_get_usage_summary_monthly_period(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """get_usage_summary should return a valid UsageSummary for monthly period."""
    meter.record_usage(funded_tenant, "cook_standard", 3)

    summary = meter.get_usage_summary(funded_tenant, period="monthly")

    assert summary.period == "monthly"
    assert summary.total_credits_used == 3
    assert summary.breakdown["cook_standard"] == 3


# ---------------------------------------------------------------------------
# Test 8: get_usage_summary raises ValueError for invalid period
# ---------------------------------------------------------------------------


def test_get_usage_summary_raises_for_invalid_period(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """get_usage_summary should raise ValueError for unsupported period values."""
    with pytest.raises(ValueError, match="period must be"):
        meter.get_usage_summary(funded_tenant, period="weekly")


# ---------------------------------------------------------------------------
# Test 9: get_usage_summary returns zeros for tenant with no events
# ---------------------------------------------------------------------------


def test_get_usage_summary_empty_for_new_tenant(
    meter: CreditMeter,
) -> None:
    """get_usage_summary should return zero totals for a tenant with no events."""
    summary = meter.get_usage_summary("tenant-new-999", period="daily")
    assert summary.total_credits_used == 0
    assert summary.event_count == 0
    assert summary.breakdown == {}


# ---------------------------------------------------------------------------
# Test 10: list_events returns events newest-first and respects limit
# ---------------------------------------------------------------------------


def test_list_events_order_and_limit(
    meter: CreditMeter, funded_tenant: str
) -> None:
    """list_events should return events ordered by timestamp DESC and honour limit."""
    for task in ["plan", "execute_shell", "verify"]:
        meter.record_usage(funded_tenant, task, TASK_COSTS[task])

    events = meter.list_events(funded_tenant, limit=2)
    assert len(events) == 2
    # Newest first: timestamps should be in descending order
    assert events[0].timestamp >= events[1].timestamp


# ---------------------------------------------------------------------------
# Test 11: InsufficientCreditsError attributes are correct
# ---------------------------------------------------------------------------


def test_insufficient_credits_error_attributes() -> None:
    """InsufficientCreditsError should expose tenant_id, required, available."""
    err = InsufficientCreditsError("t-01", required=5, available=2)
    assert err.tenant_id == "t-01"
    assert err.required == 5
    assert err.available == 2
    assert "t-01" in str(err)
    assert "5" in str(err)
    assert "2" in str(err)


# ---------------------------------------------------------------------------
# Test 12: TASK_COSTS contains all expected keys with positive values
# ---------------------------------------------------------------------------


def test_task_costs_completeness() -> None:
    """TASK_COSTS should define positive costs for all required task types."""
    required_keys = {
        "plan", "execute_shell", "execute_llm", "execute_api",
        "verify", "cook_simple", "cook_standard", "cook_complex",
    }
    assert required_keys.issubset(set(TASK_COSTS.keys()))
    for key, cost in TASK_COSTS.items():
        assert cost > 0, f"TASK_COSTS['{key}'] must be positive, got {cost}"


# ---------------------------------------------------------------------------
# Test 13: Multiple tenants are isolated
# ---------------------------------------------------------------------------


def test_multiple_tenants_are_isolated(
    meter: CreditMeter, credit_store: CreditStore
) -> None:
    """Usage events for tenant A must not appear in tenant B's summary."""
    credit_store.add("tenant-a", 50, reason="setup")
    credit_store.add("tenant-b", 50, reason="setup")

    meter.record_usage("tenant-a", "plan", 1)
    meter.record_usage("tenant-b", "execute_llm", 2)

    summary_a = meter.get_usage_summary("tenant-a", period="daily")
    summary_b = meter.get_usage_summary("tenant-b", period="daily")

    assert summary_a.total_credits_used == 1
    assert summary_b.total_credits_used == 2
    assert "plan" in summary_a.breakdown
    assert "execute_llm" in summary_b.breakdown
    assert "execute_llm" not in summary_a.breakdown
