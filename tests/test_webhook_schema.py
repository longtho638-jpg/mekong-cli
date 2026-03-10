"""Tests for Webhook Event Schema — Pydantic payload models."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.core.webhook_schema import (
    CreditsLowPayload,
    MissionCompletedPayload,
    MissionCreatedPayload,
    MissionFailedPayload,
    MissionPlanningPayload,
    MissionStepCompletedPayload,
    MissionStepFailedPayload,
    MissionStepStartedPayload,
    WEBHOOK_EVENT_SCHEMAS,
    get_payload_class,
)


class TestMissionCreatedPayload:
    def test_minimal(self) -> None:
        p = MissionCreatedPayload(mission_id="m-1", goal="Deploy", tenant_id="t-1")
        assert p.event_type == "mission.created"
        assert p.priority == "normal"
        assert p.status == "pending"

    def test_with_priority(self) -> None:
        p = MissionCreatedPayload(
            mission_id="m-2", goal="Fix bug", tenant_id="t-1", priority="high"
        )
        assert p.priority == "high"

    def test_serialization(self) -> None:
        p = MissionCreatedPayload(mission_id="m-3", goal="Test", tenant_id="t-1")
        data = p.model_dump()
        assert data["event_type"] == "mission.created"
        assert "timestamp" in data


class TestMissionPlanningPayload:
    def test_with_steps(self) -> None:
        p = MissionPlanningPayload(
            mission_id="m-1",
            goal="Build API",
            plan_steps=[{"task": "Create models"}, {"task": "Add routes"}],
        )
        assert len(p.plan_steps) == 2
        assert p.event_type == "mission.planning"


class TestStepPayloads:
    def test_step_started(self) -> None:
        p = MissionStepStartedPayload(
            mission_id="m-1", step_id="s-1", step_number=1, step_description="Init"
        )
        assert p.event_type == "mission.step.started"

    def test_step_completed(self) -> None:
        p = MissionStepCompletedPayload(
            mission_id="m-1", step_id="s-1", step_number=1, duration_seconds=5.2
        )
        assert p.duration_seconds == 5.2

    def test_step_failed(self) -> None:
        p = MissionStepFailedPayload(
            mission_id="m-1", step_id="s-1", step_number=1, error="timeout"
        )
        assert p.can_retry is True
        assert p.retry_count == 0


class TestMissionCompletedPayload:
    def test_completed(self) -> None:
        p = MissionCompletedPayload(
            mission_id="m-1",
            goal="Deploy",
            total_steps=5,
            total_duration_seconds=120.5,
            files_created=["main.py"],
        )
        assert p.status == "completed"
        assert len(p.files_created) == 1


class TestMissionFailedPayload:
    def test_failed(self) -> None:
        p = MissionFailedPayload(
            mission_id="m-1", goal="Build", error="OOM"
        )
        assert p.status == "failed"
        assert p.refund_eligible is True


class TestCreditsLowPayload:
    def test_credits_low(self) -> None:
        p = CreditsLowPayload(tenant_id="t-1", current_balance=5)
        assert p.event_type == "credits.low"
        assert p.threshold == 10


class TestWebhookEventSchemas:
    def test_schema_count(self) -> None:
        assert len(WEBHOOK_EVENT_SCHEMAS) == 8

    def test_all_have_fields(self) -> None:
        for schema in WEBHOOK_EVENT_SCHEMAS:
            assert schema.event_type
            assert schema.description
            assert schema.payload_class


class TestGetPayloadClass:
    def test_known_event(self) -> None:
        cls = get_payload_class("mission.created")
        assert cls is MissionCreatedPayload

    def test_unknown_event(self) -> None:
        cls = get_payload_class("unknown.event")
        assert cls is None

    def test_all_events_mapped(self) -> None:
        for schema in WEBHOOK_EVENT_SCHEMAS:
            cls = get_payload_class(schema.event_type)
            assert cls is not None, f"No class for {schema.event_type}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
