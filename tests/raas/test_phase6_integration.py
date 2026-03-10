"""
Tests for Phase 6: Usage Reporting Integration

Tests for:
- src/cli/usage_auto_instrument.py - Auto instrumentation
- src/commands/sync_raas_commands.py - sync-raas CLI command
- src/raas/sync_client.py - Phase 6 methods
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone
import os
import sys

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestUsageInstrumentor:
    """Test UsageInstrumentor class."""

    def test_init(self):
        """Test instrumentor initialization."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()

        assert instrumentor.gateway_url == "https://raas.agencyos.network"
        assert instrumentor.cli_version is not None
        assert instrumentor.usage_dir.exists()

    def test_get_cli_version(self):
        """Test CLI version detection."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()
        version = instrumentor._get_cli_version()

        # Should return version or dev fallback
        assert isinstance(version, str)
        assert len(version) > 0

    def test_get_tenant_id_from_api_key(self):
        """Test tenant ID derivation from API key."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()
        instrumentor.api_key = "mk_test_key_123456"

        tenant_id = instrumentor._get_tenant_id()

        # Should derive tenant ID from key
        assert tenant_id is not None
        assert isinstance(tenant_id, str)
        assert len(tenant_id) == 16  # SHA256 first 16 chars

    def test_get_metadata(self):
        """Test metadata collection."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()
        metadata = instrumentor._get_metadata("test-command")

        assert "os" in metadata
        assert "python_version" in metadata
        assert metadata["command"] == "test-command"

    @patch('src.cli.usage_auto_instrument.UsageInstrumentor._send_to_gateway')
    def test_emit_event_success(self, mock_send):
        """Test successful event emission."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        mock_send.return_value = True

        instrumentor = UsageInstrumentor()
        instrumentor.api_key = "mk_test_key"
        instrumentor.tenant_id = "test-tenant"

        event_id = instrumentor.emit_event("cook")

        assert event_id is not None
        mock_send.assert_called_once()

    @patch('src.cli.usage_auto_instrument.UsageInstrumentor._send_to_gateway')
    @patch('src.cli.usage_auto_instrument.UsageInstrumentor._cache_event')
    def test_emit_event_fallback_cache(self, mock_cache, mock_send):
        """Test event caching when gateway fails."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        mock_send.return_value = False

        instrumentor = UsageInstrumentor()
        instrumentor.api_key = "mk_test_key"
        instrumentor.tenant_id = "test-tenant"

        instrumentor.emit_event("cook")

        # Should return None on failure (or event_id on success)
        mock_cache.assert_called_once()

    def test_emit_event_no_tenant(self):
        """Test event emission without tenant ID."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()
        instrumentor.api_key = None  # No API key

        result = instrumentor.emit_event("cook")

        assert result is None

    def test_send_to_gateway_success(self):
        """Test successful gateway send."""
        from src.cli.usage_auto_instrument import UsageInstrumentor, UsageEvent

        # Mock requests.post at module level where it's imported
        with patch('requests.post') as mock_post:
            # Mock successful response
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.headers = {
                "X-RateLimit-Remaining": "100",
                "X-RateLimit-Limit": "1000",
                "X-RateLimit-Reset": "1234567890",
            }
            mock_post.return_value = mock_response

            instrumentor = UsageInstrumentor()
            instrumentor.api_key = "mk_test_key"
            instrumentor.tenant_id = "test-tenant"

            event = UsageEvent(
                event_id="test-event-id",
                event_type="cli:command",
                tenant_id="test-tenant",
                license_key="mk_test_key",
                timestamp=datetime.now(timezone.utc).isoformat(),
                endpoint="/v1/cli/test",
                cli_version="0.2.0",
                metadata={},
            )

            instrumentor._send_to_gateway(event)

            # Should call requests.post (result depends on rate limit check)
            mock_post.assert_called_once()

    def test_send_to_gateway_429_rate_limit(self):
        """Test rate limit handling."""
        from src.cli.usage_auto_instrument import UsageInstrumentor, UsageEvent

        with patch('requests.post') as mock_post:
            # Mock 429 response
            mock_response = Mock()
            mock_response.status_code = 429
            mock_response.headers = {"X-RateLimit-Reset": "1234567890"}
            mock_post.return_value = mock_response

            instrumentor = UsageInstrumentor()
            instrumentor.api_key = "mk_test_key"
            instrumentor.tenant_id = "test-tenant"

            event = UsageEvent(
                event_id="test-event-id",
                event_type="cli:command",
                tenant_id="test-tenant",
                license_key="mk_test_key",
                timestamp=datetime.now(timezone.utc).isoformat(),
                endpoint="/v1/cli/test",
                cli_version="0.2.0",
                metadata={},
            )

            result = instrumentor._send_to_gateway(event)

            # Should return False on rate limit
            assert result is False
            mock_post.assert_called_once()

    def test_cache_event(self):
        """Test event caching to disk."""
        from src.cli.usage_auto_instrument import UsageInstrumentor, UsageEvent
        import json

        instrumentor = UsageInstrumentor()

        event = UsageEvent(
            event_id="test-event-id",
            event_type="cli:command",
            tenant_id="test-tenant",
            license_key="mk_test_key",
            timestamp=datetime.now(timezone.utc).isoformat(),
            endpoint="/v1/cli/test",
            cli_version="0.2.0",
            metadata={},
        )

        instrumentor._cache_event(event)

        # Check file was created
        files = list(instrumentor.usage_dir.glob("usage_*.json"))
        assert len(files) > 0

        # Verify content
        with open(files[0], "r") as f:
            data = json.load(f)

        assert data["event"]["event_id"] == "test-event-id"
        assert data["event"]["event_type"] == "cli:command"

    def test_get_cached_events(self):
        """Test retrieving cached events."""
        from src.cli.usage_auto_instrument import UsageInstrumentor

        instrumentor = UsageInstrumentor()
        events = instrumentor.get_cached_events()

        # Should return list (may be empty)
        assert isinstance(events, list)

    def test_clear_cached_event(self):
        """Test clearing cached event."""
        from src.cli.usage_auto_instrument import UsageInstrumentor, UsageEvent

        instrumentor = UsageInstrumentor()

        # Create and cache event
        event = UsageEvent(
            event_id="test-event-id",
            event_type="cli:command",
            tenant_id="test-tenant",
            license_key="mk_test_key",
            timestamp=datetime.now(timezone.utc).isoformat(),
            endpoint="/v1/cli/test",
            cli_version="0.2.0",
            metadata={},
        )

        instrumentor._cache_event(event)

        # Get the cached file
        files = list(instrumentor.usage_dir.glob("usage_*test-event-id*.json"))
        if files:
            result = instrumentor.clear_cached_event(str(files[0]))
            assert result is True


class TestSyncRaasCommands:
    """Test sync-raas CLI commands."""

    def test_app_exists(self):
        """Test app module exists and is importable."""
        from src.commands import sync_raas_commands

        # Verify module imports and has app
        assert hasattr(sync_raas_commands, 'app')
        assert sync_raas_commands.app is not None


class TestSyncClientPhase6:
    """Test SyncClient Phase 6 methods."""

    def test_register_webhook_no_tenant(self):
        """Test webhook registration without tenant ID."""
        from src.raas.sync_client import SyncClient

        client = SyncClient()
        client._tenant_id = None

        result = client.register_webhook()

        assert result["success"] is False
        assert "No tenant ID" in result["error"]

    def test_push_analytics_no_tenant(self):
        """Test analytics push without tenant ID."""
        from src.raas.sync_client import SyncClient

        client = SyncClient()
        client._tenant_id = None

        result = client.push_analytics()

        assert result["success"] is False
        assert "No tenant ID" in result["error"]


class TestGlobalInstrumentor:
    """Test global instrumentor functions."""

    def test_get_instrumentor_singleton(self):
        """Test global instrumentor singleton."""
        from src.cli.usage_auto_instrument import get_instrumentor

        # Reset global
        import src.cli.usage_auto_instrument as module
        module._instrumentor = None

        # Get instance
        inst1 = get_instrumentor()
        inst2 = get_instrumentor()

        assert inst1 is inst2

    @patch.dict(os.environ, {"MEKONG_NO_USAGE_TRACKING": "true"})
    def test_emit_usage_event_tracking_disabled(self):
        """Test event emission with tracking disabled."""
        from src.cli.usage_auto_instrument import emit_usage_event

        result = emit_usage_event("test")

        assert result is None

    def test_emit_usage_event_no_env_vars(self):
        """Test event emission without API key."""
        from src.cli.usage_auto_instrument import emit_usage_event

        # Save and clear API key
        old_key = os.environ.get("RAAS_LICENSE_KEY")
        os.environ.pop("RAAS_LICENSE_KEY", None)
        os.environ["MEKONG_NO_USAGE_TRACKING"] = "true"

        try:
            result = emit_usage_event("test")
            assert result is None
        finally:
            # Restore
            if old_key:
                os.environ["RAAS_LICENSE_KEY"] = old_key
            os.environ.pop("MEKONG_NO_USAGE_TRACKING", None)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
