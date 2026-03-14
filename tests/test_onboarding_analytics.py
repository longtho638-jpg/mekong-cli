"""Tests for OnboardingAnalytics — conversion rates, drop-offs, time metrics, cohorts."""
from __future__ import annotations

from pathlib import Path

import pytest

from src.raas.onboarding_funnel_store import OnboardingFunnelStore
from src.raas.onboarding_analytics import OnboardingAnalytics


@pytest.fixture
def store(tmp_path: Path) -> OnboardingFunnelStore:
    return OnboardingFunnelStore(db_path=tmp_path / "test.db")


@pytest.fixture
def analytics(store: OnboardingFunnelStore) -> OnboardingAnalytics:
    return OnboardingAnalytics(store=store)


def _seed_funnel(store: OnboardingFunnelStore, counts: dict[str, list[str]]) -> None:
    """Seed funnel events. counts maps event_type to list of user_ids."""
    for event_type, user_ids in counts.items():
        for uid in user_ids:
            store.track_event(uid, "ws1", event_type)


class TestConversionRates:
    def test_empty_funnel(self, analytics: OnboardingAnalytics) -> None:
        rates = analytics.get_conversion_rates(days=30)
        # Empty funnel still returns step pairs, all with 0 counts
        assert len(rates) == 5
        for rate in rates:
            assert rate.from_count == 0
            assert rate.conversion_rate == 0.0

    def test_conversion_between_steps(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        _seed_funnel(store, {
            "signup_started": ["u1", "u2", "u3", "u4"],
            "workspace_created": ["u1", "u2", "u3"],
            "llm_configured": ["u1", "u2"],
        })
        rates = analytics.get_conversion_rates(days=30)
        assert len(rates) >= 2

        signup_to_ws = rates[0]
        assert signup_to_ws.from_step == "signup_started"
        assert signup_to_ws.to_step == "workspace_created"
        assert signup_to_ws.conversion_rate == 75.0
        assert signup_to_ws.drop_off_count == 1

    def test_zero_from_count(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        # Only middle steps have data — first step has 0
        store.track_event("u1", "ws1", "workspace_created")
        rates = analytics.get_conversion_rates(days=30)
        # First rate: signup(0) -> workspace(1), conversion 0%
        first = rates[0]
        assert first.conversion_rate == 0.0


class TestDropOffPoints:
    def test_empty_funnel(self, analytics: OnboardingAnalytics) -> None:
        drops = analytics.get_drop_off_points(days=30)
        assert drops == []

    def test_identifies_drop_offs(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        _seed_funnel(store, {
            "signup_started": ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10"],
            "workspace_created": ["u1", "u2", "u3", "u4", "u5"],
            "llm_configured": ["u1", "u2", "u3", "u4"],
        })
        drops = analytics.get_drop_off_points(days=30)
        assert len(drops) > 0
        # Biggest drop-off should be signup -> workspace (5 users, 50%)
        biggest = drops[0]
        assert biggest.step_name == "signup_started"
        assert biggest.users_dropped == 5
        assert biggest.drop_off_severity == "critical"

    def test_severity_classification(self, analytics: OnboardingAnalytics) -> None:
        assert analytics._classify_drop_off_severity(60) == "critical"
        assert analytics._classify_drop_off_severity(35) == "high"
        assert analytics._classify_drop_off_severity(20) == "medium"
        assert analytics._classify_drop_off_severity(5) == "low"


class TestTimeToComplete:
    def test_empty_funnel(self, analytics: OnboardingAnalytics) -> None:
        metrics = analytics.get_avg_time_to_complete(days=30)
        assert metrics == []

    def test_with_events(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        store.track_event("u1", "ws1", "signup_started")
        store.track_event("u1", "ws1", "workspace_created")
        metrics = analytics.get_avg_time_to_complete(days=30)
        assert len(metrics) >= 1, "Expected at least one time-to-complete metric"
        assert metrics[0].step_name == "workspace_created"
        assert metrics[0].sample_count >= 1


class TestCohortData:
    def test_empty_funnel(self, analytics: OnboardingAnalytics) -> None:
        cohorts = analytics.get_cohort_data(period="daily", days=30)
        assert cohorts == []

    def test_daily_cohorts(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        _seed_funnel(store, {
            "signup_started": ["u1", "u2"],
            "first_mission_completed": ["u1"],
        })
        cohorts = analytics.get_cohort_data(period="daily", days=30)
        assert len(cohorts) >= 1
        assert cohorts[0].users_started == 2
        assert cohorts[0].users_completed == 1
        assert cohorts[0].conversion_rate == 50.0


class TestSummary:
    def test_summary_structure(
        self, store: OnboardingFunnelStore, analytics: OnboardingAnalytics
    ) -> None:
        _seed_funnel(store, {
            "signup_started": ["u1", "u2"],
            "workspace_created": ["u1"],
        })
        summary = analytics.get_summary(days=30)
        assert "period_days" in summary
        assert "conversion_rates" in summary
        assert "biggest_drop_off" in summary
        assert "critical_drop_offs" in summary
        assert "avg_time_to_complete" in summary

    def test_empty_summary(self, analytics: OnboardingAnalytics) -> None:
        summary = analytics.get_summary(days=30)
        assert summary["biggest_drop_off"] is None
