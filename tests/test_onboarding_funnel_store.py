"""Tests for OnboardingFunnelStore — SQLite event tracking and funnel queries."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.onboarding_funnel_store import OnboardingFunnelStore


@pytest.fixture
def store(tmp_path: Path) -> OnboardingFunnelStore:
    """Create store with temp DB."""
    return OnboardingFunnelStore(db_path=tmp_path / "test.db")


class TestTrackEvent:
    def test_track_event_stores_record(self, store: OnboardingFunnelStore) -> None:
        store.track_event("u1", "ws1", "signup_started")
        events = store.get_user_funnel_progress("u1")
        assert len(events) == 1
        assert events[0]["event_type"] == "signup_started"

    def test_track_event_with_data(self, store: OnboardingFunnelStore) -> None:
        store.track_event("u1", "ws1", "llm_configured", {"provider": "openrouter"})
        events = store.get_user_funnel_progress("u1")
        assert events[0]["event_data"]["provider"] == "openrouter"

    def test_track_multiple_events(self, store: OnboardingFunnelStore) -> None:
        store.track_event("u1", "ws1", "signup_started")
        store.track_event("u1", "ws1", "workspace_created")
        events = store.get_user_funnel_progress("u1")
        assert len(events) == 2


class TestGetFunnelData:
    def test_empty_funnel(self, store: OnboardingFunnelStore) -> None:
        data = store.get_funnel_data(days=30)
        assert data.total_days == 30
        assert len(data.steps) == 6
        for step in data.steps:
            assert step.count == 0

    def test_funnel_with_data(self, store: OnboardingFunnelStore) -> None:
        for uid in ["u1", "u2", "u3"]:
            store.track_event(uid, "ws1", "signup_started")
        for uid in ["u1", "u2"]:
            store.track_event(uid, "ws1", "workspace_created")
        store.track_event("u1", "ws1", "llm_configured")

        data = store.get_funnel_data(days=30)
        signup = next(s for s in data.steps if s.step_name == "signup_started")
        workspace = next(s for s in data.steps if s.step_name == "workspace_created")
        llm = next(s for s in data.steps if s.step_name == "llm_configured")

        assert signup.count == 3
        assert workspace.count == 2
        assert llm.count == 1

    def test_funnel_conversion_rates(self, store: OnboardingFunnelStore) -> None:
        for uid in ["u1", "u2", "u3", "u4"]:
            store.track_event(uid, "ws1", "signup_started")
        for uid in ["u1", "u2"]:
            store.track_event(uid, "ws1", "workspace_created")

        data = store.get_funnel_data(days=30)
        signup = next(s for s in data.steps if s.step_name == "signup_started")
        workspace = next(s for s in data.steps if s.step_name == "workspace_created")

        assert signup.conversion_rate == 100.0
        assert workspace.conversion_rate == 50.0

    def test_funnel_overall_conversion(self, store: OnboardingFunnelStore) -> None:
        for uid in ["u1", "u2", "u3", "u4", "u5"]:
            store.track_event(uid, "ws1", "signup_started")
        store.track_event("u1", "ws1", "first_mission_completed")

        data = store.get_funnel_data(days=30)
        assert data.overall_conversion_rate == 20.0


class TestGetUserFunnelProgress:
    def test_no_events(self, store: OnboardingFunnelStore) -> None:
        events = store.get_user_funnel_progress("nonexistent")
        assert events == []

    def test_ordered_by_time(self, store: OnboardingFunnelStore) -> None:
        store.track_event("u1", "ws1", "signup_started")
        store.track_event("u1", "ws1", "workspace_created")
        events = store.get_user_funnel_progress("u1")
        assert events[0]["event_type"] == "signup_started"
        assert events[1]["event_type"] == "workspace_created"


class TestGetWorkspaceFunnelEvents:
    def test_workspace_events(self, store: OnboardingFunnelStore) -> None:
        store.track_event("u1", "ws1", "signup_started")
        store.track_event("u2", "ws1", "signup_started")
        store.track_event("u3", "ws2", "signup_started")

        events = store.get_workspace_funnel_events("ws1")
        assert len(events) == 2

    def test_empty_workspace(self, store: OnboardingFunnelStore) -> None:
        events = store.get_workspace_funnel_events("nonexistent")
        assert events == []
