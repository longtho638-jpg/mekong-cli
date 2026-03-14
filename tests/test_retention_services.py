"""Tests for retention services — engagement, churn, nudges, streaks, health."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.engagement_store import EngagementStore
from src.raas.engagement_tracker import EngagementTracker
from src.raas.churn_predictor import ChurnPredictor
from src.raas.nudge_engine import NudgeEngine
from src.raas.streak_service import StreakService
from src.raas.workspace_health import WorkspaceHealthCalculator


@pytest.fixture
def store(tmp_path: Path) -> EngagementStore:
    return EngagementStore(db_path=tmp_path / "test.db")


@pytest.fixture
def tracker(store: EngagementStore) -> EngagementTracker:
    return EngagementTracker(store=store)


# --- Engagement Tracker ---

class TestEngagementTracker:
    def test_empty_user_score(self, tracker: EngagementTracker) -> None:
        score = tracker.get_engagement_score("nobody", days=30)
        assert score.total_score == 0
        assert score.level == "inactive"
        assert score.active_days == 0

    def test_active_user_score(self, store: EngagementStore, tracker: EngagementTracker) -> None:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        store.track_event("u1", "ws1", "login", today)
        store.track_event("u1", "ws1", "mission_run", today)
        store.track_event("u1", "ws1", "api_call", today)
        score = tracker.get_engagement_score("u1", days=30)
        assert score.total_score > 0
        assert score.active_days >= 1
        assert score.unique_features >= 3

    def test_level_classification(self, tracker: EngagementTracker) -> None:
        assert tracker._classify_level(80) == "highly_engaged"
        assert tracker._classify_level(50) == "engaged"
        assert tracker._classify_level(20) == "at_risk"
        assert tracker._classify_level(5) == "inactive"

    def test_recency_scoring(self, tracker: EngagementTracker) -> None:
        assert tracker._score_recency(0) == 100
        assert tracker._score_recency(1) == 100
        assert tracker._score_recency(3) == 80
        assert tracker._score_recency(7) == 60
        assert tracker._score_recency(14) == 30
        assert tracker._score_recency(30) == 0


# --- Churn Predictor ---

class TestChurnPredictor:
    def test_inactive_user_high_risk(self, store: EngagementStore) -> None:
        churn = ChurnPredictor(store=store)
        risk = churn.predict_risk("ghost_user")
        assert risk.risk_level in ("high", "critical")
        assert risk.risk_score >= 45
        assert len(risk.risk_factors) > 0

    def test_active_user_low_risk(self, store: EngagementStore) -> None:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for etype in ["login", "mission_run", "api_call", "command_used"]:
            store.track_event("active_user", "ws1", etype, today)
        churn = ChurnPredictor(store=store)
        risk = churn.predict_risk("active_user")
        assert risk.risk_level == "low"

    def test_severity_classification(self, store: EngagementStore) -> None:
        churn = ChurnPredictor(store=store)
        assert churn._classify(75) == "critical"
        assert churn._classify(50) == "high"
        assert churn._classify(30) == "medium"
        assert churn._classify(10) == "low"


# --- Nudge Engine ---

class TestNudgeEngine:
    def test_inactive_user_gets_comeback_nudges(self, store: EngagementStore) -> None:
        nudge = NudgeEngine(store=store)
        nudges = nudge.get_nudges("inactive_user")
        assert len(nudges) > 0
        assert len(nudges) <= 3

    def test_dismiss_removes_nudge(self, store: EngagementStore) -> None:
        nudge = NudgeEngine(store=store)
        nudges = nudge.get_nudges("u1")
        if nudges:
            nudge.dismiss_nudge("u1", nudges[0].nudge_id)
            after = nudge.get_nudges("u1")
            dismissed_ids = {n.nudge_id for n in after}
            assert nudges[0].nudge_id not in dismissed_ids

    def test_max_3_nudges(self, store: EngagementStore) -> None:
        nudge = NudgeEngine(store=store)
        nudges = nudge.get_nudges("any_user")
        assert len(nudges) <= 3


# --- Streak Service ---

class TestStreakService:
    def test_first_activity_starts_streak(self, store: EngagementStore) -> None:
        streak = StreakService(store=store)
        info = streak.record_daily_activity("u1")
        assert info.current_streak == 1
        assert info.longest_streak == 1

    def test_same_day_no_change(self, store: EngagementStore) -> None:
        streak = StreakService(store=store)
        streak.record_daily_activity("u1")
        info = streak.record_daily_activity("u1")
        assert info.current_streak == 1

    def test_get_streak_no_data(self, store: EngagementStore) -> None:
        streak = StreakService(store=store)
        info = streak.get_streak("nobody")
        assert info.current_streak == 0
        assert len(info.badges) == 6
        assert all(not b.earned for b in info.badges)

    def test_badges_earned(self, store: EngagementStore) -> None:
        from src.raas.engagement_store import StreakData
        store.upsert_streak(StreakData("u1", 35, 35, "2026-03-14", "2026-02-07", 0))
        streak = StreakService(store=store)
        info = streak.get_streak("u1")
        earned = [b for b in info.badges if b.earned]
        assert len(earned) >= 3  # 7, 14, 30 day badges


# --- Workspace Health ---

class TestWorkspaceHealth:
    def test_empty_workspace(self, store: EngagementStore) -> None:
        health = WorkspaceHealthCalculator(store=store)
        result = health.calculate_health("empty_ws")
        assert 0 <= result.score <= 100
        assert result.grade in ("A", "B", "C", "D", "F")

    def test_active_workspace(self, store: EngagementStore) -> None:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for etype in ["login", "mission_run", "api_call"]:
            store.track_event("u1", "ws_active", etype, today)
        health = WorkspaceHealthCalculator(store=store)
        result = health.calculate_health("ws_active")
        assert result.active_users >= 1

    def test_grade_classification(self, store: EngagementStore) -> None:
        health = WorkspaceHealthCalculator(store=store)
        assert health._grade(90) == "A"
        assert health._grade(65) == "B"
        assert health._grade(45) == "C"
        assert health._grade(25) == "D"
        assert health._grade(10) == "F"

    def test_history_saved(self, store: EngagementStore) -> None:
        health = WorkspaceHealthCalculator(store=store)
        health.calculate_health("ws1")
        history = health.get_history("ws1")
        assert len(history) >= 1
