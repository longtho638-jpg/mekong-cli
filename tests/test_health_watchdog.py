"""Tests for Health Watchdog Engine (Netdata-inspired cascading quality gates)."""

import pytest
from src.core.health_watchdog import (
    AlertSeverity,
    AlertState,
    HealthCheck,
    HealthWatchdog,
    WatchdogReport,
    check_error_count,
    check_step_duration,
    check_success_rate,
    create_default_watchdog,
)


class TestHealthCheck:
    """Test HealthCheck evaluation with hysteresis."""

    def test_clear_when_below_warning(self):
        check = HealthCheck(name="test", description="t", check_fn=lambda _: 0,
                            warning_threshold=80, critical_threshold=95)
        assert check.evaluate(50.0, AlertSeverity.CLEAR) == AlertSeverity.CLEAR

    def test_warning_when_above_threshold(self):
        check = HealthCheck(name="test", description="t", check_fn=lambda _: 0,
                            warning_threshold=80, critical_threshold=95)
        assert check.evaluate(85.0, AlertSeverity.CLEAR) == AlertSeverity.WARNING

    def test_critical_when_above_critical(self):
        check = HealthCheck(name="test", description="t", check_fn=lambda _: 0,
                            warning_threshold=80, critical_threshold=95)
        assert check.evaluate(96.0, AlertSeverity.CLEAR) == AlertSeverity.CRITICAL

    def test_hysteresis_prevents_flapping(self):
        """Warning stays active if value only dips slightly below threshold."""
        check = HealthCheck(name="test", description="t", check_fn=lambda _: 0,
                            warning_threshold=80, critical_threshold=95, hysteresis=5.0)
        # Value at 77 (below 80 but above 80-5=75) — should stay WARNING
        assert check.evaluate(77.0, AlertSeverity.WARNING) == AlertSeverity.WARNING
        # Value at 70 (below 75) — should clear
        assert check.evaluate(70.0, AlertSeverity.WARNING) == AlertSeverity.CLEAR

    def test_critical_hysteresis(self):
        check = HealthCheck(name="test", description="t", check_fn=lambda _: 0,
                            warning_threshold=80, critical_threshold=95, hysteresis=5.0)
        # Value at 92 (below 95 but above 90) — should stay CRITICAL
        assert check.evaluate(92.0, AlertSeverity.CRITICAL) == AlertSeverity.CRITICAL
        # Value at 88 — should drop to WARNING (above 80)
        assert check.evaluate(88.0, AlertSeverity.CLEAR) == AlertSeverity.WARNING


class TestHealthWatchdog:
    """Test HealthWatchdog evaluation cycle."""

    def test_register_and_list(self):
        wd = HealthWatchdog()
        check = HealthCheck(name="cpu", description="CPU usage", check_fn=lambda _: 50.0)
        wd.register(check)
        assert "cpu" in wd.list_checks()

    def test_unregister(self):
        wd = HealthWatchdog()
        check = HealthCheck(name="cpu", description="CPU", check_fn=lambda _: 0)
        wd.register(check)
        assert wd.unregister("cpu") is True
        assert wd.unregister("nonexistent") is False

    def test_evaluate_all_clear(self):
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="low", description="Low metric",
                                check_fn=lambda _: 10.0))
        report = wd.evaluate()
        assert report.healthy is True
        assert report.total_checks == 1
        assert report.warnings == 0
        assert report.criticals == 0

    def test_evaluate_with_warning(self):
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="high", description="High metric",
                                check_fn=lambda _: 85.0,
                                warning_threshold=80, critical_threshold=95))
        report = wd.evaluate()
        assert report.healthy is False
        assert report.warnings == 1

    def test_evaluate_with_critical(self):
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="crit", description="Critical metric",
                                check_fn=lambda _: 99.0,
                                warning_threshold=80, critical_threshold=95))
        report = wd.evaluate()
        assert report.criticals == 1

    def test_evaluate_error_treated_as_critical(self):
        def bad_check(_):
            raise RuntimeError("check failed")
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="error", description="Error check",
                                check_fn=bad_check))
        report = wd.evaluate()
        assert report.criticals == 1

    def test_state_tracking(self):
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="s", description="t", check_fn=lambda _: 85.0,
                                warning_threshold=80))
        wd.evaluate()
        state = wd.get_state("s")
        assert state is not None
        assert state.severity == AlertSeverity.WARNING

    def test_transition_count(self):
        counter = {"val": 50.0}
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="t", description="t",
                                check_fn=lambda _: counter["val"],
                                warning_threshold=80, hysteresis=0))
        wd.evaluate()  # CLEAR
        counter["val"] = 85.0
        wd.evaluate()  # WARNING (transition)
        state = wd.get_state("t")
        assert state is not None
        assert state.transitions == 1

    def test_clear_resets(self):
        wd = HealthWatchdog()
        wd.register(HealthCheck(name="x", description="x", check_fn=lambda _: 0))
        wd.evaluate()
        wd.clear()
        assert wd.list_checks() == []


class TestBuiltInChecks:
    """Test built-in quality gate check functions."""

    def test_success_rate_all_pass(self):
        ctx = {"total_steps": 10, "failed_steps": 0}
        assert check_success_rate(ctx) == 0.0

    def test_success_rate_half_fail(self):
        ctx = {"total_steps": 10, "failed_steps": 5}
        assert check_success_rate(ctx) == 50.0

    def test_success_rate_zero_total(self):
        assert check_success_rate({"total_steps": 0, "failed_steps": 0}) == 0.0

    def test_step_duration_within_budget(self):
        ctx = {"duration_seconds": 30.0, "duration_budget": 60.0}
        assert check_step_duration(ctx) == 50.0

    def test_step_duration_over_budget(self):
        ctx = {"duration_seconds": 120.0, "duration_budget": 60.0}
        assert check_step_duration(ctx) == 100.0  # Capped

    def test_error_count_none(self):
        assert check_error_count({"error_count": 0, "max_errors": 5}) == 0.0

    def test_error_count_at_max(self):
        assert check_error_count({"error_count": 5, "max_errors": 5}) == 100.0


class TestDefaultWatchdog:
    """Test create_default_watchdog factory."""

    def test_creates_three_checks(self):
        wd = create_default_watchdog()
        assert len(wd.list_checks()) == 3

    def test_evaluates_clean_context(self):
        wd = create_default_watchdog()
        ctx = {"total_steps": 10, "failed_steps": 0,
               "duration_seconds": 10, "duration_budget": 60,
               "error_count": 0, "max_errors": 5}
        report = wd.evaluate(ctx)
        assert report.healthy is True
