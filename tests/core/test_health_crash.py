"""Tests for health endpoint and crash detector modules."""

import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from src.core.crash_detector import (
    CrashDetector,
    CrashEvent,
    CrashFrequency,
    get_crash_detector,
    reset_crash_detector,
)
from src.core.health_endpoint import (
    ComponentStatus,
    HealthResponse,
    create_health_app,
    get_health_url,
    register_component_check,
    unregister_component_check,
)


class TestComponentStatus:
    """Tests for ComponentStatus model."""

    def test_healthy_status(self) -> None:
        """Test healthy component status."""
        status = ComponentStatus(status="healthy", message="All good")
        assert status.status == "healthy"
        assert status.message == "All good"

    def test_status_with_latency(self) -> None:
        """Test status with latency measurement."""
        status = ComponentStatus(
            status="healthy",
            message="Fast response",
            latency_ms=45.2,
        )
        assert status.latency_ms == 45.2

    def test_status_optional_fields(self) -> None:
        """Test status with optional fields."""
        status = ComponentStatus(status="degraded")
        assert status.message is None
        assert status.latency_ms is None


class TestHealthResponse:
    """Tests for HealthResponse model."""

    def test_healthy_response(self) -> None:
        """Test healthy health response."""
        response = HealthResponse(
            status="healthy",
            components={
                "license": ComponentStatus(status="healthy"),
                "proxy": ComponentStatus(status="healthy"),
            },
            timestamp=datetime.now(timezone.utc).isoformat(),
            version="3.0.0",
        )
        assert response.status == "healthy"
        assert len(response.components) == 2

    def test_degraded_response(self) -> None:
        """Test degraded health response."""
        response = HealthResponse(
            status="degraded",
            components={
                "license": ComponentStatus(status="healthy"),
                "usage": ComponentStatus(status="degraded", message="High usage"),
            },
            timestamp=datetime.now(timezone.utc).isoformat(),
            version="3.0.0",
        )
        assert response.status == "degraded"


class TestHealthEndpointApp:
    """Tests for FastAPI health endpoint app."""

    def test_create_health_app(self) -> None:
        """Test health app creation."""
        app = create_health_app()
        assert app is not None
        assert app.title == "Mekong CLI Health"

    def test_health_endpoint_routes(self) -> None:
        """Test health endpoint has required routes."""
        app = create_health_app()
        routes = {r.path for r in app.routes}
        assert "/health" in routes
        assert "/ready" in routes
        assert "/live" in routes

    def test_get_health_url(self) -> None:
        """Test health URL generation."""
        url = get_health_url(host="localhost", port=9999)
        assert url == "http://localhost:9999/health"


class TestComponentCheckRegistry:
    """Tests for component check registration."""

    def setup_method(self) -> None:
        """Reset registry before each test."""
        # Clean up any registered checks
        for check in ["test_license", "test_usage", "test_proxy"]:
            unregister_component_check(check)

    def test_register_component_check(self) -> None:
        """Test registering a component check."""
        def check_fn() -> ComponentStatus:
            return ComponentStatus(status="healthy")

        register_component_check("test_license", check_fn)
        # Verify registration succeeds without error
        assert True

    def test_unregister_component_check(self) -> None:
        """Test unregistering a component check."""
        def check_fn() -> ComponentStatus:
            return ComponentStatus(status="healthy")

        register_component_check("test_usage", check_fn)
        result = unregister_component_check("test_usage")
        assert result is True

    def test_unregister_nonexistent(self) -> None:
        """Test unregistering a non-existent check."""
        result = unregister_component_check("nonexistent_check")
        assert result is False


class TestCrashEvent:
    """Tests for CrashEvent dataclass."""

    def test_crash_event_creation(self) -> None:
        """Test creating a crash event."""
        event = CrashEvent(
            crash_id="crash-123-abc",
            timestamp="2026-03-07T10:00:00Z",
            exit_code=1,
            command="mekong cook test",
        )
        assert event.crash_id == "crash-123-abc"
        assert event.exit_code == 1
        assert event.stderr is None

    def test_crash_event_with_metadata(self) -> None:
        """Test crash event with full metadata."""
        event = CrashEvent(
            crash_id="crash-456-def",
            timestamp="2026-03-07T11:00:00Z",
            exit_code=130,
            command="mekong plan test",
            stderr="KeyboardInterrupt",
            cwd="/tmp/test",
            duration_ms=1500.5,
            metadata={"retry_count": 2},
        )
        assert event.stderr == "KeyboardInterrupt"
        assert event.cwd == "/tmp/test"
        assert event.duration_ms == 1500.5
        assert event.metadata["retry_count"] == 2

    def test_crash_event_to_dict(self) -> None:
        """Test converting crash event to dictionary."""
        event = CrashEvent(
            crash_id="crash-789-ghi",
            timestamp="2026-03-07T12:00:00Z",
            exit_code=2,
            command="mekong build",
        )
        data = event.to_dict()
        assert data["crash_id"] == "crash-789-ghi"
        assert data["exit_code"] == 2


class TestCrashFrequency:
    """Tests for CrashFrequency dataclass."""

    def test_frequency_creation(self) -> None:
        """Test creating crash frequency."""
        freq = CrashFrequency(
            crashes_per_hour=5.5,
            crashes_last_hour=3,
            first_crash_time="2026-03-07T09:00:00Z",
            last_crash_time="2026-03-07T10:30:00Z",
        )
        assert freq.crashes_per_hour == 5.5
        assert freq.crashes_last_hour == 3


class TestCrashDetector:
    """Tests for CrashDetector class."""

    @pytest.fixture
    def detector(self, tmp_path: Path) -> CrashDetector:
        """Create a CrashDetector with temp directory."""
        crashes_dir = tmp_path / "crashes"
        return CrashDetector(crashes_dir=str(crashes_dir))

    def test_init_creates_directory(self, detector: CrashDetector) -> None:
        """Test initialization creates crashes directory."""
        assert detector.crashes_dir.exists()

    def test_record_crash(self, detector: CrashDetector) -> None:
        """Test recording a crash event."""
        crash = detector.record_crash(
            exit_code=1,
            command="mekong cook test",
            stderr="Error: Connection refused",
        )
        assert crash.exit_code == 1
        assert crash.command == "mekong cook test"
        assert "crash-" in crash.crash_id

    def test_record_crash_persists_to_disk(
        self, detector: CrashDetector, tmp_path: Path,
    ) -> None:
        """Test crash is persisted to disk."""
        crash = detector.record_crash(
            exit_code=130,
            command="mekong plan test",
        )

        crash_file = detector.crashes_dir / f"{crash.crash_id}.json"
        assert crash_file.exists()

        data = json.loads(crash_file.read_text())
        assert data["exit_code"] == 130

    def test_get_frequency_empty(self, detector: CrashDetector) -> None:
        """Test frequency with no crashes."""
        freq = detector.get_frequency()
        assert freq.crashes_per_hour == 0.0
        assert freq.crashes_last_hour == 0

    def test_get_frequency_with_crashes(self, detector: CrashDetector) -> None:
        """Test frequency calculation with crashes."""
        # Record some crashes
        detector.record_crash(exit_code=1, command="cmd1")
        detector.record_crash(exit_code=2, command="cmd2")

        freq = detector.get_frequency()
        assert freq.crashes_last_hour == 2
        assert freq.crashes_per_hour >= 0.0

    def test_get_recent_crashes(self, detector: CrashDetector) -> None:
        """Test getting recent crashes."""
        # Record multiple crashes
        for i in range(5):
            detector.record_crash(exit_code=i, command=f"cmd{i}")

        recent = detector.get_recent_crashes(limit=3)
        assert len(recent) == 3
        # Most recent first
        assert recent[0].exit_code == 4

    def test_get_crash_summary(self, detector: CrashDetector) -> None:
        """Test crash summary generation."""
        detector.record_crash(exit_code=1, command="cmd1")
        detector.record_crash(exit_code=1, command="cmd2")
        detector.record_crash(exit_code=2, command="cmd3")

        summary = detector.get_crash_summary()
        assert summary["total_crashes_stored"] == 3
        assert 1 in summary["exit_code_distribution"]

    def test_clear_history(self, detector: CrashDetector) -> None:
        """Test clearing crash history."""
        detector.record_crash(exit_code=1, command="cmd1")
        detector.record_crash(exit_code=2, command="cmd2")

        cleared = detector.clear_history()
        assert cleared == 2
        assert len(detector.get_recent_crashes()) == 0

    def test_get_singleton(self, tmp_path: Path) -> None:
        """Test getting global crash detector instance."""
        reset_crash_detector()
        detector = get_crash_detector(crashes_dir=str(tmp_path / "crashes"))
        assert detector is not None

        # Second call returns same instance
        detector2 = get_crash_detector()
        assert detector is detector2


class TestCrashDetectorIntegration:
    """Integration tests for crash detector with event bus."""

    def test_crash_emits_event(self, tmp_path: Path) -> None:
        """Test that recording a crash emits an event."""
        from src.core.event_bus import get_event_bus, EventType

        detector = CrashDetector(crashes_dir=str(tmp_path / "crashes"))
        event_bus = get_event_bus()
        events_received = []

        def handler(event):
            events_received.append(event)

        event_bus.subscribe(EventType.HEALTH_CRITICAL, handler)

        detector.record_crash(exit_code=1, command="test_cmd")

        assert len(events_received) == 1
        assert events_received[0].type == EventType.HEALTH_CRITICAL
        assert events_received[0].data["exit_code"] == 1


class TestHealthEndpointIntegration:
    """Integration tests for health endpoint."""

    def test_health_app_testclient(self) -> None:
        """Test health endpoint with TestClient."""
        from fastapi.testclient import TestClient

        app = create_health_app()
        client = TestClient(app)

        # Test /live endpoint
        response = client.get("/live")
        assert response.status_code == 200
        data = response.json()
        assert data["alive"] is True

        # Test /ready endpoint
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True

        # Test /health endpoint
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
