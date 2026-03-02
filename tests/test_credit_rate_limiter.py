"""Tests for CreditRateLimiter — sliding window fair-use rate limiting."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

from src.raas.credit_rate_limiter import (
    TIER_LIMITS,
    CreditRateLimiter,
    RateLimitStatus,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    """Isolated SQLite DB per test."""
    return tmp_path / "rate_limit_test.db"


@pytest.fixture()
def free_limiter(db_path: Path) -> CreditRateLimiter:
    """Limiter configured with free-tier limits (daily=10, monthly=100)."""
    return CreditRateLimiter(
        db_path=db_path,
        daily_limit=TIER_LIMITS["free"]["daily"],
        monthly_limit=TIER_LIMITS["free"]["monthly"],
    )


@pytest.fixture()
def unlimited_limiter(db_path: Path) -> CreditRateLimiter:
    """Limiter configured with enterprise limits (0 = unlimited)."""
    return CreditRateLimiter(
        db_path=db_path,
        daily_limit=TIER_LIMITS["enterprise"]["daily"],
        monthly_limit=TIER_LIMITS["enterprise"]["monthly"],
    )


# ---------------------------------------------------------------------------
# Test: fresh tenant is always allowed
# ---------------------------------------------------------------------------


def test_fresh_tenant_is_allowed(free_limiter: CreditRateLimiter) -> None:
    """A tenant with no usage history should always pass the check."""
    status = free_limiter.check_limit("tenant-new")

    assert isinstance(status, RateLimitStatus)
    assert status.allowed is True
    assert status.daily_used == 0
    assert status.monthly_used == 0
    assert status.retry_after_seconds is None


# ---------------------------------------------------------------------------
# Test: record_request accumulates usage correctly
# ---------------------------------------------------------------------------


def test_record_request_accumulates_usage(free_limiter: CreditRateLimiter) -> None:
    """Credits recorded via record_request should appear in get_limits."""
    free_limiter.record_request("tenant-a", credits_used=3)
    free_limiter.record_request("tenant-a", credits_used=2)

    limits = free_limiter.get_limits("tenant-a")

    assert limits["daily_used"] == 5
    assert limits["monthly_used"] == 5
    assert limits["daily_limit"] == 10
    assert limits["monthly_limit"] == 100
    assert limits["daily_remaining"] == 5
    assert limits["monthly_remaining"] == 95


# ---------------------------------------------------------------------------
# Test: daily limit blocks request after threshold
# ---------------------------------------------------------------------------


def test_daily_limit_blocks_when_exceeded(free_limiter: CreditRateLimiter) -> None:
    """Tenant should be blocked once daily_used >= daily_limit."""
    tenant = "tenant-daily"

    # Consume full daily quota
    for _ in range(10):
        free_limiter.record_request(tenant, credits_used=1)

    status = free_limiter.check_limit(tenant)

    assert status.allowed is False
    assert status.daily_used == 10
    assert status.daily_limit == 10
    assert status.retry_after_seconds is not None
    assert status.retry_after_seconds > 0


# ---------------------------------------------------------------------------
# Test: monthly limit blocks even if daily is fine
# ---------------------------------------------------------------------------


def test_monthly_limit_blocks_when_exceeded(db_path: Path) -> None:
    """Tenant exceeding monthly limit should be blocked regardless of daily usage."""
    # Use a limiter with high daily but low monthly so we can trigger monthly limit
    limiter = CreditRateLimiter(db_path=db_path, daily_limit=200, monthly_limit=5)
    tenant = "tenant-monthly"

    # Record 5 credits — hits monthly limit without hitting daily
    for _ in range(5):
        limiter.record_request(tenant, credits_used=1)

    status = limiter.check_limit(tenant)

    assert status.allowed is False
    assert status.monthly_used == 5
    assert status.monthly_limit == 5
    assert status.retry_after_seconds is not None


# ---------------------------------------------------------------------------
# Test: enterprise tier (unlimited) is never blocked
# ---------------------------------------------------------------------------


def test_enterprise_unlimited_never_blocked(unlimited_limiter: CreditRateLimiter) -> None:
    """Tenants with daily_limit=0 / monthly_limit=0 must never be rate-limited."""
    tenant = "tenant-enterprise"

    # Record a large number of credits
    for _ in range(1000):
        unlimited_limiter.record_request(tenant, credits_used=10)

    status = unlimited_limiter.check_limit(tenant)

    assert status.allowed is True
    assert status.retry_after_seconds is None


# ---------------------------------------------------------------------------
# Test: events outside the sliding window are ignored
# ---------------------------------------------------------------------------


def test_old_events_outside_window_are_ignored(db_path: Path) -> None:
    """Events older than 24h should not count toward the daily window."""
    limiter = CreditRateLimiter(db_path=db_path, daily_limit=10, monthly_limit=100)
    tenant = "tenant-window"

    # Patch _now to simulate recording events 25 hours ago
    past_time = datetime.now(timezone.utc) - timedelta(hours=25)

    with patch.object(CreditRateLimiter, "_now", return_value=past_time):
        for _ in range(10):
            limiter.record_request(tenant, credits_used=1)

    # Now (present time) the daily window should show 0 usage
    status = limiter.check_limit(tenant)

    assert status.allowed is True
    assert status.daily_used == 0


# ---------------------------------------------------------------------------
# Test: get_limits returns None for remaining when unlimited
# ---------------------------------------------------------------------------


def test_get_limits_remaining_is_none_for_unlimited(unlimited_limiter: CreditRateLimiter) -> None:
    """When limit is 0 (unlimited), remaining should be None."""
    unlimited_limiter.record_request("tenant-ent", credits_used=50)
    limits = unlimited_limiter.get_limits("tenant-ent")

    assert limits["daily_remaining"] is None
    assert limits["monthly_remaining"] is None


# ---------------------------------------------------------------------------
# Test: record_request rejects non-positive credits
# ---------------------------------------------------------------------------


def test_record_request_rejects_zero_credits(free_limiter: CreditRateLimiter) -> None:
    """record_request must raise ValueError for credits_used <= 0."""
    with pytest.raises(ValueError, match="credits_used must be positive"):
        free_limiter.record_request("tenant-x", credits_used=0)

    with pytest.raises(ValueError, match="credits_used must be positive"):
        free_limiter.record_request("tenant-x", credits_used=-5)


# ---------------------------------------------------------------------------
# Test: multiple tenants are isolated
# ---------------------------------------------------------------------------


def test_tenant_isolation(free_limiter: CreditRateLimiter) -> None:
    """Usage from one tenant must not affect another tenant's limits."""
    for _ in range(10):
        free_limiter.record_request("tenant-heavy", credits_used=1)

    # tenant-heavy is blocked
    assert free_limiter.check_limit("tenant-heavy").allowed is False

    # tenant-clean is unaffected
    assert free_limiter.check_limit("tenant-clean").allowed is True
    assert free_limiter.get_limits("tenant-clean")["daily_used"] == 0
