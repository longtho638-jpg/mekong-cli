"""Tests for EngagementStore — SQLite storage for retention data."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.engagement_store import EngagementStore, StreakData


@pytest.fixture
def store(tmp_path: Path) -> EngagementStore:
    return EngagementStore(db_path=tmp_path / "test.db")


class TestTrackEvent:
    def test_track_stores_event(self, store: EngagementStore) -> None:
        store.track_event("u1", "ws1", "login", "2026-03-14")
        events = store.get_user_events("u1", days=30)
        assert len(events) >= 1

    def test_deduplicates_same_day_type(self, store: EngagementStore) -> None:
        store.track_event("u1", "ws1", "login", "2026-03-14")
        store.track_event("u1", "ws1", "login", "2026-03-14")
        # Should increment count, not create duplicate
        counts = store.get_daily_event_counts("u1", days=30)
        login_count = sum(d.total_events for d in counts if "2026-03-14" == d.event_date)
        assert login_count == 2  # count incremented

    def test_different_types_same_day(self, store: EngagementStore) -> None:
        store.track_event("u1", "ws1", "login", "2026-03-14")
        store.track_event("u1", "ws1", "mission_run", "2026-03-14")
        counts = store.get_daily_event_counts("u1", days=30)
        assert len(counts) >= 1


class TestActiveDates:
    def test_returns_active_dates(self, store: EngagementStore) -> None:
        store.track_event("u1", "ws1", "login", "2026-03-12")
        store.track_event("u1", "ws1", "login", "2026-03-14")
        dates = store.get_active_dates("u1", days=30)
        assert "2026-03-12" in dates
        assert "2026-03-14" in dates

    def test_empty_for_unknown_user(self, store: EngagementStore) -> None:
        dates = store.get_active_dates("nobody", days=30)
        assert dates == []


class TestStreaks:
    def test_upsert_and_get(self, store: EngagementStore) -> None:
        data = StreakData("u1", 5, 10, "2026-03-14", "2026-03-10", 0)
        store.upsert_streak(data)
        result = store.get_streak("u1")
        assert result is not None
        assert result.current_streak == 5
        assert result.longest_streak == 10

    def test_upsert_updates_existing(self, store: EngagementStore) -> None:
        store.upsert_streak(StreakData("u1", 1, 1, "2026-03-13", "2026-03-13", 0))
        store.upsert_streak(StreakData("u1", 2, 2, "2026-03-14", "2026-03-13", 0))
        result = store.get_streak("u1")
        assert result is not None
        assert result.current_streak == 2

    def test_get_nonexistent(self, store: EngagementStore) -> None:
        assert store.get_streak("nobody") is None


class TestHealthSnapshots:
    def test_save_and_get(self, store: EngagementStore) -> None:
        store.save_health_snapshot("ws1", 85, "A", {"usage": 90, "adoption": 80, "billing": 75})
        history = store.get_health_history("ws1", days=30)
        assert len(history) == 1
        assert history[0].score == 85
        assert history[0].grade == "A"
        assert history[0].components["usage"] == 90

    def test_upsert_same_date(self, store: EngagementStore) -> None:
        store.save_health_snapshot("ws1", 70, "B", {}, "2026-03-14")
        store.save_health_snapshot("ws1", 80, "A", {}, "2026-03-14")
        history = store.get_health_history("ws1", days=30)
        assert len(history) == 1
        assert history[0].score == 80


class TestNudgeDismissals:
    def test_dismiss_and_get(self, store: EngagementStore) -> None:
        store.dismiss_nudge("u1", "nudge_1")
        dismissed = store.get_dismissed_nudge_ids("u1")
        assert "nudge_1" in dismissed

    def test_dismiss_idempotent(self, store: EngagementStore) -> None:
        store.dismiss_nudge("u1", "nudge_1")
        store.dismiss_nudge("u1", "nudge_1")
        dismissed = store.get_dismissed_nudge_ids("u1")
        assert dismissed.count("nudge_1") == 1

    def test_user_isolation(self, store: EngagementStore) -> None:
        store.dismiss_nudge("u1", "nudge_1")
        assert store.get_dismissed_nudge_ids("u2") == []
