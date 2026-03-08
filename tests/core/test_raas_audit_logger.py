"""
Tests for RaaS Audit Logger — Phase 6 Compliance

Tests cover:
- Audit event creation and submission
- mk_ API key authentication
- JWT-bound usage attribution
- --raas-debug flag tracing
- Gateway integration
"""

import os
import pytest
from unittest.mock import Mock, patch

from src.core.raas_audit_logger import (
    AuditEvent,
    AuditResult,
    RAASAuditLogger,
    RaaSInteractionTrace,
    get_audit_logger,
    log_audit,
)


class TestAuditEvent:
    """Test AuditEvent dataclass."""

    def test_create_default_event(self):
        """Test creating event with defaults."""
        event = AuditEvent()
        assert event.project == "mekong-cli"
        assert event.phase == 6
        assert event.event == "completion_verification"
        assert isinstance(event.timestamp, str)

    def test_create_custom_event(self):
        """Test creating event with custom values."""
        event = AuditEvent(
            project="test-project",
            phase=7,
            event="test_event",
            commit_sha="abc123",
        )
        assert event.project == "test-project"
        assert event.phase == 7
        assert event.event == "test_event"
        assert event.commit_sha == "abc123"

    def test_to_dict(self):
        """Test converting event to dict."""
        event = AuditEvent(
            event="test",
            commit_sha="xyz789",
            metadata={"key": "value"},
        )
        result = event.to_dict()
        assert result["project"] == "mekong-cli"
        assert result["event"] == "test"
        assert result["commit_sha"] == "xyz789"
        assert result["metadata"] == {"key": "value"}


class TestAuditResult:
    """Test AuditResult dataclass."""

    def test_success_result(self):
        """Test successful audit result."""
        result = AuditResult(
            success=True,
            status_code=200,
            event_id="evt_123",
            elapsed_ms=45.6,
        )
        assert result.success is True
        assert result.status_code == 200
        assert result.event_id == "evt_123"
        assert result.elapsed_ms == 45.6
        assert result.error is None

    def test_error_result(self):
        """Test failed audit result."""
        result = AuditResult(
            success=False,
            status_code=401,
            error="Invalid credentials",
        )
        assert result.success is False
        assert result.status_code == 401
        assert result.error == "Invalid credentials"
        assert result.event_id is None


class TestRaaSInteractionTrace:
    """Test RaaSInteractionTrace for --raas-debug."""

    def test_trace_creation(self):
        """Test creating interaction trace."""
        trace = RaaSInteractionTrace(
            timestamp="2026-03-08T12:00:00Z",
            event_type="completion_verification",
            endpoint="/v2/audit",
            method="POST",
            headers_sent={"Authorization": "Bearer mk_abc"},
            payload_sent={"project": "mekong-cli"},
            status_code=200,
            response_body='{"event_id": "evt_123"}',
            elapsed_ms=50.0,
        )
        assert trace.event_type == "completion_verification"
        assert trace.status_code == 200
        assert trace.elapsed_ms == 50.0

    def test_trace_to_dict(self):
        """Test converting trace to dict."""
        trace = RaaSInteractionTrace(
            timestamp="2026-03-08T12:00:00Z",
            event_type="test",
            endpoint="/v2/audit",
            method="POST",
            headers_sent={},
            payload_sent={},
            status_code=200,
            response_body=None,
            elapsed_ms=10.0,
        )
        result = trace.to_dict()
        assert result["event_type"] == "test"
        assert result["endpoint"] == "/v2/audit"
        assert result["status_code"] == 200


class TestRAASAuditLogger:
    """Test RAASAuditLogger main functionality."""

    @pytest.fixture
    def logger(self):
        """Create logger with mock auth."""
        mock_auth = Mock()
        mock_auth._load_credentials.return_value = {"token": "mk_test_key"}
        mock_auth.validate_credentials.return_value = Mock(
            valid=True,
            tenant=Mock(tenant_id="tenant_123"),
        )
        return RAASAuditLogger(
            gateway_url="https://test.raas.network",
            auth_client=mock_auth,
            debug_mode=True,
        )

    def test_init(self, logger):
        """Test logger initialization."""
        assert logger.gateway_url == "https://test.raas.network"
        assert logger.debug_mode is True
        assert logger._trace_log == []

    def test_get_github_sha(self, logger):
        """Test getting commit SHA from env."""
        with patch.dict(os.environ, {"GITHUB_SHA": "abc123def"}):
            sha = logger._get_github_sha()
            assert sha == "abc123def"

    def test_get_github_sha_missing(self, logger):
        """Test when GITHUB_SHA not set."""
        with patch.dict(os.environ, {}, clear=True):
            sha = logger._get_github_sha()
            assert sha is None

    def test_build_payload(self, logger):
        """Test building audit payload."""
        payload, tenant_id = logger._build_payload(
            event="test_event",
            commit_sha="xyz789",
            session_id="session_456",
            metadata={"custom": "data"},
        )
        assert payload["project"] == "mekong-cli"
        assert payload["phase"] == 6
        assert payload["event"] == "test_event"
        assert payload["commit_sha"] == "xyz789"
        assert payload["session_id"] == "session_456"
        assert payload["metadata"] == {"custom": "data"}
        assert tenant_id == "tenant_123"

    @patch("src.core.raas_audit_logger.requests.Session.post")
    def test_log_event_success(self, mock_post, logger):
        """Test successful event logging."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"event_id": "evt_123"}
        mock_post.return_value.text = '{"event_id": "evt_123"}'

        result = logger.log_event(event="test_success")

        assert result.success is True
        assert result.status_code == 200
        assert result.event_id == "evt_123"
        assert result.elapsed_ms >= 0
        assert len(logger._trace_log) == 1  # Debug mode stores trace

    @patch("src.core.raas_audit_logger.requests.Session.post")
    def test_log_event_error(self, mock_post, logger):
        """Test event logging with HTTP error."""
        mock_post.return_value.status_code = 401
        mock_post.return_value.text = "Invalid credentials"

        result = logger.log_event(event="test_error")

        assert result.success is False
        assert result.status_code == 401
        assert "Invalid credentials" in result.error

    @patch("src.core.raas_audit_logger.requests.Session.post")
    def test_log_event_network_error(self, mock_post, logger):
        """Test event logging with network error."""
        import requests
        mock_post.side_effect = requests.RequestException("Connection refused")

        result = logger.log_event(event="test_network_error")

        assert result.success is False
        assert result.status_code == 0
        assert "Network error" in result.error

    def test_log_completion(self, logger):
        """Test log_completion convenience method."""
        with patch.object(logger, "log_event") as mock_log:
            logger.log_completion(commit_sha="abc", event="phase_complete")
            # Verify event and commit_sha were passed
            call_kwargs = mock_log.call_args[1]
            assert call_kwargs["event"] == "phase_complete"
            assert call_kwargs["commit_sha"] == "abc"

    def test_get_trace_log(self, logger):
        """Test getting trace log."""
        trace1 = RaaSInteractionTrace(
            timestamp="2026-03-08T12:00:00Z",
            event_type="event1",
            endpoint="/v2/audit",
            method="POST",
            headers_sent={},
            payload_sent={},
            status_code=200,
            response_body=None,
            elapsed_ms=10.0,
        )
        trace2 = RaaSInteractionTrace(
            timestamp="2026-03-08T12:01:00Z",
            event_type="event2",
            endpoint="/v2/audit",
            method="POST",
            headers_sent={},
            payload_sent={},
            status_code=401,
            response_body=None,
            elapsed_ms=5.0,
        )
        logger._trace_log = [trace1, trace2]

        traces = logger.get_trace_log()
        assert len(traces) == 2
        assert traces[0]["event_type"] == "event1"
        assert traces[1]["event_type"] == "event2"

    def test_clear_trace_log(self, logger):
        """Test clearing trace log."""
        logger._trace_log = [
            RaaSInteractionTrace(
                timestamp="2026-03-08T12:00:00Z",
                event_type="test",
                endpoint="/v2/audit",
                method="POST",
                headers_sent={},
                payload_sent={},
                status_code=200,
                response_body=None,
                elapsed_ms=10.0,
            )
        ]
        logger.clear_trace_log()
        assert len(logger._trace_log) == 0

    def test_export_trace(self, logger, tmp_path):
        """Test exporting trace to file."""
        trace = RaaSInteractionTrace(
            timestamp="2026-03-08T12:00:00Z",
            event_type="export_test",
            endpoint="/v2/audit",
            method="POST",
            headers_sent={"Authorization": "Bearer mk_test"},
            payload_sent={"project": "mekong-cli"},
            status_code=200,
            response_body='{"ok": true}',
            elapsed_ms=25.0,
        )
        logger._trace_log = [trace]

        output_file = tmp_path / "trace.json"
        result_path = logger.export_trace(str(output_file))

        assert result_path == str(output_file)
        assert output_file.exists()

        import json
        with open(output_file) as f:
            data = json.load(f)
        assert len(data) == 1
        assert data[0]["event_type"] == "export_test"


class TestAuditLoggerSingleton:
    """Test singleton pattern for audit logger."""

    def teardown_method(self):
        """Reset singleton after each test."""
        import src.core.raas_audit_logger as module
        module._audit_logger = None

    def test_get_audit_logger(self):
        """Test getting singleton logger."""
        from src.core.raas_audit_logger import _audit_logger as logger1
        logger1 = get_audit_logger()
        logger2 = get_audit_logger()
        assert logger1 is logger2

    def test_log_audit_convenience(self):
        """Test log_audit convenience function."""
        mock_logger = Mock()
        mock_result = AuditResult(success=True, status_code=200)
        mock_logger.log_event.return_value = mock_result

        with patch("src.core.raas_audit_logger._audit_logger", mock_logger):
            result = log_audit(event="test", commit_sha="abc")
            # Verify log_event was called (positional args)
            mock_logger.log_event.assert_called_once()
            call_args = mock_logger.log_event.call_args
            assert call_args[0][0] == "test"
            assert call_args[0][1] == "abc"
            assert result.success is True


class TestGatewayClientIntegration:
    """Test GatewayClient integration with audit logging."""

    @patch("src.core.gateway_client.get_audit_logger")
    @patch("src.core.gateway_client.get_auth_client")
    @patch("src.core.gateway_client.TelemetryReporter")
    @patch("src.core.gateway_client.requests.Session")
    def test_gateway_request_includes_jwt_attribution(
        self, mock_session_cls, mock_telemetry_cls, mock_get_auth, mock_get_audit_logger
    ):
        """Test that gateway requests include JWT attribution headers."""
        # Setup mock auth
        mock_auth = Mock()
        mock_auth._load_credentials.return_value = {"token": "jwt.token.here"}
        mock_auth.validate_credentials.return_value = Mock(
            valid=True,
            tenant=Mock(tenant_id="tenant_xyz"),
        )
        mock_get_auth.return_value = mock_auth

        # Setup mock telemetry reporter class
        mock_telemetry_instance = Mock()
        mock_telemetry_cls.return_value = mock_telemetry_instance

        # Setup mock audit logger
        mock_audit = Mock()
        mock_result = AuditResult(success=True, status_code=200)
        mock_audit.log_event.return_value = mock_result
        mock_get_audit_logger.return_value = mock_audit

        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "ok"}
        mock_response.headers = {"X-RateLimit-Remaining": "100"}
        mock_session_cls.return_value.request.return_value = mock_response

        # Import after mocks are set up
        from src.core.gateway_client import GatewayClient

        client = GatewayClient()
        result = client.request("POST", "/v1/test", json={"test": "data"})

        # Verify request was made with correct headers
        call_args = mock_session_cls.return_value.request.call_args
        headers = call_args[1]["headers"]

        assert "Authorization" in headers
        assert "X-RaaS-Source" in headers
        assert headers["X-RaaS-Source"] == "mekong-cli"
        assert headers["X-RaaS-Phase"] == "6"

        # Verify audit was logged
        mock_audit.log_event.assert_called_once()


class TestRaasDebugFlag:
    """Test --raas-debug flag functionality."""

    @patch.dict(os.environ, {"RAAS_DEBUG": "true"}, clear=True)
    def test_raas_debug_env_var(self):
        """Test RAAS_DEBUG environment variable enables debug mode."""
        logger = RAASAuditLogger()
        assert logger.debug_mode is True

    def test_raas_debug_default_false(self):
        """Test debug mode is False by default."""
        with patch.dict(os.environ, {}, clear=True):
            logger = RAASAuditLogger()
            assert logger.debug_mode is False
