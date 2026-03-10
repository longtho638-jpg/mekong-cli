"""
Tests for UsageMeteringService

Tests cover:
- Event tracking (API calls, feature usage, runtime durations)
- SQLite buffering
- Batch transmission
- Circuit breaker behavior
- Retry logic with exponential backoff
- HMAC signature generation
"""

import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.lib.usage_metering_service import (
    CircuitBreaker,
    CircuitState,
    MetricsBatch,
    MetricsEvent,
    UsageMeteringService,
    get_service,
    init_service,
)


class TestMetricsEvent:
    """Test MetricsEvent dataclass."""

    def test_create_event(self) -> None:
        """Test creating a basic event."""
        event = MetricsEvent(
            event_type="api_call",
            tenant_id="test-tenant-123",
            timestamp="2026-03-06T12:00:00Z",
        )

        assert event.event_type == "api_call"
        assert event.tenant_id == "test-tenant-123"
        assert event.duration_ms is None
        assert event.metadata == {}

    def test_create_event_with_metadata(self) -> None:
        """Test creating event with duration and metadata."""
        event = MetricsEvent(
            event_type="runtime_duration",
            tenant_id="test-tenant",
            timestamp="2026-03-06T12:00:00Z",
            duration_ms=1500,
            metadata={"command": "python3 test.py", "exit_code": 0},
        )

        assert event.duration_ms == 1500
        assert event.metadata["command"] == "python3 test.py"
        assert event.metadata["exit_code"] == 0

    def test_to_dict(self) -> None:
        """Test event serialization."""
        event = MetricsEvent(
            event_type="feature_usage",
            tenant_id="tenant-456",
            timestamp="2026-03-06T12:00:00Z",
            duration_ms=500,
            metadata={"feature": "analytics"},
        )

        result = event.to_dict()

        assert result["event_type"] == "feature_usage"
        assert result["tenant_id"] == "tenant-456"
        assert result["duration_ms"] == 500
        assert result["metadata"]["feature"] == "analytics"


class TestMetricsBatch:
    """Test MetricsBatch dataclass."""

    def test_create_batch(self) -> None:
        """Test creating a batch of events."""
        events = [
            MetricsEvent(
                event_type="api_call",
                tenant_id="tenant-1",
                timestamp="2026-03-06T12:00:00Z",
            ),
            MetricsEvent(
                event_type="runtime_duration",
                tenant_id="tenant-1",
                timestamp="2026-03-06T12:01:00Z",
                duration_ms=1000,
            ),
        ]

        batch = MetricsBatch(
            tenant_id="tenant-1",
            events=events,
            batch_timestamp="2026-03-06T12:02:00Z",
        )

        assert len(batch.events) == 2
        assert batch.tenant_id == "tenant-1"

    def test_to_payload(self) -> None:
        """Test batch payload serialization."""
        events = [
            MetricsEvent(
                event_type="api_call",
                tenant_id="tenant-1",
                timestamp="2026-03-06T12:00:00Z",
                metadata={"endpoint": "/api/v1/test"},
            ),
        ]

        batch = MetricsBatch(
            tenant_id="tenant-1",
            events=events,
            batch_timestamp="2026-03-06T12:01:00Z",
        )

        payload = batch.to_payload()

        assert payload["tenant_id"] == "tenant-1"
        assert len(payload["events"]) == 1
        assert payload["events"][0]["metadata"]["endpoint"] == "/api/v1/test"
        assert "batch_timestamp" in payload


class TestCircuitBreaker:
    """Test CircuitBreaker behavior."""

    def test_initial_state_closed(self) -> None:
        """Test circuit breaker starts in CLOSED state."""
        cb = CircuitBreaker()
        assert cb.state == CircuitState.CLOSED
        assert cb.allow_request() is True

    def test_record_success(self) -> None:
        """Test recording success keeps circuit closed."""
        cb = CircuitBreaker()
        cb.record_success()
        assert cb.state == CircuitState.CLOSED

    def test_record_failure_below_threshold(self) -> None:
        """Test recording failures below threshold keeps circuit closed."""
        cb = CircuitBreaker(failure_threshold=5)

        for _ in range(4):
            cb.record_failure()
            assert cb.state == CircuitState.CLOSED

    def test_record_failure_opens_circuit(self) -> None:
        """Test recording failures up to threshold opens circuit."""
        cb = CircuitBreaker(failure_threshold=3)

        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        assert cb.allow_request() is False

    def test_half_open_after_timeout(self) -> None:
        """Test circuit transitions to HALF_OPEN after recovery timeout."""
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

        # Wait for recovery timeout
        time.sleep(0.15)

        # Should transition to HALF_OPEN
        assert cb.allow_request() is True
        assert cb.state == CircuitState.HALF_OPEN

    def test_success_in_half_open_closes_circuit(self) -> None:
        """Test success in HALF_OPEN state closes circuit."""
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        # Open the circuit
        cb.record_failure()
        cb.record_failure()

        # Wait and transition to HALF_OPEN
        time.sleep(0.15)
        cb.allow_request()
        assert cb.state == CircuitState.HALF_OPEN

        # Record success
        cb.record_success()
        assert cb.state == CircuitState.CLOSED

    def test_failure_in_half_open_opens_circuit(self) -> None:
        """Test failure in HALF_OPEN state opens circuit."""
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        # Open the circuit
        cb.record_failure()
        cb.record_failure()

        # Wait and transition to HALF_OPEN
        time.sleep(0.15)
        cb.allow_request()

        # Record failure
        cb.record_failure()
        assert cb.state == CircuitState.OPEN


class TestUsageMeteringService:
    """Test UsageMeteringService integration."""

    @pytest.fixture
    def temp_db(self, tmp_path: Path) -> str:
        """Create temporary database path."""
        db_path = tmp_path / "test_metrics.db"
        return str(db_path)

    @pytest.fixture
    def service(self, temp_db: str) -> UsageMeteringService:
        """Create service instance with temp database."""
        return UsageMeteringService(db_path=temp_db)

    def test_init_creates_database(self, temp_db: str) -> None:
        """Test service initialization creates database."""
        service = UsageMeteringService(db_path=temp_db)
        # Trigger database initialization
        service.get_stats()

        assert Path(temp_db).exists()
        stats = service.get_stats()
        assert stats["total_events"] == 0

    def test_track_api_call(self, service: UsageMeteringService) -> None:
        """Test tracking API call events."""
        service.track_api_call(
            tenant_id="test-tenant",
            endpoint="/api/v1/users",
            method="POST",
            status_code=200,
            duration_ms=150,
        )

        stats = service.get_stats()
        assert stats["pending_events"] == 1

    def test_track_feature_usage(self, service: UsageMeteringService) -> None:
        """Test tracking feature usage events."""
        service.track_feature_usage(
            tenant_id="test-tenant",
            feature_name="analytics_dashboard",
            metadata={"user_id": "user-123"},
        )

        stats = service.get_stats()
        assert stats["pending_events"] == 1

    def test_track_runtime_duration(self, service: UsageMeteringService) -> None:
        """Test tracking runtime duration events."""
        service.track_runtime_duration(
            tenant_id="test-tenant",
            command="python3 -m pytest",
            duration_ms=5000,
            exit_code=0,
        )

        stats = service.get_stats()
        assert stats["pending_events"] == 1

    def test_get_stats(self, service: UsageMeteringService) -> None:
        """Test getting service statistics."""
        service.track_api_call("tenant-1", "/api/test")
        service.track_feature_usage("tenant-1", "feature-a")
        service.track_runtime_duration("tenant-1", "test", 100)

        stats = service.get_stats()

        assert stats["total_events"] == 3
        assert stats["pending_events"] == 3
        assert stats["circuit_breaker_state"] == "closed"

    @patch("httpx.Client")
    def test_flush_sends_batch(
        self,
        mock_client_class: MagicMock,
        service: UsageMeteringService,
    ) -> None:
        """Test flushing sends events to API."""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_client = MagicMock()
        mock_client.__enter__ = lambda _: mock_client
        mock_client.__exit__ = lambda *args: None
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        # Add events
        service.track_api_call("tenant-1", "/api/test")
        service.track_feature_usage("tenant-1", "feature-test")

        # Flush
        flushed = service.flush()

        assert flushed == 2
        mock_client.post.assert_called_once()

    @patch("httpx.Client")
    def test_flush_retry_on_server_error(
        self,
        mock_client_class: MagicMock,
        service: UsageMeteringService,
    ) -> None:
        """Test retry logic on server errors."""
        # Mock server error then success
        mock_response_error = MagicMock()
        mock_response_error.status_code = 500

        mock_response_success = MagicMock()
        mock_response_success.status_code = 200

        mock_client = MagicMock()
        mock_client.__enter__ = lambda _: mock_client
        mock_client.__exit__ = lambda *args: None
        mock_client.post.side_effect = [
            mock_response_error,
            mock_response_success,
        ]
        mock_client_class.return_value = mock_client

        service.track_api_call("tenant-1", "/api/test")

        flushed = service.flush()

        assert flushed == 1
        assert mock_client.post.call_count == 2

    @patch("httpx.Client")
    def test_circuit_breaker_opens_on_failures(
        self,
        mock_client_class: MagicMock,
        service: UsageMeteringService,
    ) -> None:
        """Test circuit breaker opens after consecutive failures."""
        # Mock consistent server errors
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_client = MagicMock()
        mock_client.__enter__ = lambda _: mock_client
        mock_client.__exit__ = lambda *args: None
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        # Add and try to flush multiple times
        for _ in range(6):
            service.track_api_call("tenant-1", "/api/test")

        service.flush()

        # Circuit should be open after 5 failures
        stats = service.get_stats()
        assert stats["circuit_breaker_state"] == "open"


class TestHmacSignature:
    """Test HMAC-SHA256 signature generation."""

    @pytest.fixture
    def service(self, tmp_path: Path) -> UsageMeteringService:
        """Create service with test license key."""
        return UsageMeteringService(
            db_path=str(tmp_path / "test.db"),
            license_key="test-secret-key-123",
        )

    def test_signature_generation(self, service: UsageMeteringService) -> None:
        """Test HMAC signature is generated correctly."""
        payload = {"tenant_id": "test", "events": []}
        signature = service._generate_signature(payload)

        # Signature should be 64 character hex string
        assert len(signature) == 64
        assert all(c in "0123456789abcdef" for c in signature)

    def test_signature_consistency(self, service: UsageMeteringService) -> None:
        """Test same payload produces same signature."""
        payload = {"tenant_id": "test", "value": 123}

        sig1 = service._generate_signature(payload)
        sig2 = service._generate_signature(payload)

        assert sig1 == sig2

    def test_signature_changes_with_payload(self, service: UsageMeteringService) -> None:
        """Test different payloads produce different signatures."""
        payload1 = {"tenant_id": "test", "value": 123}
        payload2 = {"tenant_id": "test", "value": 456}

        sig1 = service._generate_signature(payload1)
        sig2 = service._generate_signature(payload2)

        assert sig1 != sig2

    def test_empty_signature_without_key(self, tmp_path: Path) -> None:
        """Test empty signature when no license key."""
        service = UsageMeteringService(db_path=str(tmp_path / "test.db"))
        payload = {"tenant_id": "test"}

        signature = service._generate_signature(payload)
        assert signature == ""


class TestOfflineCaching:
    """Test offline caching behavior."""

    @pytest.fixture
    def service(self, tmp_path: Path) -> UsageMeteringService:
        """Create service with no API endpoint."""
        return UsageMeteringService(
            db_path=str(tmp_path / "test.db"),
            api_endpoint="http://localhost:9999/nonexistent",
            max_retries=2,
        )

    def test_events_buffered_when_api_unavailable(
        self,
        service: UsageMeteringService,
    ) -> None:
        """Test events remain in buffer when API is down."""
        service.track_api_call("tenant-1", "/api/test")
        service.track_feature_usage("tenant-1", "feature-test")

        # Flush will fail but events stay in buffer
        flushed = service.flush()

        # Nothing should be flushed
        assert flushed == 0

        # Events remain pending
        stats = service.get_stats()
        assert stats["pending_events"] == 2

    def test_multiple_flush_attempts(self, service: UsageMeteringService) -> None:
        """Test multiple flush attempts don't lose events."""
        service.track_runtime_duration("tenant-1", "test", 100)

        # Multiple flush attempts
        service.flush()
        service.flush()
        service.flush()

        stats = service.get_stats()
        # Events should still be pending
        assert stats["pending_events"] >= 1


class TestGlobalService:
    """Test global service instance management."""

    def test_get_service_creates_instance(self) -> None:
        """Test get_service creates instance if none exists."""
        # Reset global state
        import src.lib.usage_metering_service as mod
        mod._service = None

        service = get_service()
        assert service is not None
        assert isinstance(service, UsageMeteringService)

    def test_get_service_returns_same_instance(self) -> None:
        """Test get_service returns same instance on repeated calls."""
        import src.lib.usage_metering_service as mod
        mod._service = None

        service1 = get_service()
        service2 = get_service()

        assert service1 is service2

    def test_init_service_creates_new_instance(self, tmp_path: Path) -> None:
        """Test init_service creates configured instance."""
        import src.lib.usage_metering_service as mod
        mod._service = None

        db_path = str(tmp_path / "custom.db")
        service = init_service(db_path=db_path, batch_size=50)

        assert service is not None
        assert get_service() is service
