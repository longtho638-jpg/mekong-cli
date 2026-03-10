"""
Tests for Phase 6 Extension

Tests cover:
- Machine fingerprinting
- JWT refresh client
- Telemetry hooks
"""

import pytest
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from src.core.machine_fingerprint import (
    MachineFingerprint,
    FingerprintGenerator,
    get_machine_fingerprint,
    get_machine_fingerprint_hash,
)

from src.core.jwt_refresh_client import (
    JwtRefreshClient,
    TokenCache,
    RefreshStatus,
    RefreshResult,
    get_refresh_client,
)

from src.core.telemetry_hooks import (
    TelemetryHooks,
    TelemetryEvent,
    EventStatus,
    get_telemetry_hooks,
    emit_telemetry_event,
    emit_command_event,
    emit_error_event,
)


# =============================================================================
# Machine Fingerprint Tests
# =============================================================================

class TestMachineFingerprint:
    """Test MachineFingerprint dataclass."""

    def test_fingerprint_creation(self):
        """Test creating MachineFingerprint."""
        fp = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
            disk_serial="SN123456",
            machine_id="abc-def-ghi",
            platform="Darwin",
        )

        assert fp.mac_addresses == ["aa:bb:cc:dd:ee:ff"]
        assert fp.disk_serial == "SN123456"
        assert fp.machine_id == "abc-def-ghi"
        assert fp.platform == "Darwin"

    def test_fingerprint_hash(self):
        """Test fingerprint hash generation."""
        fp1 = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
            disk_serial="SN123456",
        )

        fp2 = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
            disk_serial="SN123456",
        )

        # Same inputs = same hash
        assert fp1.fingerprint_hash == fp2.fingerprint_hash

    def test_fingerprint_hash_different(self):
        """Test different fingerprints produce different hashes."""
        fp1 = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
        )

        fp2 = MachineFingerprint(
            mac_addresses=["11:22:33:44:55:66"],
        )

        assert fp1.fingerprint_hash != fp2.fingerprint_hash

    def test_short_fingerprint(self):
        """Test short fingerprint is 16 chars."""
        fp = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
        )

        assert len(fp.short_fingerprint) == 16
        assert fp.fingerprint_hash.startswith(fp.short_fingerprint)

    def test_to_dict_and_from_dict(self):
        """Test serialization and deserialization."""
        original = MachineFingerprint(
            mac_addresses=["aa:bb:cc:dd:ee:ff"],
            disk_serial="SN123456",
            machine_id="machine-123",
            platform="Darwin",
            platform_version="10.15",
            architecture="arm64",
        )

        data = original.to_dict()
        restored = MachineFingerprint.from_dict(data)

        assert restored.mac_addresses == original.mac_addresses
        assert restored.disk_serial == original.disk_serial
        assert restored.machine_id == original.machine_id
        assert restored.fingerprint_hash == original.fingerprint_hash


class TestFingerprintGenerator:
    """Test FingerprintGenerator."""

    def test_generator_creation(self):
        """Test creating FingerprintGenerator."""
        gen = FingerprintGenerator()
        assert gen.platform in ("Darwin", "Linux", "Windows")

    @patch('platform.system')
    @patch('platform.version')
    @patch('platform.machine')
    def test_generate(self, mock_machine, mock_version, mock_system):
        """Test generate fingerprint."""
        mock_system.return_value = "TestOS"
        mock_version.return_value = "1.0"
        mock_machine.return_value = "x86_64"

        gen = FingerprintGenerator()
        fp = gen.generate()

        assert fp.platform == "TestOS"
        assert fp.platform_version == "1.0"
        assert fp.architecture == "x86_64"
        assert fp.mac_addresses  # Should have at least fallback
        assert fp.fingerprint_hash  # Should generate hash

    def test_global_fingerprint(self):
        """Test global fingerprint functions."""
        fp = get_machine_fingerprint()
        assert isinstance(fp, MachineFingerprint)

        hash_val = get_machine_fingerprint_hash()
        assert isinstance(hash_val, str)
        assert len(hash_val) == 64  # SHA-256 hex


# =============================================================================
# JWT Refresh Client Tests
# =============================================================================

class TestTokenCache:
    """Test TokenCache dataclass."""

    def test_token_cache_creation(self):
        """Test creating TokenCache."""
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        cache = TokenCache(
            access_token="access_123",
            refresh_token="refresh_456",
            expires_at=expires,
        )

        assert cache.access_token == "access_123"
        assert cache.refresh_token == "refresh_456"
        assert not cache.is_expired
        assert not cache.should_refresh  # Not within 5 min buffer

    def test_is_expired(self):
        """Test is_expired property."""
        # Expired token
        past = datetime.now(timezone.utc) - timedelta(hours=1)
        cache = TokenCache(
            access_token="access_123",
            refresh_token=None,
            expires_at=past,
        )
        assert cache.is_expired

    def test_should_refresh(self):
        """Test should_refresh property (5 min buffer)."""
        # Expires in 3 minutes - should refresh
        soon = datetime.now(timezone.utc) + timedelta(minutes=3)
        cache = TokenCache(
            access_token="access_123",
            refresh_token="refresh_456",
            expires_at=soon,
        )
        assert cache.should_refresh

    def test_to_dict_and_from_dict(self):
        """Test serialization and deserialization."""
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        original = TokenCache(
            access_token="access_123",
            refresh_token="refresh_456",
            expires_at=expires,
            refresh_attempts=2,
        )

        data = original.to_dict()
        restored = TokenCache.from_dict(data)

        assert restored.access_token == original.access_token
        assert restored.refresh_token == original.refresh_token
        assert restored.refresh_attempts == original.refresh_attempts


class TestJwtRefreshClient:
    """Test JwtRefreshClient."""

    def test_client_creation(self):
        """Test creating JwtRefreshClient."""
        client = JwtRefreshClient()
        assert client is not None

    @patch.dict(os.environ, {"MK_API_KEY": "mk_test_key"})
    @patch.object(JwtRefreshClient, '_get_auth_headers', return_value={})
    @patch.object(JwtRefreshClient, '_cache_tokens')
    def test_activate_success(self, mock_cache, mock_headers):
        """Test successful activation."""
        mock_cache.return_value = RefreshResult(
            status=RefreshStatus.SUCCESS,
            access_token="access_token",
            refresh_token="refresh_token",
        )

        with patch('src.core.gateway_client.GatewayClient.post') as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                data={
                    "access_token": "access_token",
                    "refresh_token": "refresh_token",
                    "expires_in": 3600,
                }
            )

            client = JwtRefreshClient()
            result = client.activate()

            assert result.status == RefreshStatus.SUCCESS
            assert result.access_token == "access_token"

    @patch.object(JwtRefreshClient, '_get_api_key', return_value=None)
    def test_activate_no_api_key(self, mock_get_key):
        """Test activation without API key."""
        client = JwtRefreshClient()
        result = client.activate()

        assert result.status == RefreshStatus.FAILED
        assert "No API key" in result.error

    @patch.object(JwtRefreshClient, '_get_auth_headers', return_value={})
    @patch.object(JwtRefreshClient, 'activate')
    def test_refresh_no_refresh_token(self, mock_activate, mock_headers):
        """Test refresh when no refresh token - should activate."""
        mock_activate.return_value = RefreshResult(
            status=RefreshStatus.SUCCESS,
            access_token="new_token",
        )

        client = JwtRefreshClient()
        result = client.refresh()

        assert result.status == RefreshStatus.SUCCESS
        mock_activate.assert_called_once()

    def test_calculate_backoff(self):
        """Test exponential backoff calculation."""
        client = JwtRefreshClient()

        # Test backoff progression
        delay1 = client._calculate_backoff(1)
        delay2 = client._calculate_backoff(2)
        delay3 = client._calculate_backoff(3)

        assert delay2 > delay1  # Exponential growth
        assert delay3 > delay2

        # Test max cap
        delay_max = client._calculate_backoff(20)
        assert delay_max <= client.MAX_BACKOFF_MS

    def test_global_refresh_client(self):
        """Test global refresh client function."""
        client = get_refresh_client()
        assert isinstance(client, JwtRefreshClient)

        # Should return same instance
        client2 = get_refresh_client()
        assert client is client2


# =============================================================================
# Telemetry Hooks Tests
# =============================================================================

class TestTelemetryEvent:
    """Test TelemetryEvent dataclass."""

    def test_event_creation(self):
        """Test creating TelemetryEvent."""
        event = TelemetryEvent(
            event_id="event-123",
            event_type="cli:command",
            timestamp="2026-03-09T00:00:00Z",
            tenant_id=None,
            license_key="hash123",
            command_name="test-cmd",
            status="success",
            duration_ms=100.5,
        )

        assert event.event_id == "event-123"
        assert event.event_type == "cli:command"
        assert event.command_name == "test-cmd"
        assert event.duration_ms == 100.5

    def test_to_dict_and_from_dict(self):
        """Test serialization and deserialization."""
        original = TelemetryEvent(
            event_id="event-456",
            event_type="cli:error",
            timestamp="2026-03-09T00:00:00Z",
            tenant_id="tenant-1",
            license_key=None,
            error_type="ValueError",
            error_message="Test error",
        )

        data = original.to_dict()
        restored = TelemetryEvent.from_dict(data)

        assert restored.event_id == original.event_id
        assert restored.event_type == original.event_type
        assert restored.error_type == original.error_type


class TestTelemetryHooks:
    """Test TelemetryHooks."""

    def test_hooks_creation(self):
        """Test creating TelemetryHooks."""
        hooks = TelemetryHooks()
        assert hooks is not None
        assert hooks._event_queue == []

    @patch.dict(os.environ, {"MEKONG_NO_TELEMETRY": "1"})
    def test_is_opted_out(self):
        """Test opt-out detection."""
        hooks = TelemetryHooks()
        assert hooks.is_opted_out() is True

    @patch.dict(os.environ, {}, clear=True)
    def test_is_not_opted_out(self):
        """Test not opted out."""
        hooks = TelemetryHooks()
        assert hooks.is_opted_out() is False

    @patch.dict(os.environ, {"MEKONG_NO_TELEMETRY": "1"})
    def test_emit_event_opted_out(self):
        """Test emit event when opted out."""
        hooks = TelemetryHooks()
        result = hooks.emit_event(event_type="cli:command")
        assert result is None

    @patch.object(TelemetryHooks, '_send_event', return_value=True)
    def test_emit_event_success(self, mock_send):
        """Test successful event emission."""
        hooks = TelemetryHooks()
        event_id = hooks.emit_event(
            event_type="cli:command",
            command_name="test",
            status=EventStatus.SUCCESS,
            duration_ms=50.0,
        )

        assert event_id is not None

    def test_command_hook(self):
        """Test command hook."""
        hooks = TelemetryHooks()
        event_id = hooks.command_hook(
            command_name="test-cmd",
            subcommand="sub",
            start_time=None,
            status=EventStatus.SUCCESS,
            exit_code=0,
        )

        assert event_id is not None

    def test_error_hook(self):
        """Test error hook."""
        hooks = TelemetryHooks()
        event_id = hooks.error_hook(
            error_type="ValueError",
            error_message="Test error message",
            command_name="failing-cmd",
        )

        assert event_id is not None

    def test_flush_empty_queue(self):
        """Test flush with empty queue."""
        hooks = TelemetryHooks()
        count = hooks.flush()
        assert count == 0

    def test_flush_cached_events_empty(self):
        """Test flush cached events when empty."""
        hooks = TelemetryHooks()
        count = hooks.flush_cached_events()
        assert count == 0


class TestGlobalTelemetryFunctions:
    """Test global telemetry functions."""

    @patch.dict(os.environ, {"MEKONG_NO_TELEMETRY": "1"})
    def test_emit_telemetry_event_opt_out(self):
        """Test emit_telemetry_event when opted out."""
        result = emit_telemetry_event(event_type="test")
        # Will be None due to opt-out
        assert result is None

    @patch.object(TelemetryHooks, 'is_opted_out', return_value=False)
    @patch.object(TelemetryHooks, 'emit_event', return_value="event-id")
    def test_emit_telemetry_event_success(self, mock_emit, mock_opted_out):
        """Test emit_telemetry_event success."""
        result = emit_telemetry_event(event_type="test")
        assert result == "event-id"

    @patch.object(TelemetryHooks, 'command_hook')
    def test_emit_command_event(self, mock_command):
        """Test emit_command_event function."""
        mock_command.return_value = "cmd-event-id"
        result = emit_command_event(command_name="test", status=EventStatus.SUCCESS)
        assert result == "cmd-event-id"

    @patch.object(TelemetryHooks, 'error_hook')
    def test_emit_error_event(self, mock_error):
        """Test emit_error_event function."""
        mock_error.return_value = "error-event-id"
        result = emit_error_event(
            error_type="TestError",
            error_message="Error msg",
        )
        assert result == "error-event-id"

    def test_get_telemetry_hooks_singleton(self):
        """Test singleton pattern for telemetry hooks."""
        hooks1 = get_telemetry_hooks()
        hooks2 = get_telemetry_hooks()
        assert hooks1 is hooks2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
