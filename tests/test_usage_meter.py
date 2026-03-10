"""Tests for Usage Meter — Quota Validation and Logging."""

from unittest.mock import AsyncMock, patch

import pytest

from src.lib.usage_meter import UsageMeter, get_meter
from src.lib.license_generator import get_tier_limits


class TestUsageMeterQuotaValidation:
    """Test quota validation in UsageMeter."""

    @pytest.mark.asyncio
    async def test_record_usage_with_valid_quota(self) -> None:
        """Test that usage within quota is accepted."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 5}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()
            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="pro",
                commands_count=1,
            )

            assert allowed is True
            assert error == ""
            mock_repo.return_value.record_usage.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_usage_with_exceeded_quota_rejected(self) -> None:
        """Test that usage exceeding quota is rejected."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            limits = get_tier_limits("free")
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": limits["commands_per_day"]}
            )

            meter = UsageMeter()
            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="free",
                commands_count=1,
            )

            assert allowed is False
            assert "limit" in error.lower()
            mock_repo.return_value.record_usage.assert_not_called()

    @pytest.mark.asyncio
    async def test_record_usage_multiple_commands(self) -> None:
        """Test recording multiple commands at once."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 10}
            )
            mock_repo.return_value.record_usage = AsyncMock()

            meter = UsageMeter()
            allowed, error = await meter.record_usage(
                key_id="test-key",
                tier="enterprise",
                commands_count=5,
            )

            assert allowed is True
            assert error == ""
            mock_repo.return_value.record_usage.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_usage_summary(self) -> None:
        """Test getting usage summary."""
        with patch("src.lib.usage_meter.get_repository") as mock_repo:
            mock_repo.return_value.get_license_by_key_id = AsyncMock(
                return_value={"tier": "pro", "key_id": "test-key"}
            )
            mock_repo.return_value.get_usage = AsyncMock(
                return_value={"commands_count": 50}
            )
            mock_repo.return_value.get_usage_summary = AsyncMock(
                return_value={"commands_count": 50, "limit": 1000}
            )

            meter = UsageMeter()
            summary = await meter.get_usage_summary("test-key")

            assert summary is not None
            mock_repo.return_value.get_license_by_key_id.assert_called_once()


class TestUsageMeterGlobalInstance:
    """Test global meter instance."""

    def test_get_meter_singleton(self) -> None:
        """Test that get_meter returns same instance."""
        meter1 = get_meter()
        meter2 = get_meter()

        assert meter1 is meter2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
