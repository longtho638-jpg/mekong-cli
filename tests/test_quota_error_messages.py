"""Tests for Quota Error Messages — ROIaaS Phase 6 user-facing error handling."""
from __future__ import annotations


from src.lib.quota_error_messages import (
    QuotaErrorContext,
    format_quota_error,
    format_simple_error,
    get_upgrade_url,
)


# ---------------------------------------------------------------------------
# Test: format_quota_error with all tiers
# ---------------------------------------------------------------------------


def test_format_quota_error_free_tier() -> None:
    """Test quota error message for free tier."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=10,
        daily_limit=10,
        command="cook",
        monthly_used=50,
        monthly_limit=100,
        retry_after_seconds=7200,
        violation_type="quota_exceeded",
    )

    result = format_quota_error(ctx)

    assert "Free Tier Quota Exceeded" in result
    assert "10" in result
    assert "cook" in result
    assert "pro" in result.lower() or "Pro" in result
    assert "https://raas.mekong.dev/pricing" in result
    # Free tier template doesn't include retry_after placeholder


def test_format_quota_error_free_tier_with_retry_seconds() -> None:
    """Test free tier error with retry_after (not used in template)."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=10,
        daily_limit=10,
        command="search",
        retry_after_seconds=90,  # Not used in free tier template
    )

    result = format_quota_error(ctx)

    # Free tier doesn't include retry_after in template
    assert "Free Tier Quota Exceeded" in result
    assert "10/10" in result


def test_format_quota_error_free_tier_without_retry() -> None:
    """Test free tier error without retry_after (template doesn't include it)."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=5,
        daily_limit=10,
        command="init",
        retry_after_seconds=None,
    )

    result = format_quota_error(ctx)

    assert "Free Tier Quota Exceeded" in result
    assert "5/10" in result
    # Free tier doesn't include retry_after in template


def test_format_quota_error_trial_tier() -> None:
    """Test quota error message for trial tier."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=50,
        daily_limit=50,
        command="cook",
        monthly_used=200,
        monthly_limit=500,
        retry_after_seconds=3600,
    )

    result = format_quota_error(ctx)

    assert "Trial Quota Exceeded" in result
    assert "50/50" in result
    assert "https://raas.mekong.dev/pricing" in result
    assert "Pro" in result or "pro" in result


def test_format_quota_error_starter_tier() -> None:
    """Test quota error message for starter tier."""
    ctx = QuotaErrorContext(
        tier="starter",
        daily_used=50,
        daily_limit=50,
        command="generate",
        monthly_used=500,
        monthly_limit=500,
        retry_after_seconds=1800,
    )

    result = format_quota_error(ctx)

    assert "Starter Tier Quota Exceeded" in result
    assert "50" in result
    assert "https://raas.mekong.dev/pricing" in result
    assert "Pro" in result or "pro" in result


def test_format_quota_error_growth_tier() -> None:
    """Test quota error message for growth tier."""
    ctx = QuotaErrorContext(
        tier="growth",
        daily_used=200,
        daily_limit=200,
        command="cook",
        monthly_used=2000,
        monthly_limit=2000,
        retry_after_seconds=60,
    )

    result = format_quota_error(ctx)

    assert "Growth Tier Quota Exceeded" in result
    assert "200/200" in result
    # Shows frequency, not total - includes 2000 in "commands" text (approx 6.5k total across 30 days)
    assert "https://raas.mekong.dev/enterprise" in result


def test_format_quota_error_pro_tier() -> None:
    """Test quota error message for pro tier."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=1000,
        daily_limit=1000,
        command="gateway",
        monthly_used=5000,
        monthly_limit=5000,
        retry_after_seconds=300,
    )

    result = format_quota_error(ctx)

    assert "Daily Quota Exceeded" in result
    assert "1000/1000" in result
    assert "https://raas.mekong.dev/enterprise" in result


def test_format_quota_error_enterprise_tier() -> None:
    """Test quota error message for enterprise tier (unlimited)."""
    ctx = QuotaErrorContext(
        tier="enterprise",
        daily_used=0,
        daily_limit=0,  # 0 = unlimited
        command="cook",
        monthly_used=0,
        monthly_limit=0,
        retry_after_seconds=None,
    )

    result = format_quota_error(ctx)

    assert "Quota Alert" in result
    assert "Enterprise tier has unlimited quota" in result
    assert "Contact support" in result
    assert "support@raas.mekong.dev" in result


def test_format_quota_error_invalid_tier_falls_back() -> None:
    """Test that invalid tier falls back to free tier template."""
    ctx = QuotaErrorContext(
        tier="unknown_tier",  # Invalid tier
        daily_used=5,
        daily_limit=10,
        command="test",
    )

    result = format_quota_error(ctx)

    # Should use free tier template as fallback
    assert "Free Tier Quota Exceeded" in result


# ---------------------------------------------------------------------------
# Test: format_quota_error with violation_type overrides
# ---------------------------------------------------------------------------


def test_format_quota_error_rate_limit() -> None:
    """Test rate limit violation type uses special template."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=1000,
        daily_limit=1000,
        command="cook",
        violation_type="rate_limit",
        retry_after_seconds=600,
    )

    result = format_quota_error(ctx)

    assert "Rate Limit Exceeded" in result
    assert "10 minutes" in result or "10m" in result
    assert "This protects fair usage" in result
    assert "https://raas.mekong.dev/enterprise" in result


def test_format_quota_error_invalid_license() -> None:
    """Test invalid_license violation type uses license error template."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=0,
        daily_limit=50,
        command="init",
        violation_type="invalid_license",
    )

    result = format_quota_error(ctx)

    assert "License Error" in result
    assert "Invalid or malformed license key" in result
    assert "command" in result.lower()
    assert "https://raas.mekong.dev/pricing" in result
    assert "mekong license status" in result


def test_format_quota_error_revoked() -> None:
    """Test revoked violation type uses license error template."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=0,
        daily_limit=1000,
        command="gateway",
        violation_type="revoked",
    )

    result = format_quota_error(ctx)

    assert "License Error" in result
    assert "revoked" in result.lower()
    assert "https://raas.mekong.dev/pricing" in result


def test_format_quota_error_unknown_violation_type() -> None:
    """Test unknown violation_type falls back to quota template."""
    ctx = QuotaErrorContext(
        tier="starter",
        daily_used=50,
        daily_limit=50,
        command="generate",
        violation_type="unknown_type",  # Not rate_limit or license
        retry_after_seconds=300,
    )

    result = format_quota_error(ctx)

    # Should use quota template for unknown type
    assert "Starter Tier Quota Exceeded" in result
    assert "50/50" in result


# ---------------------------------------------------------------------------
# Test: format_simple_error
# ---------------------------------------------------------------------------


def test_format_simple_error_free_tier() -> None:
    """Test simple error for free tier."""
    result = format_simple_error(
        tier="free",
        daily_used=10,
        daily_limit=10,
        retry_after_seconds=7200,
    )

    assert "Free tier quota exceeded" in result
    assert "10/10" in result
    assert "https://raas.mekong.dev/pricing" in result
    # Free tier simple error doesn't mention "Pro" explicitly


def test_format_simple_error_enterprise_tier() -> None:
    """Test simple error for enterprise tier (unlimited)."""
    result = format_simple_error(
        tier="enterprise",
        daily_used=100,
        daily_limit=0,  # Unlimited
        retry_after_seconds=None,
    )

    assert "Quota alert" in result
    assert "100" in result
    assert "Contact support" in result
    # Enterprise simple error uses generic "Contact support" not email


def test_format_simple_error_other_tiers() -> None:
    """Test simple error for other tiers (trial, starter, growth, pro)."""
    for tier in ["trial", "starter", "growth", "pro"]:
        result = format_simple_error(
            tier=tier,
            daily_used=50,
            daily_limit=100,
            retry_after_seconds=3600,
        )

        assert "Quota exceeded" in result
        assert "50/100" in result
        # Format is "1 hour" not raw seconds
        assert "hour" in result or "hours" in result
        assert "https://raas.mekong.dev" in result


def test_format_simple_error_no_retry_seconds() -> None:
    """Test simple error without retry_after_seconds."""
    result = format_simple_error(
        tier="growth",
        daily_used=200,
        daily_limit=200,
        retry_after_seconds=None,
    )

    assert "Quota exceeded" in result
    assert "midnight UTC" in result or "200" in result


# ---------------------------------------------------------------------------
# Test: get_upgrade_url
# ---------------------------------------------------------------------------


def test_get_upgrade_url_free_tier() -> None:
    """Test upgrade URL for free tier."""
    url = get_upgrade_url("free")
    assert url == "https://raas.mekong.dev/pricing"


def test_get_upgrade_url_trial_tier() -> None:
    """Test upgrade URL for trial tier."""
    url = get_upgrade_url("trial")
    assert url == "https://raas.mekong.dev/pricing"


def test_get_upgrade_url_starter_tier() -> None:
    """Test upgrade URL for starter tier."""
    url = get_upgrade_url("starter")
    assert url == "https://raas.mekong.dev/pricing"


def test_get_upgrade_url_growth_tier() -> None:
    """Test upgrade URL for growth tier."""
    url = get_upgrade_url("growth")
    assert url == "https://raas.mekong.dev/pricing"


def test_get_upgrade_url_pro_tier() -> None:
    """Test upgrade URL for pro tier."""
    url = get_upgrade_url("pro")
    assert url == "https://raas.mekong.dev/enterprise"


def test_get_upgrade_url_enterprise_tier() -> None:
    """Test upgrade URL for enterprise tier."""
    url = get_upgrade_url("enterprise")
    assert url == "https://raas.mekong.dev/contact"


def test_get_upgrade_url_unknown_tier() -> None:
    """Test upgrade URL for unknown tier (fallback)."""
    url = get_upgrade_url("unknown")
    assert url == "https://raas.mekong.dev/pricing"


# ---------------------------------------------------------------------------
# Test: QuotaErrorContext
# ---------------------------------------------------------------------------


def test_quota_error_context_default_values() -> None:
    """Test QuotaErrorContext with default values."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=25,
        daily_limit=50,
        command="test",
    )

    assert ctx.tier == "trial"
    assert ctx.daily_used == 25
    assert ctx.daily_limit == 50
    assert ctx.command == "test"
    assert ctx.monthly_used == 0
    assert ctx.monthly_limit == 0
    assert ctx.retry_after_seconds is None
    assert ctx.violation_type == "quota_exceeded"  # default


def test_quota_error_context_all_fields() -> None:
    """Test QuotaErrorContext with all fields set."""
    ctx = QuotaErrorContext(
        tier="pro",
        daily_used=1000,
        daily_limit=1000,
        command="gateway",
        monthly_used=5000,
        monthly_limit=5000,
        retry_after_seconds=3600,
        violation_type="rate_limit",
    )

    assert ctx.tier == "pro"
    assert ctx.daily_used == 1000
    assert ctx.daily_limit == 1000
    assert ctx.command == "gateway"
    assert ctx.monthly_used == 5000
    assert ctx.monthly_limit == 5000
    assert ctx.retry_after_seconds == 3600
    assert ctx.violation_type == "rate_limit"


# ---------------------------------------------------------------------------
# Test: Error message formatting barriers
# ---------------------------------------------------------------------------


def test_format_quota_error_box_art() -> None:
    """Test that error messages use box-drawing characters."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=5,
        daily_limit=10,
        command="init",
    )

    result = format_quota_error(ctx)

    assert any(char in result for char in ["╔", "══", "║"])
    assert any(char in result for char in ["╚", "╝"])


def test_format_quota_error_preserves_command_in_output() -> None:
    """Test that command name appears in error message."""
    for cmd in ["cook", "gateway", "search", "init", "generate"]:
        ctx = QuotaErrorContext(
            tier="free",
            daily_used=10,
            daily_limit=10,
            command=cmd,
        )

        result = format_quota_error(ctx)
        assert cmd in result


# ---------------------------------------------------------------------------
# Test: Empty/Edge Cases
# ---------------------------------------------------------------------------


def test_format_quota_error_with_empty_command() -> None:
    """Test formatting with empty command string."""
    ctx = QuotaErrorContext(
        tier="free",
        daily_used=5,
        daily_limit=10,
        command="",  # Empty
    )

    result = format_quota_error(ctx)

    # Should still render correctly
    assert "Free Tier Quota Exceeded" in result


def test_format_quota_error_with_zero_values() -> None:
    """Test formatting with zero values."""
    ctx = QuotaErrorContext(
        tier="trial",
        daily_used=0,
        daily_limit=0,
        command="test",
        monthly_used=0,
        monthly_limit=0,
    )

    result = format_quota_error(ctx)

    # Should work without division by zero or similar
    assert "Quota Exceeded" in result or "Quota Alert" in result
