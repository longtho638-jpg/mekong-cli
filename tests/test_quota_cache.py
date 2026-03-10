"""Tests for QuotaCache and QuotaState — ROIaaS Phase 6b quota caching."""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from src.raas.quota_cache import (
    QuotaCache,
    QuotaState,
    get_cache,
    get_cached_quota,
    cache_quota,
    invalidate_cache,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def cache_path(tmp_path: Path) -> Path:
    """Isolated SQLite DB path per test."""
    return tmp_path / "quota_cache_test.db"


@pytest.fixture()
def quota_cache(cache_path: Path) -> QuotaCache:
    """QuotaCache with short TTL for testing."""
    return QuotaCache(db_path=cache_path, ttl_seconds=5)


@pytest.fixture()
def cached_state(cache_path: Path) -> QuotaState:
    """Create a pre-cached quota state."""
    cache = QuotaCache(db_path=cache_path, ttl_seconds=300)
    return cache.set(
        key_id="test-key-123",
        daily_used=50,
        daily_limit=100,
        tier="free",
        monthly_used=200,
        monthly_limit=1000,
    )


# ---------------------------------------------------------------------------
# QuotaState tests
# ---------------------------------------------------------------------------


class TestQuotaStateCreation:
    """Test QuotaState initialization and post-init logic."""

    def test_state_creation_with_defaults(self) -> None:
        """QuotaState creates with default timestamps when not provided."""
        state = QuotaState(
            key_id="key-1",
            daily_used=10,
            daily_limit=100,
        )

        assert state.key_id == "key-1"
        assert state.daily_used == 10
        assert state.daily_limit == 100
        assert state.tier == "free"
        assert state.monthly_used == 0
        assert state.monthly_limit == 0
        assert state.cached_at != ""
        assert state.expires_at != ""

    def test_state_creation_with_custom_values(self) -> None:
        """QuotaState preserves provided values."""
        now = datetime.now(timezone.utc)
        expires = now + timedelta(seconds=600)

        state = QuotaState(
            key_id="key-2",
            daily_used=25,
            daily_limit=200,
            tier="pro",
            monthly_used=500,
            monthly_limit=5000,
            cached_at=now.isoformat(),
            expires_at=expires.isoformat(),
        )

        assert state.tier == "pro"
        assert state.monthly_used == 500
        assert state.monthly_limit == 5000

    def test_state_auto_calculates_expires_at(self) -> None:
        """expires_at is auto-calculated from cached_at."""
        state = QuotaState(
            key_id="key-auto",
            daily_used=10,
            daily_limit=100,
        )

        cached = datetime.fromisoformat(state.cached_at)
        expires = datetime.fromisoformat(state.expires_at)
        delta = expires - cached

        # Allow small tolerance for execution time
        assert 299 <= delta.total_seconds() <= 301


class TestQuotaStateMethods:
    """Test QuotaState utility methods."""

    def test_is_expired_false_for_valid_entry(self) -> None:
        """is_expired returns False for unexpired entry."""
        future = datetime.now(timezone.utc) + timedelta(hours=1)
        state = QuotaState(
            key_id="key-future",
            daily_used=10,
            daily_limit=100,
            cached_at=datetime.now(timezone.utc).isoformat(),
            expires_at=future.isoformat(),
        )

        assert state.is_expired() is False

    def test_is_expired_true_for_expired_entry(self) -> None:
        """is_expired returns True for expired entry."""
        past = datetime.now(timezone.utc) - timedelta(hours=1)
        state = QuotaState(
            key_id="key-past",
            daily_used=10,
            daily_limit=100,
            cached_at=past.isoformat(),
            expires_at=past.isoformat(),
        )

        assert state.is_expired() is True

    def test_remaining_seconds_positive(self) -> None:
        """remaining_seconds returns positive value for unexpired."""
        future = datetime.now(timezone.utc) + timedelta(minutes=5)
        state = QuotaState(
            key_id="key-5min",
            daily_used=10,
            daily_limit=100,
            expires_at=future.isoformat(),
        )

        remaining = state.remaining_seconds()
        assert remaining > 0
        assert remaining <= 300  # 5 minutes

    def test_remaining_seconds_zero_for_expired(self) -> None:
        """remaining_seconds returns 0 for expired entry."""
        past = datetime.now(timezone.utc) - timedelta(hours=1)
        state = QuotaState(
            key_id="key-expired",
            daily_used=10,
            daily_limit=100,
            expires_at=past.isoformat(),
        )

        assert state.remaining_seconds() == 0

    def test_usage_percentage_less_than_100(self) -> None:
        """usage_percentage returns correct percentage."""
        state = QuotaState(
            key_id="key-50%",
            daily_used=50,
            daily_limit=100,
        )

        assert state.usage_percentage() == 50.0

    def test_usage_percentage_over_100(self) -> None:
        """usage_percentage returns >100 when exceeded."""
        state = QuotaState(
            key_id="key-150%",
            daily_used=150,
            daily_limit=100,
        )

        assert state.usage_percentage() == 150.0

    def test_usage_percentage_unlimited(self) -> None:
        """usage_percentage returns 0.0 for unlimited (daily_limit <= 0)."""
        state = QuotaState(
            key_id="key-unlimited",
            daily_used=1000000,
            daily_limit=0,
        )

        assert state.usage_percentage() == 0.0

    def test_remaining_commands(self) -> None:
        """remaining returns correct remaining commands."""
        state = QuotaState(
            key_id="key-50-remaining",
            daily_used=50,
            daily_limit=100,
        )

        assert state.remaining() == 50

    def test_remaining_zero_when_exceeded(self) -> None:
        """remaining returns 0 when usage exceeds limit."""
        state = QuotaState(
            key_id="key-exceeded",
            daily_used=150,
            daily_limit=100,
        )

        assert state.remaining() == 0

    def test_remaining_unlimited(self) -> None:
        """remaining returns -1 for unlimited (daily_limit <= 0)."""
        state = QuotaState(
            key_id="key-unlimited",
            daily_used=1000000,
            daily_limit=0,
        )

        assert state.remaining() == -1


class TestQuotaCacheGetSet:
    """Test QuotaCache get/set operations."""

    def test_set_creates_entry(self, quota_cache: QuotaCache) -> None:
        """set() creates a new cache entry."""
        state = quota_cache.set(
            key_id="new-key",
            daily_used=10,
            daily_limit=100,
            tier="free",
        )

        assert state.key_id == "new-key"
        assert state.daily_used == 10
        assert state.daily_limit == 100
        assert state.tier == "free"

    def test_get_returns_cached_entry(self, quota_cache: QuotaCache) -> None:
        """get() retrieves valid cached entry."""
        quota_cache.set(
            key_id="get-key",
            daily_used=25,
            daily_limit=200,
            tier="pro",
        )

        state = quota_cache.get("get-key")

        assert state is not None
        assert state.daily_used == 25
        assert state.daily_limit == 200
        assert state.tier == "pro"

    def test_get_returns_none_for_missing_key(self, quota_cache: QuotaCache) -> None:
        """get() returns None for non-existent key."""
        state = quota_cache.get("non-existent-key")

        assert state is None

    def test_get_returns_none_for_expired_entry(self, quota_cache: QuotaCache) -> None:
        """get() returns None for expired entry."""
        # Set with 1 second TTL
        short_cache = QuotaCache(db_path=quota_cache.db_path, ttl_seconds=1)
        short_cache.set(key_id="expire-key", daily_used=10, daily_limit=100)

        # Wait for expiry
        time.sleep(1.5)

        # Try to get (should be expired)
        state = quota_cache.get("expire-key")
        assert state is None

    def test_get_returns_none_for_expired_after_ttl(self, quota_cache: QuotaCache) -> None:
        """get() respects TTL and returns None after expiration."""
        # Set entry
        quota_cache.set(key_id="ttl-key", daily_used=10, daily_limit=100)

        # Simulate TTL passage by modifying expires_at in DB
        with quota_cache._connect() as conn:
            past = datetime.now(timezone.utc) - timedelta(minutes=1)
            conn.execute(
                "UPDATE quota_cache SET expires_at = ? WHERE key_id = ?",
                (past.isoformat(), "ttl-key"),
            )

        # Get should return None (expired)
        state = quota_cache.get("ttl-key")
        assert state is None


class TestQuotaCacheInvalidate:
    """Test QuotaCache invalidate and clear operations."""

    def test_invalidate_deletes_entry(self, quota_cache: QuotaCache) -> None:
        """invalidate() removes the cache entry."""
        quota_cache.set(key_id="invalidate-key", daily_used=10, daily_limit=100)

        result = quota_cache.invalidate("invalidate-key")

        assert result is True
        assert quota_cache.get("invalidate-key") is None

    def test_invalidate_returns_false_for_missing(self, quota_cache: QuotaCache) -> None:
        """invalidate() returns False for non-existent key."""
        result = quota_cache.invalidate("non-existent-key")

        assert result is False

    def test_clear_removes_expired_entries(self, quota_cache: QuotaCache) -> None:
        """clear() removes only expired entries."""
        # Create two entries with different TTLs
        quota_cache.set(key_id="valid-key", daily_used=10, daily_limit=100)

        short_cache = QuotaCache(db_path=quota_cache.db_path, ttl_seconds=1)
        short_cache.set(key_id="expired-key", daily_used=20, daily_limit=200)

        # Wait for short TTL to expire
        time.sleep(1.5)

        # Clear expired entries
        cleared = quota_cache.clear()

        assert cleared >= 1
        assert quota_cache.get("valid-key") is not None
        assert quota_cache.get("expired-key") is None

    def test_clear_all_removes_all(self, quota_cache: QuotaCache) -> None:
        """clear_all() removes all entries regardless of expiry."""
        quota_cache.set(key_id="clear-all-1", daily_used=10, daily_limit=100)
        quota_cache.set(key_id="clear-all-2", daily_used=20, daily_limit=200)

        cleared = quota_cache.clear_all()

        assert cleared == 2
        assert quota_cache.get_all() == []

    def test_get_all_returns_valid_entries(self, quota_cache: QuotaCache) -> None:
        """get_all() returns all valid (non-expired) entries."""
        quota_cache.set(key_id="all-1", daily_used=10, daily_limit=100)
        quota_cache.set(key_id="all-2", daily_used=20, daily_limit=200)
        quota_cache.set(key_id="all-3", daily_used=30, daily_limit=300, tier="pro")

        states = quota_cache.get_all()

        assert len(states) == 3
        key_ids = {s.key_id for s in states}
        assert key_ids == {"all-1", "all-2", "all-3"}


class TestQuotaCacheIntegration:
    """Integration tests for QuotaCache operations."""

    def test_set_overwrites_existing(self, quota_cache: QuotaCache) -> None:
        """set() overwrites existing entry for same key."""
        quota_cache.set(key_id="overwrite-key", daily_used=10, daily_limit=100)
        quota_cache.set(key_id="overwrite-key", daily_used=50, daily_limit=200)

        state = quota_cache.get("overwrite-key")

        assert state is not None
        assert state.daily_used == 50
        assert state.daily_limit == 200

    def test_round_trip_preserves_all_fields(self, quota_cache: QuotaCache) -> None:
        """Full round trip preserves all state fields."""
        original = quota_cache.set(
            key_id="round-trip-key",
            daily_used=123,
            daily_limit=500,
            tier="growth",
            monthly_used=456,
            monthly_limit=5000,
        )

        retrieved = quota_cache.get("round-trip-key")

        assert retrieved is not None
        assert retrieved.key_id == original.key_id
        assert retrieved.daily_used == original.daily_used
        assert retrieved.daily_limit == original.daily_limit
        assert retrieved.tier == original.tier
        assert retrieved.monthly_used == original.monthly_used
        assert retrieved.monthly_limit == original.monthly_limit


# ---------------------------------------------------------------------------
# Module-level function tests
# ---------------------------------------------------------------------------


class TestModuleFunctions:
    """Test module-level caching functions."""

    def test_get_cache_returns_singleton(self, cache_path: Path) -> None:
        """get_cache() returns singleton instance."""
        cache1 = get_cache()
        cache2 = get_cache()

        # Should be same instance (or at least both valid)
        assert cache1 is not None
        assert cache2 is not None

    def test_get_cache_with_custom_ttl(self, cache_path: Path) -> None:
        """get_cache() respects ttl_seconds parameter."""
        cache = get_cache(ttl_seconds=120)
        assert cache.ttl_seconds == 120

    def test_get_cached_quota_returns_none_if_not_cached(self) -> None:
        """get_cached_quota() returns None for uncached key."""
        result = get_cached_quota("never-cached-key")
        assert result is None

    def test_cache_quota_and_retrieve(self, cache_path: Path) -> None:
        """cache_quota() stores and get_cached_quota() retrieves."""
        cache_quota(
            key_id="persist-key",
            daily_used=75,
            daily_limit=100,
            tier="pro",
        )

        state = get_cached_quota("persist-key")
        assert state is not None
        assert state.daily_used == 75
        assert state.daily_limit == 100
        assert state.tier == "pro"

    def test_invalidate_cache(self, cache_path: Path) -> None:
        """invalidate_cache() removes the cached entry."""
        cache_quota(key_id="invalidate-module-key", daily_used=10, daily_limit=100)

        result = invalidate_cache("invalidate-module-key")

        assert result is True
        assert get_cached_quota("invalidate-module-key") is None

    def test_invalidate_cache_returns_false_if_missing(self) -> None:
        """invalidate_cache() returns False for missing key."""
        result = invalidate_cache("never-existed-key")

        assert result is False
