"""Tests for Mekong Reflection Engine (AGI v2)."""

import unittest

from src.core.reflection import (
    ConfidenceCalibrator,
    ReflectionEngine,
    ReflectionReport,
)


class TestReflectionReport(unittest.TestCase):
    """Tests for ReflectionReport dataclass."""

    def test_default_values(self):
        r = ReflectionReport(goal="test", status="success")
        self.assertEqual(r.goal, "test")
        self.assertEqual(r.status, "success")
        self.assertEqual(r.strengths, [])
        self.assertEqual(r.weaknesses, [])
        self.assertEqual(r.confidence_adjustment, 0.0)
        self.assertFalse(r.should_change_strategy)

    def test_fields_settable(self):
        r = ReflectionReport(
            goal="deploy",
            status="failed",
            strengths=["fast"],
            weaknesses=["crash"],
            should_change_strategy=True,
        )
        self.assertEqual(r.weaknesses, ["crash"])
        self.assertTrue(r.should_change_strategy)


class TestConfidenceCalibrator(unittest.TestCase):
    """Tests for ConfidenceCalibrator."""

    def test_empty_calibration(self):
        cal = ConfidenceCalibrator()
        self.assertEqual(cal.get_calibration_error(), 0.5)
        self.assertEqual(cal.prediction_count, 0)

    def test_record_predictions(self):
        cal = ConfidenceCalibrator()
        cal.record(0.9, True)
        cal.record(0.8, True)
        cal.record(0.7, False)
        self.assertEqual(cal.prediction_count, 3)

    def test_perfect_calibration(self):
        cal = ConfidenceCalibrator()
        for _ in range(10):
            cal.record(0.9, True)
        error = cal.get_calibration_error()
        self.assertLess(error, 0.2)

    def test_overconfident_adjustment(self):
        """Overconfident system should have confidence reduced."""
        cal = ConfidenceCalibrator()
        for _ in range(15):
            cal.record(0.95, False)  # Always predicts high, always fails
        adjusted = cal.get_adjusted_confidence(0.9)
        self.assertLess(adjusted, 0.9)

    def test_underconfident_adjustment(self):
        """Underconfident system should have confidence increased."""
        cal = ConfidenceCalibrator()
        for _ in range(15):
            cal.record(0.2, True)  # Always predicts low, always succeeds
        adjusted = cal.get_adjusted_confidence(0.3)
        self.assertGreater(adjusted, 0.3)

    def test_max_history(self):
        cal = ConfidenceCalibrator()
        for i in range(150):
            cal.record(0.5, i % 2 == 0)
        self.assertEqual(cal.prediction_count, 100)


class TestReflectionEngine(unittest.TestCase):
    """Tests for ReflectionEngine."""

    def test_reflect_success(self):
        engine = ReflectionEngine()
        report = engine.reflect("deploy app", "success", duration_ms=1000)
        self.assertEqual(report.goal, "deploy app")
        self.assertEqual(report.status, "success")
        self.assertGreater(report.confidence_adjustment, 0)
        self.assertTrue(any("successfully" in s for s in report.strengths))

    def test_reflect_failure(self):
        engine = ReflectionEngine()
        report = engine.reflect("deploy app", "failed", error="timeout")
        self.assertLess(report.confidence_adjustment, 0)
        self.assertTrue(any("failed" in w.lower() for w in report.weaknesses))

    def test_repeated_failure_triggers_strategy_change(self):
        engine = ReflectionEngine()
        engine.reflect("deploy app", "failed")
        engine.reflect("deploy app", "failed")
        report = engine.reflect("deploy app", "failed")
        self.assertTrue(report.should_change_strategy)

    def test_strategy_suggestion_no_history(self):
        engine = ReflectionEngine()
        suggestion = engine.get_strategy_suggestion("new goal")
        self.assertIn("No prior data", suggestion)

    def test_strategy_suggestion_with_failures(self):
        engine = ReflectionEngine()
        for _ in range(5):
            engine.reflect("deploy app", "failed")
        suggestion = engine.get_strategy_suggestion("deploy app")
        self.assertTrue(len(suggestion) > 0)

    def test_get_recent(self):
        engine = ReflectionEngine()
        engine.reflect("a", "success")
        engine.reflect("b", "failed")
        recent = engine.get_recent(5)
        self.assertEqual(len(recent), 2)

    def test_get_stats(self):
        engine = ReflectionEngine()
        engine.reflect("a", "success")
        engine.reflect("b", "failed")
        stats = engine.get_stats()
        self.assertEqual(stats["total_reflections"], 2)
        self.assertIn("calibration_error", stats)
        self.assertIn("strategy_changes_suggested", stats)

    def test_stats_empty(self):
        engine = ReflectionEngine()
        stats = engine.get_stats()
        self.assertEqual(stats["total_reflections"], 0)

    def test_max_reflections_cap(self):
        engine = ReflectionEngine()
        engine.MAX_REFLECTIONS = 10
        for i in range(20):
            engine.reflect(f"goal-{i}", "success")
        self.assertLessEqual(len(engine._reflections), 10)

    def test_confidence_clamping(self):
        engine = ReflectionEngine()
        report = engine.reflect("x", "success")
        self.assertGreaterEqual(report.confidence_adjustment, -1.0)
        self.assertLessEqual(report.confidence_adjustment, 1.0)


if __name__ == "__main__":
    unittest.main()
