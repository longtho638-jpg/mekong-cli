"""Tests for Usage Meter — Timestamp Validation and Logging."""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.lib.usage_meter import UsageMeter, get_meter, record_usage, get_usage_summary


class TestUsageMeterTimestampValidation:
    """Test timestamp validation in UsageMeter."""

    @pytest.mark.asyncio
    async def test_record_usage_with_valid_timestamp(self) -> None:
        """Test that valid timestamp is accepted."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 5}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()
            # Timestamp 10 seconds ago (should be accepted)
            timestamp = datetime.now(timezone.utc) - timedelta(seconds=10)

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            assert allowed is True
            assert error == ""
            mock_repo.return_value.record_usage.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_usage_with_old_timestamp_rejected(self) -> None:
        """Test that timestamp > 300s old is rejected."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )

            meter = UsageMeter()
            # Timestamp 400 seconds ago (should be rejected)
            timestamp = datetime.now(timezone.utc) - timedelta(seconds=400)

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            assert allowed is False
            assert "timestamp too old" in error.lower()
            mock_repo.return_value.record_usage.assert_not_called()

    @pytest.mark.asyncio
    async def test_record_usage_with_future_timestamp_rejected(self) -> None:
        """Test that future timestamp is rejected."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )

            meter = UsageMeter()
            # Timestamp 400 seconds in future (should be rejected)
            timestamp = datetime.now(timezone.utc) + timedelta(seconds=400)

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            assert allowed is False
            assert "timestamp too old" in error.lower()

    @pytest.mark.asyncio
    async def test_record_usage_without_timestamp_uses_now(self) -> None:
        """Test that missing timestamp defaults to current time."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                # No event_timestamp provided
            )

            assert allowed is True
            assert error == ""
            mock_repo.return_value.record_usage.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_usage_with_timezone_naive_timestamp(self) -> None:
        """Test that timezone-naive timestamp is handled as UTC."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()
            # Timezone-naive timestamp in UTC (should be treated as UTC)
            # Use datetime.now(timezone.utc) to ensure we're within valid window
            timestamp = datetime.now(timezone.utc).replace(tzinfo=None)
            assert timestamp.tzinfo is None

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            assert allowed is True

    @pytest.mark.asyncio
    async def test_record_usage_at_boundary_300_seconds(self) -> None:
        """Test timestamp exactly at 300s boundary."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()
            # Timestamp at 299 seconds (should be accepted)
            timestamp = datetime.now(timezone.utc) - timedelta(seconds=299)

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            # Should be accepted (under boundary)
            assert allowed is True

    @pytest.mark.asyncio
    async def test_record_usage_at_boundary_301_seconds(self) -> None:
        """Test timestamp 1 second over boundary."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 0}
            )

            meter = UsageMeter()
            # Timestamp at 301 seconds (should be rejected)
            timestamp = datetime.now(timezone.utc) - timedelta(seconds=301)

            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
                event_timestamp=timestamp,
            )

            assert allowed is False
            assert "timestamp" in error.lower()


class TestUsageMeterTierLimits:
    """Test tier limit enforcement."""

    @pytest.mark.asyncio
    async def test_record_usage_within_limit(self) -> None:
        """Test usage recording within daily limit."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 50}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()

            allowed, error = await meter.record_usage(
                key_id="pro-key",
                tier="pro",
                commands_count=1,
            )

            assert allowed is True

    @pytest.mark.asyncio
    async def test_record_usage_at_limit(self) -> None:
        """Test usage recording at daily limit."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            # Pro tier limit is 1000 commands/day
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 1000}
            )

            meter = UsageMeter()

            allowed, error = await meter.record_usage(
                key_id="pro-key",
                tier="pro",
                commands_count=1,
            )

            assert allowed is False
            assert "Daily limit reached" in error

    @pytest.mark.asyncio
    async def test_record_usage_unlimited_tier(self) -> None:
        """Test enterprise tier with unlimited usage."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            # Enterprise has -1 (unlimited)
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 999999}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()

            allowed, error = await meter.record_usage(
                key_id="enterprise-key",
                tier="enterprise",
                commands_count=1,
            )

            assert allowed is True


class TestUsageMeterGlobalFunctions:
    """Test global helper functions."""

    def test_get_meter_returns_singleton(self) -> None:
        """Test that get_meter returns same instance."""
        m1 = get_meter()
        m2 = get_meter()

        assert m1 is m2

    @pytest.mark.asyncio
    async def test_record_usage_global_function(self) -> None:
        """Test global record_usage function."""
        with patch("src.lib.usage_meter.get_meter") as mock_get:
            mock_meter = MagicMock()
            mock_meter.record_usage = AsyncMock(return_value=(True, ""))
            mock_get.return_value = mock_meter

            allowed, error = await record_usage("key123", "pro")

            assert allowed is True
            mock_meter.record_usage.assert_called_once_with("key123", "pro")

    @pytest.mark.asyncio
    async def test_get_usage_summary_global_function(self) -> None:
        """Test global get_usage_summary function."""
        with patch("src.lib.usage_meter.get_meter") as mock_get:
            mock_meter = MagicMock()
            mock_meter.get_usage_summary = AsyncMock(
                return_value={"commands_today": 10, "daily_limit": 1000}
            )
            mock_get.return_value = mock_meter

            summary = await get_usage_summary("key123")

            assert summary["commands_today"] == 10
            mock_meter.get_usage_summary.assert_called_once_with("key123")
