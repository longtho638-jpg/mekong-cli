"""
Unit Tests for UsageTracker — ROIaaS Phase 4

Tests for UsageTracker class, idempotency, and event tracking.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock

from src.usage.usage_tracker import UsageTracker, UsageEvent, get_tracker
from src.db.repository import LicenseRepository


class TestUsageEvent:
    """Test UsageEvent dataclass."""

    def test_usage_event_creation(self):
        """Test creating a usage event."""
        event = UsageEvent(
            key_id="test-key-123",
            event_type="command",
            event_data={"command": "cook"},
            idempotency_key="abc123",
        )

        assert event.key_id == "test-key-123"
        assert event.event_type == "command"
        assert event.event_data == {"command": "cook"}
        assert event.idempotency_key == "abc123"
        assert event.metadata == {}
        assert event.timestamp is not None
        assert event.timestamp.tzinfo == timezone.utc

    def test_usage_event_with_metadata(self):
        """Test creating event with custom metadata."""
        event = UsageEvent(
            key_id="test-key-123",
            event_type="feature",
            event_data={"feature_tag": "bmc"},
            idempotency_key="xyz789",
            metadata={"source": "test", "version": "1.0"},
        )

        assert event.metadata == {"source": "test", "version": "1.0"}

    def test_usage_event_custom_timestamp(self):
        """Test creating event with custom timestamp."""
        custom_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        event = UsageEvent(
            key_id="test-key-123",
            event_type="command",
            event_data={"command": "plan"},
            idempotency_key="def456",
            timestamp=custom_time,
        )

        assert event.timestamp == custom_time

    def test_usage_event_invalid_event_type(self):
        """Test that invalid event_type raises error."""
        with pytest.raises(ValueError, match="Invalid event_type"):
            UsageEvent(
                key_id="test-key-123",
                event_type="invalid",
                event_data={},
                idempotency_key="key",
            )


class TestUsageTrackerIdempotency:
    """Test idempotency key generation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_repo = AsyncMock(spec=LicenseRepository)
        self.tracker = UsageTracker(repository=self.mock_repo)

    def test_generate_idempotency_key_deterministic(self):
        """Test that same inputs produce same key."""
        event_data = {"command": "cook"}
        key1 = self.tracker._generate_idempotency_key("key-123", "command", event_data)
        key2 = self.tracker._generate_idempotency_key("key-123", "command", event_data)

        assert key1 == key2
        assert len(key1) == 64  # SHA256 hex length

    def test_generate_idempotency_key_different_commands(self):
        """Test that different commands produce different keys."""
        key1 = self.tracker._generate_idempotency_key(
            "key-123", "command", {"command": "cook"}
        )
        key2 = self.tracker._generate_idempotency_key(
            "key-123", "command", {"command": "plan"}
        )

        assert key1 != key2

    def test_generate_idempotency_key_different_days(self):
        """Test that same event on different days produces different keys."""
        event_data = {"command": "cook"}
        day1 = datetime(2026, 3, 6, 12, 0, 0, tzinfo=timezone.utc)
        day2 = datetime(2026, 3, 7, 12, 0, 0, tzinfo=timezone.utc)

        key1 = self.tracker._generate_idempotency_key("key-123", "command", event_data, day1)
        key2 = self.tracker._generate_idempotency_key("key-123", "command", event_data, day2)

        assert key1 != key2

    def test_generate_idempotency_key_command_vs_feature(self):
        """Test that command and feature events produce different keys."""
        event_data = {"command": "cook"}
        key1 = self.tracker._generate_idempotency_key("key-123", "command", event_data)
        key2 = self.tracker._generate_idempotency_key("key-123", "feature", event_data)

        assert key1 != key2

    def test_hash_license_key(self):
        """Test license key hashing."""
        license_key = "test-license-key-123"
        hash1 = self.tracker._hash_license_key(license_key)
        hash2 = self.tracker._hash_license_key(license_key)

        assert len(hash1) == 64
        assert hash1 == hash2
        assert hash1 != license_key


class TestUsageTrackerTrackCommand:
    """Test track_command method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_repo = AsyncMock(spec=LicenseRepository)
        # Add required methods that may not be in spec
        self.mock_repo.check_idempotency_key = AsyncMock(return_value=False)
        self.mock_repo.create_usage_event = AsyncMock(return_value={"id": 1, "created_at": datetime.now(timezone.utc)})
        self.tracker = UsageTracker(repository=self.mock_repo)

    @pytest.mark.asyncio
    async def test_track_command_success(self):
        """Test successful command tracking."""
        self.mock_repo.check_idempotency_key.return_value = False
        self.mock_repo.create_usage_event.return_value = {"id": 1, "created_at": datetime.now(timezone.utc)}

        success, message = await self.tracker.track_command(
            key_id="key-123",
            command="cook",
            license_key="license-abc",
        )

        assert success is True
        assert "tracked" in message.lower()
        self.mock_repo.create_usage_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_track_command_duplicate_ignored(self):
        """Test that duplicate commands are ignored."""
        self.mock_repo.check_idempotency_key.return_value = True

        success, message = await self.tracker.track_command(
            key_id="key-123",
            command="cook",
        )

        assert success is True
        assert "duplicate" in message.lower()
        self.mock_repo.create_usage_event.assert_not_called()

    @pytest.mark.asyncio
    async def test_track_command_with_metadata(self):
        """Test command tracking with metadata."""
        self.mock_repo.check_idempotency_key.return_value = False
        self.mock_repo.create_usage_event.return_value = {"id": 1}

        await self.tracker.track_command(
            key_id="key-123",
            command="plan",
            metadata={"exit_code": 0, "duration": 1.5},
        )

        call_args = self.mock_repo.create_usage_event.call_args
        assert call_args.kwargs["metadata"]["source"] == "command"


class TestUsageTrackerTrackFeature:
    """Test track_feature method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_repo = AsyncMock(spec=LicenseRepository)
        # Add required methods that may not be in spec
        self.mock_repo.check_idempotency_key = AsyncMock(return_value=False)
        self.mock_repo.create_usage_event = AsyncMock(return_value={"id": 1, "created_at": datetime.now(timezone.utc)})
        self.tracker = UsageTracker(repository=self.mock_repo)

    @pytest.mark.asyncio
    async def test_track_feature_success(self):
        """Test successful feature tracking."""
        self.mock_repo.check_idempotency_key.return_value = False
        self.mock_repo.create_usage_event.return_value = {"id": 1}

        success, message = await self.tracker.track_feature(
            key_id="key-123",
            feature_tag="bmc",
            license_key="license-abc",
        )

        assert success is True
        assert "tracked" in message.lower()
        self.mock_repo.create_usage_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_track_feature_duplicate_ignored(self):
        """Test that duplicate features are ignored."""
        self.mock_repo.check_idempotency_key.return_value = True

        success, message = await self.tracker.track_feature(
            key_id="key-123",
            feature_tag="bmc",
        )

        assert success is True
        assert "duplicate" in message.lower()


class TestUsageTrackerGetSummary:
    """Test get_usage_summary method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_repo = AsyncMock(spec=LicenseRepository)
        # Add required methods that may not be in spec
        self.mock_repo.check_idempotency_key = AsyncMock(return_value=False)
        self.mock_repo.create_usage_event = AsyncMock(return_value={"id": 1, "created_at": datetime.now(timezone.utc)})
        self.mock_repo.get_usage_events = AsyncMock(return_value=[])
        self.tracker = UsageTracker(repository=self.mock_repo)

    @pytest.mark.asyncio
    async def test_get_usage_summary_empty(self):
        """Test summary with no events."""
        self.mock_repo.get_usage_events.return_value = []

        summary = await self.tracker.get_usage_summary("key-123", days=30)

        assert summary["key_id"] == "key-123"
        assert summary["total_events"] == 0
        assert summary["command_count"] == 0
        assert summary["feature_count"] == 0

    @pytest.mark.asyncio
    async def test_get_usage_summary_with_events(self):
        """Test summary with events."""
        self.mock_repo.get_usage_events.return_value = [
            {"event_type": "command", "event_data": {"command": "cook"}},
            {"event_type": "command", "event_data": {"command": "cook"}},
            {"event_type": "feature", "event_data": {"feature_tag": "bmc"}},
        ]

        summary = await self.tracker.get_usage_summary("key-123", days=30)

        assert summary["total_events"] == 3
        assert summary["command_count"] == 2
        assert summary["feature_count"] == 1
        assert summary["commands"] == {"cook": 2}
        assert summary["features"] == {"bmc": 1}


class TestGlobalTracker:
    """Test global tracker instance."""

    def test_get_tracker_singleton(self):
        """Test that get_tracker returns same instance."""
        tracker1 = get_tracker()
        tracker2 = get_tracker()

        assert tracker1 is tracker2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
