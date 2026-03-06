"""Tests for Usage Queue — Async Buffer Layer."""

import asyncio
import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from src.lib.usage_queue import UsageQueue, get_queue, init_queue
from src.lib.license_generator import parse_license_key


class TestUsageQueue:
    """Test UsageQueue class."""

    @pytest.mark.asyncio
    async def test_enqueue_adds_event_to_queue(self) -> None:
        """Test that enqueue adds event to queue."""
        queue = UsageQueue(max_size=10)

        await queue.enqueue(
            key_id="test-key-123",
            tier="pro",
            command="test command",
        )

        assert queue._queue.qsize() == 1
        event = await queue._queue.get()
        assert event["key_id"] == "test-key-123"
        assert event["tier"] == "pro"
        assert event["command"] == "test command"
        assert "timestamp" in event

    @pytest.mark.asyncio
    async def test_start_creates_background_task(self) -> None:
        """Test that start() creates background worker task."""
        queue = UsageQueue()
        await queue.start()

        assert queue._running is True
        assert queue._task is not None
        assert not queue._task.done()

        await queue.stop()

    @pytest.mark.asyncio
    async def test_stop_flushes_and_cancels(self) -> None:
        """Test that stop() flushes queue and cancels task."""
        queue = UsageQueue(flush_interval=0.1)
        await queue.start()

        # Add event
        await queue.enqueue(
            key_id="test-key",
            tier="free",
            command="test",
        )

        # Stop should flush
        await queue.stop()

        assert queue._running is False
        assert queue._queue.qsize() == 0

    @pytest.mark.asyncio
    async def test_sqlite_fallback_directory_created(self) -> None:
        """Test that SQLite fallback directory is created."""
        with tempfile.TemporaryDirectory() as tmpdir:
            sqlite_path = Path(tmpdir) / "nested" / "usage_buffer.db"
            queue = UsageQueue(sqlite_path=str(sqlite_path))

            assert sqlite_path.parent.exists()
            assert sqlite_path.parent.name == "nested"

    @pytest.mark.asyncio
    async def test_metadata_included_in_event(self) -> None:
        """Test that metadata is included in queued event."""
        queue = UsageQueue()

        metadata = {
            "exit_code": 0,
            "duration": 1.5,
            "idempotency_key": "key:hash:2026-03-06",
        }

        await queue.enqueue(
            key_id="test-key",
            tier="pro",
            command="test",
            metadata=metadata,
        )

        event = await queue._queue.get()
        assert event["metadata"]["exit_code"] == 0
        assert event["metadata"]["duration"] == 1.5
        assert "idempotency_key" in event["metadata"]


class TestParseLicenseKey:
    """Test parse_license_key function."""

    def test_valid_pro_key(self) -> None:
        """Test parsing valid pro license key."""
        is_valid, parsed, error = parse_license_key(
            "raas-pro-abc12345-aBcDeFgHiJkLmNoPqRsT"
        )

        assert is_valid is True
        assert parsed is not None
        assert parsed["key_id"] == "abc12345"
        assert parsed["tier"] == "pro"
        assert error == ""

    def test_valid_free_key(self) -> None:
        """Test parsing valid free license key."""
        is_valid, parsed, error = parse_license_key("raas-free-xyz789-signature")

        assert is_valid is True
        assert parsed is not None
        assert parsed["key_id"] == "xyz789"
        assert parsed["tier"] == "free"

    def test_valid_trial_key(self) -> None:
        """Test parsing valid trial license key."""
        is_valid, parsed, error = parse_license_key("raas-trial-trial123-sig")

        assert is_valid is True
        assert parsed is not None
        assert parsed["key_id"] == "trial123"
        assert parsed["tier"] == "trial"

    def test_valid_enterprise_key(self) -> None:
        """Test parsing valid enterprise license key."""
        is_valid, parsed, error = parse_license_key(
            "raas-enterprise-ent12345-super-long-signature-here"
        )

        assert is_valid is True
        assert parsed is not None
        assert parsed["key_id"] == "ent12345"
        assert parsed["tier"] == "enterprise"

    def test_empty_key_returns_error(self) -> None:
        """Test that empty key returns error."""
        is_valid, parsed, error = parse_license_key("")

        assert is_valid is False
        assert parsed is None
        assert error == "Empty license key"

    def test_invalid_format_too_short(self) -> None:
        """Test that invalid format (too short) returns error."""
        is_valid, parsed, error = parse_license_key("raas-pro-key")

        assert is_valid is False
        assert parsed is None
        assert "Invalid format" in error

    def test_invalid_prefix(self) -> None:
        """Test that invalid prefix returns error."""
        is_valid, parsed, error = parse_license_key("invalid-pro-key-sig")

        assert is_valid is False
        assert parsed is None
        assert "Invalid prefix" in error

    def test_invalid_tier(self) -> None:
        """Test that invalid tier returns error."""
        is_valid, parsed, error = parse_license_key("raas-invalid-keyid-sig")

        assert is_valid is False
        assert parsed is None
        assert "Invalid tier" in error

    def test_key_with_dash_in_signature(self) -> None:
        """Test parsing key with dashes in signature."""
        is_valid, parsed, error = parse_license_key(
            "raas-pro-key123-signature-with-dashes"
        )

        assert is_valid is True
        assert parsed is not None
        assert parsed["key_id"] == "key123"
        assert parsed["tier"] == "pro"


class TestGetQueue:
    """Test global queue functions."""

    def test_get_queue_returns_singleton(self) -> None:
        """Test that get_queue returns same instance."""
        q1 = get_queue()
        q2 = get_queue()

        assert q1 is q2

    @pytest.mark.asyncio
    async def test_init_queue_starts_queue(self) -> None:
        """Test that init_queue starts the queue."""
        # Reset singleton
        import src.lib.usage_queue as usage_queue
        usage_queue._queue = None

        q = await init_queue()

        assert q._running is True
        assert q._task is not None

        await q.stop()
        usage_queue._queue = None
