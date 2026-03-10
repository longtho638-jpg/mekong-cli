"""
Tests for CLI Update Checker

Tests the update checker functionality including:
- Version comparison
- RaaS Gateway integration
- Critical update detection
- Cache management
- Blocking enforcement
"""

import asyncio
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from src.cli.update_checker import (
    UpdateChecker,
    UpdateCache,
    get_update_checker,
    check_for_updates_async,
)


class TestUpdateCache:
    """Test UpdateCache dataclass."""

    def test_is_expired_false_when_fresh(self):
        """Cache should not be expired if created within 24h."""
        cache = UpdateCache(
            checked_at=datetime.now(timezone.utc),
            latest_version="0.2.0",
            update_available=False,
        )
        assert not cache.is_expired

    def test_is_expired_true_when_old(self):
        """Cache should be expired if older than 24h."""
        old_time = datetime.now(timezone.utc) - timedelta(hours=25)
        cache = UpdateCache(
            checked_at=old_time,
            latest_version="0.2.0",
            update_available=False,
        )
        assert cache.is_expired

    def test_should_check_when_no_cache(self):
        """Should check when cache is empty (datetime.min)."""
        cache = UpdateCache(
            checked_at=datetime.min.replace(tzinfo=timezone.utc),
        )
        assert cache.should_check

    def test_should_check_when_expired(self):
        """Should check when cache is expired."""
        old_time = datetime.now(timezone.utc) - timedelta(hours=25)
        cache = UpdateCache(
            checked_at=old_time,
        )
        assert cache.should_check

    def test_should_not_check_when_valid(self):
        """Should not check when cache is still valid."""
        recent_time = datetime.now(timezone.utc) - timedelta(hours=1)
        cache = UpdateCache(
            checked_at=recent_time,
        )
        assert not cache.should_check

    def test_to_dict_serialization(self):
        """Cache should serialize to dict correctly."""
        cache = UpdateCache(
            checked_at=datetime(2026, 3, 9, 12, 0, 0, tzinfo=timezone.utc),
            latest_version="0.2.0",
            update_available=True,
            last_notified_version="0.1.0",
        )
        data = cache.to_dict()
        assert data["latest_version"] == "0.2.0"
        assert data["update_available"] is True
        assert data["last_notified_version"] == "0.1.0"

    def test_from_dict_deserialization(self):
        """Cache should deserialize from dict correctly."""
        data = {
            "checked_at": "2026-03-09T12:00:00+00:00",
            "latest_version": "0.2.0",
            "update_available": True,
            "last_notified_version": "0.1.0",
        }
        cache = UpdateCache.from_dict(data)
        assert cache.latest_version == "0.2.0"
        assert cache.update_available is True
        assert cache.last_notified_version == "0.1.0"


class TestUpdateCheckerVersionComparison:
    """Test version comparison logic."""

    def setup_method(self):
        """Set up test fixtures."""
        self.checker = UpdateChecker()

    def test_is_newer_version_true(self):
        """Should detect newer version correctly."""
        assert self.checker._is_newer_version("0.2.0", "0.1.0") is True
        assert self.checker._is_newer_version("1.0.0", "0.9.9") is True
        assert self.checker._is_newer_version("0.2.1", "0.2.0") is True

    def test_is_newer_version_false(self):
        """Should detect same or older version correctly."""
        assert self.checker._is_newer_version("0.1.0", "0.2.0") is False
        assert self.checker._is_newer_version("0.2.0", "0.2.0") is False
        assert self.checker._is_newer_version("1.0.0", "1.0.1") is False

    def test_is_newer_version_with_v_prefix(self):
        """Should handle v prefix in version strings."""
        assert self.checker._is_newer_version("v0.2.0", "v0.1.0") is True
        assert self.checker._is_newer_version("0.2.0", "v0.1.0") is True

    def test_is_newer_version_invalid_input(self):
        """Should handle invalid version strings gracefully."""
        assert self.checker._is_newer_version("invalid", "0.1.0") is False
        assert self.checker._is_newer_version("0.2.0", "invalid") is False


class TestUpdateCheckerWithMockGateway:
    """Test UpdateChecker with mocked gateway."""

    def setup_method(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.cache_file = Path(self.temp_dir.name) / "update_check.json"

        # Mock gateway client
        self.mock_gateway = Mock()

        # Create checker with mock gateway
        with patch.object(UpdateChecker, '_load_cache', return_value=UpdateCache(
            checked_at=datetime.min.replace(tzinfo=timezone.utc)
        )):
            self.checker = UpdateChecker(gateway_client=self.mock_gateway)
            self.checker.cache_path = self.cache_file

    def teardown_method(self):
        """Clean up test fixtures."""
        self.temp_dir.cleanup()

    @pytest.mark.asyncio
    async def test_check_version_returns_none_when_current(self):
        """Should return None when already on latest version."""
        # Mock gateway response
        mock_response = Mock()
        mock_response.data = {
            "latest_version": "0.2.0",
        }
        self.mock_gateway.get.return_value = mock_response

        with patch('importlib.metadata.version', return_value="0.2.0"):
            result = await self.checker.check_version()
            assert result is None

    @pytest.mark.asyncio
    async def test_check_version_returns_update_available(self):
        """Should return UpdateAvailable when newer version exists."""
        # Mock gateway response
        mock_response = Mock()
        mock_response.data = {
            "latest_version": "0.3.0",
            "download_url": "https://example.com/download.tar.gz",
            "checksum_url": "https://example.com/checksum.txt",
            "signature_url": "https://example.com/signature.sig",
            "is_critical": False,
            "is_security_update": False,
            "release_notes": "Bug fixes",
            "released_at": "2026-03-09T12:00:00Z",
            "changelog_url": "https://example.com/changelog",
        }
        self.mock_gateway.get.return_value = mock_response

        with patch('importlib.metadata.version', return_value="0.2.0"):
            result = await self.checker.check_version()
            assert result is not None
            assert result.latest_version == "0.3.0"
            assert result.current_version == "0.2.0"
            assert result.is_critical is False

    @pytest.mark.asyncio
    async def test_check_version_handles_gateway_timeout(self):
        """Should fail silently on gateway timeout."""
        async def timeout_side_effect(*args, **kwargs):
            raise asyncio.TimeoutError()

        self.mock_gateway.get.side_effect = timeout_side_effect

        with patch('importlib.metadata.version', return_value="0.2.0"):
            result = await self.checker.check_version()
            assert result is None

    @pytest.mark.asyncio
    async def test_check_version_handles_gateway_error(self):
        """Should fail silently on gateway error."""
        self.mock_gateway.get.side_effect = Exception("Gateway error")

        with patch('importlib.metadata.version', return_value="0.2.0"):
            result = await self.checker.check_version()
            assert result is None

    @pytest.mark.asyncio
    async def test_critical_update_detection(self):
        """Should detect critical updates from gateway response."""
        # Mock gateway response with critical update
        mock_response = Mock()
        mock_response.data = {
            "latest_version": "0.3.0",
            "is_critical": True,
            "is_security_update": False,
        }
        self.mock_gateway.get.return_value = mock_response

        with patch('importlib.metadata.version', return_value="0.2.0"):
            result = await self.checker.check_version()
            assert result is not None
            assert result.is_critical is True

    def test_cache_prevents_redundant_checks(self):
        """Should use cached result within 24h TTL."""
        # Set up checker with fresh cache
        recent_time = datetime.now(timezone.utc) - timedelta(hours=1)
        self.checker.cache = UpdateCache(
            checked_at=recent_time,
            latest_version="0.2.0",
            update_available=False,
        )

        assert not self.checker.should_check()

    def test_should_block_execution_for_critical(self):
        """Should block execution for critical updates."""
        # Set up cache with critical update pending
        self.checker.cache = UpdateCache(
            checked_at=datetime.now(timezone.utc),
            latest_version="0.3.0",
            update_available=True,
            update_info={
                "critical_pending": True,
                "critical_version": "0.3.0",
            },
        )

        assert self.checker.should_block_execution()

    def test_should_not_block_execution_when_no_critical(self):
        """Should not block execution when no critical update."""
        self.checker.cache = UpdateCache(
            checked_at=datetime.now(timezone.utc),
            latest_version="0.2.0",
            update_available=False,
        )

        assert not self.checker.should_block_execution()


class TestUpdateCheckerIntegration:
    """Integration tests for UpdateChecker."""

    def test_get_update_checker_singleton(self):
        """Should return same instance on multiple calls."""
        checker1 = get_update_checker()
        checker2 = get_update_checker()
        assert checker1 is checker2

    @pytest.mark.asyncio
    async def test_check_for_updates_async(self):
        """Async wrapper should work correctly."""
        with patch('src.cli.update_checker.get_update_checker') as mock_get:
            mock_checker = Mock()
            mock_checker.should_check.return_value = False
            mock_get.return_value = mock_checker

            result = await check_for_updates_async()
            assert result is None
