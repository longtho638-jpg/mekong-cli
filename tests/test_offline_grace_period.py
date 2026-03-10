"""
Tests for Offline Grace Period — ROIaaS Phase 6d

Test offline mode, grace period expiration, and fallback behavior.
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

from src.raas.quota_cache import (
    QuotaState,
    QuotaCache,
    cache_quota,
    GRACE_PERIOD_SECONDS,
)


class TestQuotaStateGracePeriod:
    """Test QuotaState grace period methods."""

    def test_is_in_grace_period_true(self):
        """Should return True if within 24h grace period."""
        now = datetime.now(timezone.utc)
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=now.isoformat(),
            grace_period_remaining=GRACE_PERIOD_SECONDS,  # 24h
        )
        assert state.is_in_grace_period() is True

    def test_is_in_grace_period_false(self):
        """Should return False if grace period expired."""
        old_time = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=old_time,
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )
        assert state.is_in_grace_period() is False

    def test_is_in_grace_period_no_validation_timestamp(self):
        """Should return False if no validation timestamp."""
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation="",
        )
        assert state.is_in_grace_period() is False

    def test_remaining_grace_seconds(self):
        """Should return remaining seconds in grace period."""
        now = datetime.now(timezone.utc)
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=now.isoformat(),
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )
        remaining = state.remaining_grace_seconds()
        # Should be close to 24h (86400 seconds)
        assert 86000 < remaining <= 86400

    def test_remaining_grace_hours(self):
        """Should return remaining hours (rounded)."""
        now = datetime.now(timezone.utc)
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=now.isoformat(),
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )
        hours = state.remaining_grace_hours()
        assert 23.0 <= hours <= 24.0

    def test_remaining_grace_seconds_zero(self):
        """Should return 0 if grace period expired."""
        old_time = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
        state = QuotaState(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=old_time,
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )
        assert state.remaining_grace_seconds() == 0


class TestQuotaCacheGracePeriod:
    """Test QuotaCache with grace period fields."""

    @pytest.fixture
    def cache(self, tmp_path):
        """Create test cache instance."""
        return QuotaCache(db_path=tmp_path / "test_cache.db", ttl_seconds=60)

    def test_set_with_grace_period(self, cache):
        """Should cache state with grace period fields."""
        state = cache.set(
            key_id="test-key",
            daily_used=10,
            daily_limit=100,
            tier="pro",
            grace_period_remaining=GRACE_PERIOD_SECONDS,
            last_online_validation=datetime.now(timezone.utc).isoformat(),
            is_offline_mode=False,
        )
        assert state.key_id == "test-key"
        assert state.daily_used == 10
        assert state.grace_period_remaining == GRACE_PERIOD_SECONDS
        assert state.is_offline_mode is False

    def test_get_with_grace_period(self, cache):
        """Should retrieve state with grace period fields."""
        now = datetime.now(timezone.utc)
        cache.set(
            key_id="test-key",
            daily_used=10,
            daily_limit=100,
            tier="pro",
            grace_period_remaining=GRACE_PERIOD_SECONDS,
            last_online_validation=now.isoformat(),
            is_offline_mode=False,
        )

        retrieved = cache.get("test-key")
        assert retrieved is not None
        assert retrieved.key_id == "test-key"
        assert retrieved.grace_period_remaining == GRACE_PERIOD_SECONDS
        assert retrieved.is_offline_mode is False

    def test_offline_mode_state(self, cache):
        """Should cache offline mode state correctly."""
        cache.set(
            key_id="test-key",
            daily_used=10,
            daily_limit=100,
            tier="pro",
            is_offline_mode=True,
            last_online_validation="",  # Empty in offline mode
        )

        retrieved = cache.get("test-key")
        assert retrieved is not None
        assert retrieved.is_offline_mode is True


class TestCacheQuotaFunction:
    """Test cache_quota helper function with grace period."""

    @patch("src.raas.quota_cache.get_cache")
    def test_cache_quota_with_offline_mode(self, mock_get_cache):
        """Should cache with offline mode flags."""
        mock_cache = MagicMock()
        mock_get_cache.return_value = mock_cache

        cache_quota(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            is_offline_mode=True,
            grace_period_remaining=43200,  # 12h
        )

        assert mock_cache.set.called
        call_kwargs = mock_cache.set.call_args[1]
        assert call_kwargs["is_offline_mode"] is True
        assert call_kwargs["grace_period_remaining"] == 43200


class TestGracePeriodIntegration:
    """Integration tests for grace period behavior."""

    def test_full_grace_period_lifecycle(self, tmp_path):
        """Test full lifecycle: set → check → expire."""
        cache = QuotaCache(db_path=tmp_path / "test.db", ttl_seconds=60)

        # Set with fresh validation
        now = datetime.now(timezone.utc)
        cache.set(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=now.isoformat(),
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )

        # Should be in grace period
        state = cache.get("test-key")
        assert state is not None
        assert state.is_in_grace_period() is True
        assert state.remaining_grace_seconds() > 0

        # Simulate expired grace period by setting old timestamp
        old_time = (now - timedelta(hours=25)).isoformat()
        cache.set(
            key_id="test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            last_online_validation=old_time,
            grace_period_remaining=GRACE_PERIOD_SECONDS,
        )

        # Should no longer be in grace period
        state = cache.get("test-key")
        assert state is not None
        assert state.is_in_grace_period() is False
        assert state.remaining_grace_seconds() == 0
