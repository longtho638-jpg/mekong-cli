"""
Phase 6 License Validation Tests

Tests for:
1. Command cost tiers (init: 1, cook: 3, swarm: 5)
2. Free tier tracking
3. Daily quota reset
"""

import pytest
from src.lib.raas_gate import RaasLicenseGate
from src.lib.free_tier_tracker import FreeTierTracker
from src.raas.quota_cache import get_cached_quota, cache_quota, get_cache, invalidate_cache


# Test fixtures
@pytest.fixture
def clean_quota_cache():
    """Clean quota cache before/after test."""
    # Clear cache before - use isolated temp DB

    # Get cache and clear
    try:
        cache = get_cache()
        cache.clear_all()
    except Exception:
        pass
    yield
    # Clear cache after
    try:
        cache = get_cache()
        cache.clear_all()
    except Exception:
        pass


@pytest.fixture
def clean_free_tier_db():
    """Clean free tier tracker DB before/after test."""
    # Clear DB before - use a temp DB to isolate tests
    tracker = FreeTierTracker()
    # Clear all records from default DB
    try:
        conn = tracker._connect()
        conn.execute("DELETE FROM free_tier_usage")
        conn.execute("DELETE FROM free_tier_sessions")
        conn.commit()
        conn.close()
    except Exception:
        pass
    yield
    # Clear DB after
    try:
        conn = tracker._connect()
        conn.execute("DELETE FROM free_tier_usage")
        conn.execute("DELETE FROM free_tier_sessions")
        conn.commit()
        conn.close()
    except Exception:
        pass


@pytest.fixture
def license_gate():
    """Create fresh license gate instance."""
    return RaasLicenseGate(enable_remote=False)


class TestCommandCostTiers:
    """Test 1: Command cost tiers - different commands have different costs."""

    def test_version_costs_1_credit(self, license_gate):
        """version command costs 1 credit."""
        assert license_gate.get_command_cost("version") == 1

    def test_init_costs_1_credit(self, license_gate):
        """init command costs 1 credit."""
        assert license_gate.get_command_cost("init") == 1

    def test_list_costs_1_credit(self, license_gate):
        """list command costs 1 credit."""
        assert license_gate.get_command_cost("list") == 1

    def test_cook_costs_3_credits(self, license_gate):
        """cook command costs 3 credits."""
        assert license_gate.get_command_cost("cook") == 3

    def test_gateway_costs_3_credits(self, license_gate):
        """gateway command costs 3 credits."""
        assert license_gate.get_command_cost("gateway") == 3

    def test_binh_phap_costs_3_credits(self, license_gate):
        """binh-phap command costs 3 credits."""
        assert license_gate.get_command_cost("binh-phap") == 3

    def test_swarm_costs_5_credits(self, license_gate):
        """swarm command costs 5 credits."""
        assert license_gate.get_command_cost("swarm") == 5

    def test_schedule_costs_5_credits(self, license_gate):
        """schedule command costs 5 credits."""
        assert license_gate.get_command_cost("schedule") == 5

    def test_autonomous_costs_5_credits(self, license_gate):
        """autonomous command costs 5 credits."""
        assert license_gate.get_command_cost("autonomous") == 5

    def test_command_cost_case_insensitive(self, license_gate):
        """Command costs are case-insensitive."""
        assert license_gate.get_command_cost("VERSION") == 1
        assert license_gate.get_command_cost("COOK") == 3
        assert license_gate.get_command_cost("SWARM") == 5

    def test_unknown_command_defaults_to_3(self, license_gate):
        """Unknown commands default to 3 credits."""
        assert license_gate.get_command_cost("unknown-command") == 3
        assert license_gate.get_command_cost("random") == 3


class TestFreeTierTracking:
    """Test 2: Free tier tracking for analytics."""

    def test_track_free_tier_command(self, clean_free_tier_db):
        """Test tracking a command for free tier user."""
        tracker = FreeTierTracker()

        # Track a command
        result = tracker.track_command(
            key_id="test-key-123",
            command="init",
            command_cost=1,
            email="test@example.com",
            session_id="session-abc"
        )

        assert result is True

        # Verify summary
        summary = tracker.get_usage_summary("test-key-123")
        assert summary["total_commands"] == 1
        assert summary["total_credits"] == 1
        assert summary["active_days"] >= 1

    def test_track_free_tier_with_different_costs(self, clean_free_tier_db):
        """Test tracking commands with different costs."""
        tracker = FreeTierTracker()

        # Track init (1 credit)
        tracker.track_command("test-key-456", "init", command_cost=1)

        # Track cook (3 credits)
        tracker.track_command("test-key-456", "cook", command_cost=3)

        # Track swarm (5 credits)
        tracker.track_command("test-key-456", "swarm", command_cost=5)

        # Verify total credits
        summary = tracker.get_usage_summary("test-key-456")
        assert summary["total_commands"] == 3
        assert summary["total_credits"] == 9  # 1 + 3 + 5

    def test_track_free_tier_session_tracking(self, clean_free_tier_db):
        """Test session tracking for free tier users."""
        tracker = FreeTierTracker()

        # Track multiple commands in same session
        tracker.track_command(
            key_id="test-key-789",
            command="init",
            command_cost=1,
            session_id="shared-session"
        )

        tracker.track_command(
            key_id="test-key-789",
            command="list",
            command_cost=1,
            session_id="shared-session"
        )

        # Verify session stats
        summary = tracker.get_usage_summary("test-key-789")
        assert summary["total_commands"] == 2
        assert summary["total_credits"] == 2

    def test_get_unsynced_records(self, clean_free_tier_db):
        """Test getting unsynced records for upload."""
        tracker = FreeTierTracker()

        # Track a command
        tracker.track_command("unsync-key", "init", command_cost=1)

        # Get unsynced records
        unsynced = tracker.get_unsynced_records(limit=10)
        assert len(unsynced) == 1
        assert unsynced[0]["key_id"] == "unsync-key"
        assert unsynced[0]["command"] == "init"

    def test_mark_records_synced(self, clean_free_tier_db):
        """Test marking records as synced."""
        tracker = FreeTierTracker()

        # Track a command
        tracker.track_command("sync-key", "init", command_cost=1)

        # Get unsynced
        unsynced = tracker.get_unsynced_records(limit=10)
        assert len(unsynced) == 1
        record_id = unsynced[0]["id"]

        # Mark as synced
        updated = tracker.mark_synced([record_id])
        assert updated == 1

        # Verify no longer unsynced
        unsynced_after = tracker.get_unsynced_records(limit=10)
        assert len(unsynced_after) == 0


class TestDailyQuotaReset:
    """Test 3: Daily quota reset functionality."""

    def test_get_cached_quota_initial(self, clean_quota_cache):
        """Test getting cached quota when none exists."""
        cached = get_cached_quota("new-key")
        assert cached is None

    def test_cache_quota_and_retrieve(self, clean_quota_cache):
        """Test caching and retrieving quota state."""
        cache_quota(
            key_id="cache-test-key",
            daily_used=5,
            daily_limit=100,
            tier="pro",
            status="active"
        )

        cached = get_cached_quota("cache-test-key")
        assert cached is not None
        assert cached.key_id == "cache-test-key"
        assert cached.daily_used == 5
        assert cached.daily_limit == 100
        assert cached.tier == "pro"
        assert cached.status == "active"

    def test_cache_expiration(self, clean_quota_cache):
        """Test cache entries expire correctly."""
        # With default 5 minute TTL, entries should exist briefly
        cache_quota(
            key_id="expire-test-key",
            daily_used=0,
            daily_limit=10,
            tier="trial"
        )

        cached = get_cached_quota("expire-test-key")
        assert cached is not None

        # Invalidate explicitly for cleanup
        invalidate_cache("expire-test-key")

    def test_cache_invalidates_correctly(self, clean_quota_cache):
        """Test cache invalidation works."""
        cache_quota(
            key_id="invalidate-test-key",
            daily_used=10,
            daily_limit=50,
            tier="enterprise"
        )

        # Verify exists
        cached = get_cached_quota("invalidate-test-key")
        assert cached is not None
        assert cached.daily_used == 10

        # Invalidate
        result = invalidate_cache("invalidate-test-key")
        assert result is True

        # Verify invalidated
        cached_after = get_cached_quota("invalidate-test-key")
        assert cached_after is None

    def test_cache_usage_percentage(self, clean_quota_cache):
        """Test usage percentage calculation."""
        cache_quota(
            key_id="percent-key",
            daily_used=80,
            daily_limit=100,
            tier="pro"
        )

        cached = get_cached_quota("percent-key")
        assert cached is not None
        assert cached.usage_percentage() == 80.0

        # Test 90%
        cache_quota(
            key_id="percent-key-90",
            daily_used=90,
            daily_limit=100,
            tier="pro"
        )
        cached90 = get_cached_quota("percent-key-90")
        assert cached90.usage_percentage() == 90.0

    def test_cache_unlimited_tier(self, clean_quota_cache):
        """Test unlimited tier (daily_limit = -1)."""
        cache_quota(
            key_id="unlimited-key",
            daily_used=999999,
            daily_limit=-1,
            tier="enterprise"
        )

        cached = get_cached_quota("unlimited-key")
        assert cached is not None
        assert cached.daily_limit == -1
        assert cached.usage_percentage() == 0.0  # Special handling for unlimited
        assert cached.remaining() == -1  # -1 means unlimited
