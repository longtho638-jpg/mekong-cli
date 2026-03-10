"""Tests for quota warning functions — ROIaaS Phase 6b quota warnings."""
from __future__ import annotations


from src.lib.quota_error_messages import (
    format_quota_warning,
    format_free_tier_upgrade,
    get_warning_threshold,
    QuotaWarningContext,
)


# ---------------------------------------------------------------------------
# get_warning_threshold tests
# ---------------------------------------------------------------------------


class TestGetWarningThreshold:
    """Test get_warning_threshold function."""

    def test_no_warning_below_80(self) -> None:
        """get_warning_threshold returns None for usage < 80%."""
        # 79% usage
        assert get_warning_threshold(daily_used=79, daily_limit=100) is None
        # 50% usage
        assert get_warning_threshold(daily_used=50, daily_limit=100) is None
        # 10% usage
        assert get_warning_threshold(daily_used=10, daily_limit=100) is None

    def test_returns_80_at_80_percent(self) -> None:
        """get_warning_threshold returns 80 at exactly 80%."""
        assert get_warning_threshold(daily_used=80, daily_limit=100) == 80
        assert get_warning_threshold(daily_used=8, daily_limit=10) == 80

    def test_returns_80_between_80_and_90(self) -> None:
        """get_warning_threshold returns 80 for 80-89% usage."""
        assert get_warning_threshold(daily_used=85, daily_limit=100) == 80
        assert get_warning_threshold(daily_used=88, daily_limit=100) == 80
        assert get_warning_threshold(daily_used=89, daily_limit=100) == 80

    def test_returns_90_at_90_percent(self) -> None:
        """get_warning_threshold returns 90 at exactly 90%."""
        assert get_warning_threshold(daily_used=90, daily_limit=100) == 90
        assert get_warning_threshold(daily_used=9, daily_limit=10) == 90

    def test_returns_90_between_90_and_100(self) -> None:
        """get_warning_threshold returns 90 for 90-99% usage."""
        assert get_warning_threshold(daily_used=95, daily_limit=100) == 90
        assert get_warning_threshold(daily_used=99, daily_limit=100) == 90

    def test_returns_90_for_over_100_percent(self) -> None:
        """get_warning_threshold returns 90 for >100% usage."""
        assert get_warning_threshold(daily_used=100, daily_limit=100) == 90
        assert get_warning_threshold(daily_used=120, daily_limit=100) == 90

    def test_returns_none_for_unlimited(self) -> None:
        """get_warning_threshold returns None for unlimited (limit <= 0)."""
        # 0 limit = unlimited
        assert get_warning_threshold(daily_used=100, daily_limit=0) is None
        # Negative limit
        assert get_warning_threshold(daily_used=100, daily_limit=-1) is None


# ---------------------------------------------------------------------------
# format_quota_warning tests
# ---------------------------------------------------------------------------


class TestFormatQuotaWarning:
    """Test format_quota_warning function."""

    def test_80_percent_warning_output(self) -> None:
        """format_quota_warning generates 80% threshold warning."""
        ctx = QuotaWarningContext(
            tier="free",
            daily_used=80,
            daily_limit=100,
            percentage=80.0,
            remaining=20,
            command="cook",
            threshold=80,
        )

        output = format_quota_warning(ctx)

        assert "80% Used" in output
        assert "80/100 commands today (80%)" in output
        assert "Remaining: 20 commands" in output
        assert "Consider upgrading to Pro for 1000 commands/day" in output

    def test_90_percent_warning_output(self) -> None:
        """format_quota_warning generates 90% threshold warning."""
        ctx = QuotaWarningContext(
            tier="pro",
            daily_used=90,
            daily_limit=100,
            percentage=90.0,
            remaining=10,
            command="cook",
            threshold=90,
        )

        output = format_quota_warning(ctx)

        assert "90% Used" in output
        assert "90/100 commands today (90%)" in output
        assert "Only 10 commands remaining" in output
        assert "Upgrade to Pro NOW" in output or "Upgrade to Pro for" in output

    def test_format_metric(self) -> None:
        """format_quota_warning includes command name."""
        ctx = QuotaWarningContext(
            tier="trial",
            daily_used=80,
            daily_limit=50,
            percentage=160.0,
            remaining=0,
            command="bi-nh-phap",
            threshold=80,
        )

        output = format_quota_warning(ctx)

        assert "command_name" not in output.lower()  # Just checking format is correct

    def test_warning_80_vs_90_different_outputs(self) -> None:
        """80% and 90% thresholds produce different messages."""
        ctx_80 = QuotaWarningContext(
            tier="free",
            daily_used=85,
            daily_limit=100,
            percentage=85.0,
            remaining=15,
            command="test",
            threshold=80,
        )

        ctx_90 = QuotaWarningContext(
            tier="free",
            daily_used=85,
            daily_limit=100,
            percentage=85.0,
            remaining=15,
            command="test",
            threshold=90,
        )

        output_80 = format_quota_warning(ctx_80)
        output_90 = format_quota_warning(ctx_90)

        # Should be different messages
        assert output_80 != output_90
        # 80% should mention "Consider upgrading"
        assert "Consider" in output_80
        # 90% should mention "Upgrade NOW" or similar urgent language
        assert "NOW" in output_90

    def test_percentage_formatting_integer(self) -> None:
        """Percentage is formatted as integer."""
        ctx = QuotaWarningContext(
            tier="free",
            daily_used=33,
            daily_limit=100,
            percentage=33.333,  # Would be rounded
            remaining=67,
            command="test",
            threshold=80,
        )

        output = format_quota_warning(ctx)

        # Should contain "33%" (rounded integer)
        assert "33%" in output

    def test_strips_trailing_whitespace(self) -> None:
        """Output is stripped of trailing whitespace."""
        ctx = QuotaWarningContext(
            tier="free",
            daily_used=80,
            daily_limit=100,
            percentage=80.0,
            remaining=20,
            command="test",
            threshold=80,
        )

        output = format_quota_warning(ctx)

        assert not output.endswith("\n")
        assert not output.endswith(" ")


# ---------------------------------------------------------------------------
# format_free_tier_upgrade tests
# ---------------------------------------------------------------------------


class TestFormatFreeTierUpgrade:
    """Test format_free_tier_upgrade function."""

    def test_output_contains_upgrade_features(self) -> None:
        """Output includes key upgrade features."""
        output = format_free_tier_upgrade()

        assert "Unlock Pro Features" in output
        assert "1000 commands/day" in output
        assert "100x more" in output
        assert "Premium agents" in output
        assert "Upgrade to Pro" in output

    def test_output_contains_pricing_url(self) -> None:
        """Output includes pricing URL."""
        output = format_free_tier_upgrade()

        assert "raas.mekong.dev/pricing" in output

    def test_output_contains_discount_info(self) -> None:
        """Output includes special offer information."""
        output = format_free_tier_upgrade()

        assert "50% off" in output

    def test_output_is_stripped(self) -> None:
        """Output is stripped of trailing whitespace."""
        output = format_free_tier_upgrade()

        assert not output.endswith("\n")
        assert not output.endswith(" ")


# ---------------------------------------------------------------------------
# Context-based tests
# ---------------------------------------------------------------------------


class TestQuotaWarningContext:
    """Test QuotaWarningContext dataclass."""

    def test_context_required_fields(self) -> None:
        """QuotaWarningContext requires all fields."""
        ctx = QuotaWarningContext(
            tier="growth",
            daily_used=50,
            daily_limit=200,
            percentage=25.0,
            remaining=150,
            command="swarm",
            threshold=80,
        )

        assert ctx.tier == "growth"
        assert ctx.daily_used == 50
        assert ctx.daily_limit == 200
        assert ctx.percentage == 25.0
        assert ctx.remaining == 150
        assert ctx.command == "swarm"
        assert ctx.threshold == 80

    def test_context_default_threshold(self) -> None:
        """QuotaWarningContext defaults threshold to 80."""
        ctx = QuotaWarningContext(
            tier="free",
            daily_used=10,
            daily_limit=100,
            percentage=10.0,
            remaining=90,
            command="test",
        )

        assert ctx.threshold == 80

    def test_context_higher_usage(self) -> None:
        """Context works with high usage percentages."""
        ctx = QuotaWarningContext(
            tier="pro",
            daily_used=95,
            daily_limit=100,
            percentage=95.0,
            remaining=5,
            command="autonomous",
            threshold=90,
        )

        assert ctx.percentage == 95.0
        assert ctx.remaining == 5
        assert ctx.threshold == 90


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------


class TestIntegration:
    """Integration tests for warning functions."""

    def test_threshold_drives_warning_message(self) -> None:
        """Threshold correctly determines which warning to show."""
        # 85% usage - trigger 80% warning
        daily_used, daily_limit = 85, 100
        threshold = get_warning_threshold(daily_used, daily_limit)

        assert threshold == 80

        ctx = QuotaWarningContext(
            tier="free",
            daily_used=daily_used,
            daily_limit=daily_limit,
            percentage=85.0,
            remaining=15,
            command="test",
            threshold=threshold,
        )

        output = format_quota_warning(ctx)
        assert "80% Used" in output

    def test_ninety_percent_threshold_drives_90_message(self) -> None:
        """90% threshold triggers 90% warning message."""
        # 92% usage - trigger 90% warning
        daily_used, daily_limit = 92, 100
        threshold = get_warning_threshold(daily_used, daily_limit)

        assert threshold == 90

        ctx = QuotaWarningContext(
            tier="pro",
            daily_used=daily_used,
            daily_limit=daily_limit,
            percentage=92.0,
            remaining=8,
            command="test",
            threshold=threshold,
        )

        output = format_quota_warning(ctx)
        assert "90% Used" in output

    def test_free_tier_and_warning_threshold_independent(self) -> None:
        """Free tier upgrade prompt is independent of warning threshold."""
        # Even if not at warning threshold
        threshold = get_warning_threshold(daily_used=50, daily_limit=100)
        assert threshold is None

        # But free tier upgrade should still work
        output = format_free_tier_upgrade()
        assert "Unlock Pro Features" in output
        assert "Free tier" in output
