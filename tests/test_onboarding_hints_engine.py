"""Tests for OnboardingHintsEngine — personalized hints and dismissals."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.core.onboarding_hints_engine import OnboardingHintsEngine


@pytest.fixture
def engine(tmp_path: Path) -> OnboardingHintsEngine:
    return OnboardingHintsEngine(db_path=tmp_path / "test.db")


class TestGetHintsForStep:
    def test_signup_hints(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("signup_started")
        assert len(hints) >= 2
        ids = [h.hint_id for h in hints]
        assert "email_verification_tip" in ids

    def test_workspace_hints(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("workspace_created")
        assert len(hints) >= 2
        ids = [h.hint_id for h in hints]
        assert "workspace_naming_tip" in ids

    def test_llm_hints(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("llm_configured")
        assert len(hints) >= 2

    def test_tutorial_hints(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("tutorial_started")
        assert len(hints) >= 2

    def test_completion_hints(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("tutorial_completed")
        assert len(hints) >= 2
        ids = [h.hint_id for h in hints]
        assert "next_mission_tip" in ids

    def test_unknown_step(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("nonexistent_step")
        assert hints == []

    def test_sorted_by_priority(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("workspace_created")
        priorities = [h.priority for h in hints]
        assert priorities == sorted(priorities)


class TestDismissHint:
    def test_dismiss_removes_from_results(self, engine: OnboardingHintsEngine) -> None:
        hints_before = engine.get_hints_for_step("signup_started")
        hint_to_dismiss = hints_before[0].hint_id

        engine.dismiss_hint("u1", hint_to_dismiss)

        dismissed = engine._get_dismissed_hint_ids("u1")
        assert hint_to_dismiss in dismissed

    def test_dismiss_multiple(self, engine: OnboardingHintsEngine) -> None:
        engine.dismiss_hint("u1", "hint_a")
        engine.dismiss_hint("u1", "hint_b")
        dismissed = engine._get_dismissed_hint_ids("u1")
        assert "hint_a" in dismissed
        assert "hint_b" in dismissed

    def test_dismiss_user_isolation(self, engine: OnboardingHintsEngine) -> None:
        engine.dismiss_hint("u1", "some_hint")
        dismissed_u2 = engine._get_dismissed_hint_ids("u2")
        assert "some_hint" not in dismissed_u2


class TestDetermineCurrentStep:
    def test_no_events_returns_signup(self, engine: OnboardingHintsEngine) -> None:
        step = engine._determine_current_step([])
        assert step == "signup_started"

    def test_single_event(self, engine: OnboardingHintsEngine) -> None:
        events = [{"event_type": "workspace_created"}]
        step = engine._determine_current_step(events)
        assert step == "workspace_created"

    def test_multiple_events_returns_furthest(self, engine: OnboardingHintsEngine) -> None:
        events = [
            {"event_type": "signup_started"},
            {"event_type": "workspace_created"},
            {"event_type": "llm_configured"},
        ]
        step = engine._determine_current_step(events)
        assert step == "llm_configured"

    def test_unrecognized_events_returns_signup(self, engine: OnboardingHintsEngine) -> None:
        events = [{"event_type": "unknown_event"}]
        step = engine._determine_current_step(events)
        assert step == "signup_started"


class TestGetActiveHints:
    def test_all_hints_active_initially(self, engine: OnboardingHintsEngine) -> None:
        active = engine.get_active_hints("new_user")
        assert len(active) > 0

    def test_dismissed_excluded(self, engine: OnboardingHintsEngine) -> None:
        all_hints = engine.get_active_hints("u1")
        count_before = len(all_hints)
        engine.dismiss_hint("u1", all_hints[0].hint_id)
        after = engine.get_active_hints("u1")
        assert len(after) == count_before - 1


class TestHintDataclass:
    def test_hint_fields(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("llm_configured")
        hint = hints[0]
        assert hasattr(hint, "hint_id")
        assert hasattr(hint, "category")
        assert hasattr(hint, "title")
        assert hasattr(hint, "message")
        assert hasattr(hint, "priority")

    def test_hint_with_action(self, engine: OnboardingHintsEngine) -> None:
        hints = engine.get_hints_for_step("workspace_created")
        action_hints = [h for h in hints if h.action_url]
        assert len(action_hints) >= 1
        assert action_hints[0].action_label is not None
