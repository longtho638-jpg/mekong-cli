"""Tests for webhook_schema.py - Pydantic webhook payloads."""

from datetime import datetime

from src.core.webhook_schema import (
    WEBHOOK_EVENT_SCHEMAS,
    BaseWebhookPayload,
    CreditsLowPayload,
    MissionCompletedPayload,
    MissionCreatedPayload,
    MissionFailedPayload,
    MissionPlanningPayload,
    MissionStepCompletedPayload,
    MissionStepFailedPayload,
    MissionStepStartedPayload,
    get_payload_class,
)


class TestBaseWebhookPayload:
    """Test BaseWebhookPayload."""

    def test_base_timestamp(self):
        """Test base class timestamp is set."""
        payload = BaseWebhookPayload(event_type="test.event")
        assert payload.event_type == "test.event"
        assert payload.version == "1.0"
        assert isinstance(payload.timestamp, datetime)


class TestMissionCreatedPayload:
    """Test MissionCreatedPayload."""

    def test_mission_created_creation(self):
        """Test creating mission.created payload."""
        payload = MissionCreatedPayload(
            mission_id="test-123",
            goal="Deploy landing page",
            tenant_id="tenant-456",
            priority="high",
        )

        assert payload.event_type == "mission.created"
        assert payload.mission_id == "test-123"
        assert payload.goal == "Deploy landing page"
        assert payload.tenant_id == "tenant-456"
        assert payload.priority == "high"
        assert payload.status == "pending"
        assert payload.version == "1.0"

    def test_mission_created_default_priority(self):
        """Test default priority is normal."""
        payload = MissionCreatedPayload(
            mission_id="test-789",
            goal="Test goal",
            tenant_id="tenant-000",
        )
        assert payload.priority == "normal"


class TestMissionPlanningPayload:
    """Test MissionPlanningPayload."""

    def test_mission_planning_creation(self):
        """Test creating mission.planning payload."""
        payload = MissionPlanningPayload(
            mission_id="test-plan-123",
            goal="Build FastAPI app",
            plan_steps=[
                {"task": "Create main.py", "agent": "developer"},
                {"task": "Create tests", "agent": "tester"},
            ],
            estimated_duration_seconds=300,
        )

        assert payload.event_type == "mission.planning"
        assert len(payload.plan_steps) == 2
        assert payload.estimated_duration_seconds == 300


class TestMissionStepStartedPayload:
    """Test MissionStepStartedPayload."""

    def test_step_started_creation(self):
        """Test creating mission.step.started payload."""
        payload = MissionStepStartedPayload(
            mission_id="test-step-123",
            step_id="step-001",
            step_number=1,
            step_description="Create main.py with FastAPI",
            agent_name="fullstack-developer",
        )

        assert payload.event_type == "mission.step.started"
        assert payload.step_id == "step-001"
        assert payload.step_number == 1
        assert payload.agent_name == "fullstack-developer"


class TestMissionStepCompletedPayload:
    """Test MissionStepCompletedPayload."""

    def test_step_completed_creation(self):
        """Test creating mission.step.completed payload."""
        payload = MissionStepCompletedPayload(
            mission_id="test-complete-123",
            step_id="step-001",
            step_number=1,
            result={"files": ["main.py"]},
            duration_seconds=12.5,
            artifacts=["main.py", "test_main.py"],
        )

        assert payload.event_type == "mission.step.completed"
        assert payload.result["files"] == ["main.py"]
        assert payload.duration_seconds == 12.5
        assert payload.artifacts == ["main.py", "test_main.py"]


class TestMissionStepFailedPayload:
    """Test MissionStepFailedPayload."""

    def test_step_failed_creation(self):
        """Test creating mission.step.failed payload."""
        payload = MissionStepFailedPayload(
            mission_id="test-fail-123",
            step_id="step-002",
            step_number=2,
            error="SyntaxError: invalid syntax",
            error_type="syntax_error",
            retry_count=1,
            max_retries=3,
            can_retry=True,
            retry_after_seconds=5,
        )

        assert payload.event_type == "mission.step.failed"
        assert payload.error == "SyntaxError: invalid syntax"
        assert payload.error_type == "syntax_error"
        assert payload.retry_count == 1
        assert payload.can_retry is True

    def test_step_failed_max_retries_exceeded(self):
        """Test payload when max retries exceeded."""
        payload = MissionStepFailedPayload(
            mission_id="test-fail-456",
            step_id="step-003",
            step_number=3,
            error="Connection timeout",
            retry_count=3,
            max_retries=3,
            can_retry=False,
        )

        assert payload.retry_count == 3
        assert payload.max_retries == 3
        assert payload.can_retry is False


class TestMissionCompletedPayload:
    """Test MissionCompletedPayload."""

    def test_mission_completed_creation(self):
        """Test creating mission.completed payload."""
        payload = MissionCompletedPayload(
            mission_id="test-done-123",
            goal="Deploy production app",
            result={"status": "success", "files": ["main.py", "README.md"]},
            files_created=["main.py", "README.md", "requirements.txt"],
            total_steps=5,
            total_duration_seconds=120.5,
            metrics={"success_rate": 1.0, "retry_count": 0},
            credits_consumed=15,
        )

        assert payload.event_type == "mission.completed"
        assert payload.status == "completed"
        assert len(payload.files_created) == 3
        assert payload.total_steps == 5
        assert payload.credits_consumed == 15


class TestMissionFailedPayload:
    """Test MissionFailedPayload."""

    def test_mission_failed_creation(self):
        """Test creating mission.failed payload."""
        payload = MissionFailedPayload(
            mission_id="test-failed-123",
            goal="Impossible task",
            error="Max retries exceeded",
            error_type="execution_error",
            failed_at_step=3,
            total_steps_completed=2,
            retry_attempts=3,
            refund_eligible=True,
            credits_to_refund=10,
        )

        assert payload.event_type == "mission.failed"
        assert payload.status == "failed"
        assert payload.failed_at_step == 3
        assert payload.refund_eligible is True
        assert payload.credits_to_refund == 10


class TestCreditsLowPayload:
    """Test CreditsLowPayload."""

    def test_credits_low_creation(self):
        """Test creating credits.low payload."""
        payload = CreditsLowPayload(
            tenant_id="tenant-low-123",
            current_balance=5,
            threshold=10,
            currency="credits",
            top_up_url="https://agencyos.vn/topup",
        )

        assert payload.event_type == "credits.low"
        assert payload.current_balance == 5
        assert payload.threshold == 10
        assert payload.tenant_id == "tenant-low-123"
        assert "topup" in payload.top_up_url


class TestWebhookEventSchemas:
    """Test WEBHOOK_EVENT_SCHEMAS registry."""

    def test_all_events_documented(self):
        """Test all webhook events have schema documentation."""
        event_types = [schema.event_type for schema in WEBHOOK_EVENT_SCHEMAS]

        expected_events = [
            "mission.created",
            "mission.planning",
            "mission.step.started",
            "mission.step.completed",
            "mission.step.failed",
            "mission.completed",
            "mission.failed",
            "credits.low",
        ]

        for expected in expected_events:
            assert expected in event_types


class TestGetPayloadClass:
    """Test get_payload_class utility."""

    def test_get_valid_payload_class(self):
        """Test getting payload class for valid event types."""
        assert get_payload_class("mission.created") == MissionCreatedPayload
        assert get_payload_class("mission.planning") == MissionPlanningPayload
        assert get_payload_class("mission.step.started") == MissionStepStartedPayload
        assert (
            get_payload_class("mission.step.completed") == MissionStepCompletedPayload
        )
        assert get_payload_class("mission.step.failed") == MissionStepFailedPayload
        assert get_payload_class("mission.completed") == MissionCompletedPayload
        assert get_payload_class("mission.failed") == MissionFailedPayload
        assert get_payload_class("credits.low") == CreditsLowPayload

    def test_get_invalid_payload_class(self):
        """Test getting payload class for invalid event type."""
        assert get_payload_class("invalid.event") is None
        assert get_payload_class("") is None
