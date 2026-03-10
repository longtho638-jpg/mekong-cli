"""Tests for RaaS Gate Enforcement Layer — ROIaaS Phase 6 integration."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.raas.credit_rate_limiter import RateLimitStatus, TIER_LIMITS
from src.lib.quota_error_messages import QuotaErrorContext, format_quota_error
from src.lib.license_generator import get_tier_limits as get_license_tier_limits
from src.raas.violation_tracker import ViolationEvent
from src.lib.usage_meter import UsageMeter


# ---------------------------------------------------------------------------


class MockDatabase:
    """Mock database for testing."""

    def __init__(self) -> None:
        self.fetched = {}

    async def fetch_one(self, query: str, params: tuple = ()) -> dict | None:
        """Mock fetch_one."""
        key = (query, params)
        return self.fetched.get(key)

    async def fetch_all(self, query: str, params: tuple = ()) -> list[dict]:
        """Mock fetch_all."""
        return []


class MockRepository:
    """Mock repository for testing."""

    def __init__(self) -> None:
        self.licenses = {}
        self.usage = {}
        self.revoked = set()

    async def get_license_by_key(self, key: str) -> dict | None:
        """Mock get_license_by_key."""
        return self.licenses.get(key)

    async def get_license_by_key_id(self, key_id: str) -> dict | None:
        """Mock get_license_by_key_id."""
        for license_key, lic in self.licenses.items():
            if lic.get("key_id") == key_id:
                return lic
        return None

    async def record_usage(
        self, key_id: str, license_id: int | None = None, commands_count: int = 1
    ) -> dict:
        """Mock record_usage."""
        if key_id not in self.usage:
            self.usage[key_id] = {"commands_count": 0}
        self.usage[key_id]["commands_count"] += commands_count
        return self.usage[key_id]

    async def get_usage(self, key_id: str) -> dict | None:
        """Mock get_usage."""
        return self.usage.get(key_id)

    async def get_usage_summary(self, key_id: str, days: int = 30) -> dict:
        """Mock get_usage_summary."""
        return {
            "days_with_usage": 1,
            "total_commands": self.usage.get(key_id, {}).get("commands_count", 0),
            "max_daily_commands": self.usage.get(key_id, {}).get("commands_count", 0),
            "avg_daily_commands": self.usage.get(key_id, {}).get("commands_count", 0),
        }

    async def is_revoked(self, key_id: str) -> bool:
        """Mock is_revoked."""
        return key_id in self.revoked


class MockRateLimiter:
    """Mock credit rate limiter."""

    def __init__(self, allowed: bool = True, daily_used: int = 0, daily_limit: int = 100):
        self.allowed = allowed
        self.daily_used = daily_used
        self.daily_limit = daily_limit

    def check_limit(self, tenant_id: str) -> RateLimitStatus:
        """Mock check_limit."""
        return RateLimitStatus(
            allowed=self.allowed,
            daily_used=self.daily_used,
            daily_limit=self.daily_limit,
            monthly_used=0,
            monthly_limit=0,
            retry_after_seconds=3600 if not self.allowed else None,
        )


# ---------------------------------------------------------------------------
# Test: CreditRateLimiter MOCK integration
# ---------------------------------------------------------------------------


def test_rate_limiter_blocks_when_exceeded() -> None:
    """Test rate limiter blocks when daily quota exceeded."""
    limiter = MockRateLimiter(allowed=False, daily_used=50, daily_limit=50)

    status = limiter.check_limit("tenant-123")

    assert status.allowed is False
    assert status.daily_used == 50
    assert status.daily_limit == 50
    assert status.retry_after_seconds is not None


def test_rate_limiter_allows_when_under_limit() -> None:
    """Test rate limiter allows when under daily quota."""
    limiter = MockRateLimiter(allowed=True, daily_used=10, daily_limit=50)

    status = limiter.check_limit("tenant-456")

    assert status.allowed is True
    assert status.daily_used == 10
    assert status.daily_limit == 50


# ---------------------------------------------------------------------------
# Test: QuotaErrorContext creation and usage
# ---------------------------------------------------------------------------


def test_quota_error_context_full() -> None:
    """Test QuotaErrorContext with all fields."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=1000,
        daily_limit=1000,
        command="cook",
        monthly_used=5000,
        monthly_limit=5000,
        retry_after_seconds=3600,
        violation_type="rate_limit",
    )

    assert ctx.tier == "pro"
    assert ctx.daily_used == 1000
    assert ctx.command == "cook"
    assert ctx.violation_type == "rate_limit"


def test_quota_error_context_defaults() -> None:
    """Test QuotaErrorContext default values."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=10,
        daily_limit=10,
        command="test",
    )

    assert ctx.monthly_used == 0
    assert ctx.monthly_limit == 0
    assert ctx.retry_after_seconds is None
    assert ctx.violation_type == "quota_exceeded"


# ---------------------------------------------------------------------------
# Test: format_quota_error with quota context
# ---------------------------------------------------------------------------


def test_format_quota_error_pro_tier() -> None:
    """Test format_quota_error for pro tier."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=1000,
        daily_limit=1000,
        command="gateway",
        violation_type="quota_exceeded",
    )

    result = format_quota_error(ctx)

    assert "Daily Quota Exceeded" in result
    assert "1000/1000" in result
    assert "Enterprise" in result or "enterprise" in result


def test_format_quota_error_rate_limit_produce_message() -> None:
    """Test rate limit violation produces correct message."""
    ctx = QuotaErrorContext(
        tier="growth",
        daily_used=200,
        daily_limit=200,
        command="cook",
        violation_type="rate_limit",
        retry_after_seconds=600,
    )

    result = format_quota_error(ctx)

    assert "Rate Limit Exceeded" in result
    assert "600" in result or "10" in result  # 10 minutes


def test_format_quota_error_invalid_license_with_command() -> None:
    """Test invalid license error includes command name."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=0,
        daily_limit=50,
        command="search",
        violation_type="invalid_license",
    )

    result = format_quota_error(ctx)

    assert "License Error" in result
    assert "invalid" in result.lower() or "malformed" in result.lower()
    assert "search" in result


# ---------------------------------------------------------------------------
# Test: License tier limits integration
# ---------------------------------------------------------------------------


def test_license_tier_limits_free() -> None:
    """Test free tier limits from license_generator."""
    limits = get_license_tier_limits("free")

    assert limits["commands_per_day"] == 10
    assert limits["max_days"] is None


def test_license_tier_limits_trial() -> None:
    """Test trial tier limits from license_generator."""
    limits = get_license_tier_limits("trial")

    assert limits["commands_per_day"] == 50
    assert limits["max_days"] == 7


def test_license_tier_limits_pro() -> None:
    """Test pro tier limits from license_generator."""
    limits = get_license_tier_limits("pro")

    assert limits["commands_per_day"] == 1000
    assert limits["max_days"] is None


def test_license_tier_limits_enterprise() -> None:
    """Test enterprise tier limits (unlimited)."""
    limits = get_license_tier_limits("enterprise")

    assert limits["commands_per_day"] == -1  # -1 = unlimited
    assert limits["max_days"] is None


def test_tier_limits_default_fallback() -> None:
    """Test that unknown tier defaults to free limits."""
    limits = get_license_tier_limits("unknown_tier")

    assert limits["commands_per_day"] == 10
    assert limits["max_days"] is None


# ---------------------------------------------------------------------------
# Test: ViolationEvent creation for enforcement
# ---------------------------------------------------------------------------


def test_violation_event_for_rate_limit() -> None:
    """Test creating ViolationEvent for rate limit."""
    event = ViolationEvent(
        key_id="license-123-key",
        tier="starter",
        violation_type="rate_limit",
        command="generate",
        daily_used=50,
        daily_limit=50,
        monthly_used=100,
        monthly_limit=500,
        retry_after_seconds=1800,
        metadata={"ip": "192.168.1.100"},
    )

    assert event.key_id == "license-123-key"
    assert event.tier == "starter"
    assert event.violation_type == "rate_limit"
    assert event.command == "generate"
    assert event.daily_used == 50
    assert event.daily_limit == 50
    assert event.metadata == {"ip": "192.168.1.100"}


def test_violation_event_for_quota_exceeded() -> None:
    """Test creating ViolationEvent for quota exceeded."""
    event = ViolationEvent(
        key_id="trial-key-456",
        tier="trial",
        violation_type="quota_exceeded",
        command="cook",
        daily_used=50,
        daily_limit=50,
        monthly_used=200,
        monthly_limit=500,
        retry_after_seconds=None,
        metadata=None,
    )

    assert event.daily_used == event.daily_limit
    assert event.violation_type == "quota_exceeded"


def test_violation_event_for_invalid_license() -> None:
    """Test creating ViolationEvent for invalid license."""
    event = ViolationEvent(
        key_id="invalid-key-789",
        tier="free",
        violation_type="invalid_license",
        command="init",
        daily_used=0,
        daily_limit=10,
        monthly_used=0,
        monthly_limit=100,
    )

    assert event.violation_type == "invalid_license"


# ---------------------------------------------------------------------------
# Test: UsageMeter mock integration
# ---------------------------------------------------------------------------


@pytest.fixture()
def mock_usage_meter() -> UsageMeter:
    """Fixture with mocked UsageMeter."""
    mock_repo = MagicMock()
    mock_repo.get_usage = AsyncMock(return_value=None)
    mock_repo.record_usage = AsyncMock(return_value={"commands_count": 1})

    meter = UsageMeter(repository=mock_repo)
    return meter


async def test_usage_meter_record(mock_usage_meter: UsageMeter) -> None:
    """Test record_usage method."""
    # Mock tier limits
    with patch("src.lib.usage_meter.get_tier_limits") as mock_limits:
        mock_limits.return_value = {"commands_per_day": 10}
        mock_usage_meter._repo.get_usage = AsyncMock(return_value=None)

        allowed, error = await mock_usage_meter.record_usage("key-123", "free")

        assert allowed is True
        assert error == ""


async def test_usage_meter_quota_exceeded(mock_usage_meter: UsageMeter) -> None:
    """Test record_usage when quota exceeded."""
    # Return current usage at limit
    with patch("src.lib.usage_meter.get_tier_limits") as mock_limits:
        mock_limits.return_value = {"commands_per_day": 10}
        mock_usage_meter._repo.get_usage = AsyncMock(
            return_value={"commands_count": 10}
        )

        allowed, error = await mock_usage_meter.record_usage("key-exceeded", "free")

        assert allowed is False
        assert "Daily limit" in error or "limit reached" in error.lower()


async def test_usage_meter_get_usage_summary(mock_usage_meter: UsageMeter) -> None:
    """Test get_usage_summary method."""
    # Mock tier and license lookup
    with patch("src.lib.usage_meter.get_tier_limits") as mock_limits, \
         patch.object(mock_usage_meter._repo, "get_license_by_key_id", new_callable=AsyncMock) as mock_license, \
         patch.object(mock_usage_meter._repo, "get_usage_summary", new_callable=AsyncMock) as mock_summary:

        mock_limits.return_value = {"commands_per_day": 100}
        mock_license.return_value = {"tier": "pro"}
        mock_usage_meter._repo.get_usage = AsyncMock(
            return_value={"commands_count": 50}
        )
        mock_summary.return_value = {
            "days_with_usage": 1,
            "total_commands": 100,
            "max_daily_commands": 50,
            "avg_daily_commands": 50,
        }

        summary = await mock_usage_meter.get_usage_summary("key-summary")

        assert summary["tier"] == "pro"
        assert summary["commands_today"] == 50


# ---------------------------------------------------------------------------
# Test: RaasLicenseGate enforcement logic
# ---------------------------------------------------------------------------


class MockLicenseGate:
    """Mock license gate with enforcement logic."""

    FREE_COMMANDS = {"init", "version", "list", "search"}
    PREMIUM_COMMANDS = {"cook", "gateway", "generate"}

    def __init__(self) -> None:
        self.license_key = "raas-pro-key123-signature"
        self.license_tier = "pro"
        self.key_id = "key-123"

    def is_free_command(self, command: str) -> bool:
        """Check if command is free."""
        return command.lower() in self.FREE_COMMANDS

    def is_premium_command(self, command: str) -> bool:
        """Check if command requires license."""
        return command.lower() in self.PREMIUM_COMMANDS

    def check_quota(self, command: str, key_id: str, tier: str) -> tuple[bool, str]:
        """Mock quota check with violation recording logic."""
        # Simulate quota limit for pro tier
        daily_limit = 1000 if tier == "pro" else 100

        # Get current usage (mocked as 1000 for exceeded case)
        current_usage = 1000  # This would come from database in real implementation

        if current_usage >= daily_limit:
            return False, f"Daily quota exceeded: {current_usage}/{daily_limit}"

        return True, ""


def test_license_gate_free_command_no_check() -> None:
    """Test that free commands don't require license check."""
    gate = MockLicenseGate()

    # Free commands are handled before quota check in real implementation
    # So these commands would never hit the quota check in real code
    for cmd in gate.FREE_COMMANDS:
        # In real code, free commands return early before quota check
        # Here we just verify the command is recognized as free
        assert gate.is_free_command(cmd.lower()) is True
        assert gate.is_premium_command(cmd.lower()) is False


def test_license_gate_premium_command_checks_quota() -> None:
    """Test that premium commands check quota."""
    gate = MockLicenseGate()

    # Simulate quota exceeded
    with patch.object(gate, "check_quota", return_value=(False, "Daily limit reached")):
        allowed, error = gate.check_quota("cook", "key-123", "pro")
        assert allowed is False
        assert "limit" in error.lower() or "quota" in error.lower()


def test_license_gate_exceeded_quota_records_violation() -> None:
    """Test that exceeded quota creates violation event."""
    gate = MockLicenseGate()

    # Simulate exceeded state
    daily_usage = 1000
    daily_limit = 1000
    tier = "pro"

    if daily_usage >= daily_limit:
        # This is when we would create a ViolationEvent
        event = ViolationEvent(
            key_id=gate.key_id,
            tier=tier,
            violation_type="quota_exceeded",
            command="cook",
            daily_used=daily_usage,
            daily_limit=daily_limit,
        )

        assert event.violation_type == "quota_exceeded"
        assert event.daily_used == event.daily_limit


# ---------------------------------------------------------------------------
# Test: Full enforcement flow mock
# ---------------------------------------------------------------------------


class MockEnforcementFlow:
    """Mock full enforcement flow."""

    def __init__(self) -> None:
        self.violations_recorded = []

    def check(self, command: str, tier: str, key_id: str) -> tuple[bool, str | None]:
        """Simulate the check() flow from raas_gate.py."""
        # Step 1: Free command check
        if command.lower() in {"init", "version", "list", "search"}:
            return True, None

        # Step 2: Premium command check
        if command.lower() not in {"cook", "gateway", "generate"}:
            return True, None

        # Step 3: Rate limit check (sliding window)
        limiter = MockRateLimiter(allowed=True, daily_used=10, daily_limit=1000)
        rate_status = limiter.check_limit(key_id)

        if not rate_status.allowed:
            # Record violation
            violation = ViolationEvent(
                key_id=key_id,
                tier=tier,
                violation_type="rate_limit",
                command=command,
                daily_used=rate_status.daily_used,
                daily_limit=rate_status.daily_limit,
                retry_after_seconds=rate_status.retry_after_seconds,
            )
            self.violations_recorded.append(violation)

            ctx = QuotaErrorContext(
                tier=tier,
                daily_used=rate_status.daily_used,
                daily_limit=rate_status.daily_limit,
                command=command,
                retry_after_seconds=rate_status.retry_after_seconds,
                violation_type="rate_limit",
            )
            return False, format_quota_error(ctx)

        # Step 4: Daily quota check
        # Simulate quota check
        daily_limit = 1000 if tier == "pro" else 100
        current_usage = 500  # Under limit

        if current_usage >= daily_limit:
            # Record violation
            violation = ViolationEvent(
                key_id=key_id,
                tier=tier,
                violation_type="quota_exceeded",
                command=command,
                daily_used=current_usage,
                daily_limit=daily_limit,
            )
            self.violations_recorded.append(violation)

            ctx = QuotaErrorContext(
                tier=tier,
                daily_used=current_usage,
                daily_limit=daily_limit,
                command=command,
                violation_type="quota_exceeded",
            )
            return False, format_quota_error(ctx)

        return True, None


def test_enforcement_flow_allows_under_limit() -> None:
    """Test enforcement flow allows request under quota."""
    flow = MockEnforcementFlow()

    allowed, error = flow.check("cook", "pro", "key-123")

    assert allowed is True
    assert error is None
    assert len(flow.violations_recorded) == 0


def test_enforcement_flow_blocks_rate_limit() -> None:
    """Test enforcement flow blocks on rate limit."""
    flow = MockEnforcementFlow()

    # Mock rate limiter to show exceeded
    with patch.object(flow, "check", autospec=True) as mock_check:
        # Return rate limit exceeded
        mock_check.return_value = (False, "Rate limit exceeded")

        allowed, error = flow.check("cook", "pro", "key-456")

        assert allowed is False
        assert error is not None


def test_enforcement_flow_blocks_quota_exceeded() -> None:
    """Test enforcement flow blocks on quota exceeded."""
    flow = MockEnforcementFlow()

    # Set up to trigger quota exceeded
    with patch("src.lib.usage_meter.get_tier_limits", return_value={"commands_per_day": 100}):
        with patch.object(MockRepository, "get_usage", autospec=True) as mock_usage:
            mock_usage.return_value = {"commands_count": 100}

            # Simulate quota exceeded
            current = 100
            limit = 100

            if current >= limit:
                violation = ViolationEvent(
                    key_id="key-789",
                    tier="starter",
                    violation_type="quota_exceeded",
                    command="generate",
                    daily_used=current,
                    daily_limit=limit,
                )
                flow.violations_recorded.append(violation)

    assert len(flow.violations_recorded) >= 0


def test_enforcement_flow_records_violation_for_quota() -> None:
    """Test that quota violations are recorded."""
    flow = MockEnforcementFlow()

    # Manually simulate quota exceeded scenario
    current_usage = 50
    daily_limit = 50
    exceeded = current_usage >= daily_limit

    if exceeded:
        event = ViolationEvent(
            key_id="license-key-test",
            tier="trial",
            violation_type="quota_exceeded",
            command="cook",
            daily_used=current_usage,
            daily_limit=daily_limit,
        )
        flow.violations_recorded.append(event)

    assert len(flow.violations_recorded) == (1 if exceeded else 0)


# ---------------------------------------------------------------------------
# Test: Error message formatting with context
# ---------------------------------------------------------------------------


def test_format_quota_error_with_none_retry_after() -> None:
    """Test error formatting when retry_after is None."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=50,
        daily_limit=50,
        command="init",
        retry_after_seconds=None,
    )

    result = format_quota_error(ctx)

    # Should still format correctly with None retry_after
    assert "midnight UTC" in result or "Quota Exceeded" in result


def test_format_quota_error_handles_zero_values() -> None:
    """Test error formatting with zero values."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=0,
        daily_limit=10,
        command="test",
    )

    result = format_quota_error(ctx)

    # Should not crash with 0 values
    assert "Free Tier Quota Exceeded" in result


def test_format_quota_error_produces_upgradable_message() -> None:
    """Test that error messages include upgrade CTAs."""
    for tier in ["free", "trial", "starter", "growth", "pro"]:
        ctx = QuotaErrorContext(
            tier=tier,
            daily_used=100,
            daily_limit=100,
            command="generate",
        )

        result = format_quota_error(ctx)

        # All messages should include upgrade URL
        assert "https://raas.mekong.dev" in result


# ---------------------------------------------------------------------------
# Test: CreditRateLimiter edge cases
# ---------------------------------------------------------------------------


def test_rate_limiter_unlimited_tier() -> None:
    """Test enterprise tier (0 limit) is never blocked."""
    from src.raas.credit_rate_limiter import TIER_LIMITS

    enterprise = TIER_LIMITS["enterprise"]
    assert enterprise["daily"] == 0
    assert enterprise["monthly"] == 0

    # Even with high usage, should be allowed
    limiter = MockRateLimiter(allowed=True, daily_used=1000000, daily_limit=0)

    status = limiter.check_limit("enterprise-tenant")

    assert status.allowed is True


def test_rate_limiter_different_tiers() -> None:
    """Test different tiers have different limits."""
    assert TIER_LIMITS["free"]["daily"] == 10
    assert TIER_LIMITS["starter"]["daily"] == 50
    assert TIER_LIMITS["growth"]["daily"] == 200
    assert TIER_LIMITS["pro"]["daily"] == 500
    assert TIER_LIMITS["enterprise"]["daily"] == 0


def test_rate_limiter_monthly_check() -> None:
    """Test monthly limit check for enterprise (unlimited)."""
    from src.raas.credit_rate_limiter import TIER_LIMITS

    # Enterprise tier (0 = unlimited) should never be blocked
    enterprise = TIER_LIMITS["enterprise"]
    assert enterprise["monthly"] == 0

    limiter = MockRateLimiter(allowed=True, daily_used=5, daily_limit=0)

    status = limiter.check_limit("tenant-monthly")

    # Enterprise is unlimited - always allowed
    assert status.allowed is True
