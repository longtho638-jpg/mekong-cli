"""Tests for ABTestService — experiment CRUD, deterministic assignment, conversions."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.ab_test_service import ABTestService


@pytest.fixture
def service(tmp_path: Path) -> ABTestService:
    return ABTestService(db_path=tmp_path / "test.db")


class TestCreateExperiment:
    def test_create_returns_experiment(self, service: ABTestService) -> None:
        exp = service.create_experiment("test_exp", "A test experiment")
        assert exp.name == "test_exp"
        assert exp.status == "draft"
        assert exp.variant_a == "control"
        assert exp.variant_b == "treatment"
        assert exp.allocation == 50

    def test_custom_variants(self, service: ABTestService) -> None:
        exp = service.create_experiment("custom", "Custom", "old_flow", "new_flow", 30)
        assert exp.variant_a == "old_flow"
        assert exp.variant_b == "new_flow"
        assert exp.allocation == 30

    def test_duplicate_name_raises(self, service: ABTestService) -> None:
        service.create_experiment("dup", "First")
        with pytest.raises(ValueError, match="already exists"):
            service.create_experiment("dup", "Second")


class TestGetExperiment:
    def test_get_existing(self, service: ABTestService) -> None:
        service.create_experiment("find_me", "Findable")
        exp = service.get_experiment("find_me")
        assert exp is not None
        assert exp.name == "find_me"

    def test_get_nonexistent(self, service: ABTestService) -> None:
        exp = service.get_experiment("nope")
        assert exp is None


class TestStartExperiment:
    def test_start_draft(self, service: ABTestService) -> None:
        service.create_experiment("start_test", "To start")
        ok = service.start_experiment("start_test")
        assert ok is True
        exp = service.get_experiment("start_test")
        assert exp is not None
        assert exp.status == "active"

    def test_start_nonexistent(self, service: ABTestService) -> None:
        ok = service.start_experiment("nope")
        assert ok is False


class TestDeterministicAssignment:
    def test_same_user_same_variant(self, service: ABTestService) -> None:
        h1 = service._hash_assignment("user_123", "exp_1")
        h2 = service._hash_assignment("user_123", "exp_1")
        assert h1 == h2

    def test_different_users_may_differ(self, service: ABTestService) -> None:
        h1 = service._hash_assignment("user_1", "exp_1")
        h2 = service._hash_assignment("user_2", "exp_1")
        # Not guaranteed to differ, but hash should be in range
        assert 0 <= h1 <= 99
        assert 0 <= h2 <= 99

    def test_hash_range(self, service: ABTestService) -> None:
        for i in range(100):
            h = service._hash_assignment(f"user_{i}", "exp_test")
            assert 0 <= h <= 99


class TestGetAssignment:
    def test_returns_none_for_inactive(self, service: ABTestService) -> None:
        service.create_experiment("draft_exp", "Still draft")
        variant = service.get_assignment("u1", "draft_exp")
        assert variant is None

    def test_returns_variant_for_active(self, service: ABTestService) -> None:
        service.create_experiment("active_exp", "Active")
        service.start_experiment("active_exp")
        variant = service.get_assignment("u1", "active_exp")
        assert variant in ("control", "treatment")

    def test_consistent_assignment(self, service: ABTestService) -> None:
        service.create_experiment("consistent", "Consistent test")
        service.start_experiment("consistent")
        v1 = service.get_assignment("u1", "consistent")
        v2 = service.get_assignment("u1", "consistent")
        assert v1 == v2

    def test_nonexistent_experiment(self, service: ABTestService) -> None:
        variant = service.get_assignment("u1", "nope")
        assert variant is None


class TestRecordExposureAndConversion:
    def test_record_exposure(self, service: ABTestService) -> None:
        service.create_experiment("exp_expose", "Exposure test")
        service.start_experiment("exp_expose")
        variant = service.get_assignment("u1", "exp_expose")
        assert variant is not None
        ok = service.record_exposure("u1", "exp_expose", variant)
        assert ok is True

    def test_record_conversion(self, service: ABTestService) -> None:
        service.create_experiment("exp_convert", "Conversion test")
        service.start_experiment("exp_convert")
        service.get_assignment("u1", "exp_convert")
        ok = service.record_conversion("u1", "exp_convert")
        assert ok is True

    def test_conversion_without_assignment(self, service: ABTestService) -> None:
        service.create_experiment("exp_no_assign", "No assignment")
        ok = service.record_conversion("u1", "exp_no_assign")
        assert ok is False


class TestExperimentLifecycle:
    def test_pause_active(self, service: ABTestService) -> None:
        service.create_experiment("lifecycle", "Lifecycle test")
        service.start_experiment("lifecycle")
        ok = service.pause_experiment("lifecycle")
        assert ok is True
        exp = service.get_experiment("lifecycle")
        assert exp is not None
        assert exp.status == "paused"

    def test_complete_experiment(self, service: ABTestService) -> None:
        service.create_experiment("to_complete", "Complete test")
        ok = service.complete_experiment("to_complete")
        assert ok is True
        exp = service.get_experiment("to_complete")
        assert exp is not None
        assert exp.status == "completed"
        assert exp.ended_at is not None
