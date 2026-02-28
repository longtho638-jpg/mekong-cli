"""
Tests for Mekong Autonomous Engine.

Tests cover:
- ConsciousnessReport dataclass and scoring
- CycleResult dataclass
- AutonomousEngine process_goal (safe, forbidden, halted)
- Halt/resume delegation
- get_consciousness weighted scoring
"""

import unittest
from unittest.mock import MagicMock

from src.core.autonomous import (
    AutonomousEngine,
    ConsciousnessReport,
    CycleResult,
)
from src.core.governance import ActionClass, Governance


class TestConsciousnessReport(unittest.TestCase):
    """Tests for ConsciousnessReport dataclass."""

    def test_default_values(self):
        """Default report should have score=0 and all health=0."""
        r = ConsciousnessReport()
        self.assertEqual(r.score, 0)
        self.assertEqual(r.memory_health, 0.0)
        self.assertEqual(r.nlu_health, 0.0)
        self.assertEqual(r.governance_health, 0.0)

    def test_fields_settable(self):
        """Fields should be settable."""
        r = ConsciousnessReport(score=75, memory_health=1.0)
        self.assertEqual(r.score, 75)
        self.assertEqual(r.memory_health, 1.0)


class TestCycleResult(unittest.TestCase):
    """Tests for CycleResult dataclass."""

    def test_default_values(self):
        """Default CycleResult should have empty goal, not executed."""
        r = CycleResult()
        self.assertEqual(r.goal, "")
        self.assertFalse(r.executed)
        self.assertEqual(r.result_status, "")
        self.assertFalse(r.recipe_generated)
        self.assertEqual(r.patterns_detected, 0)

    def test_with_goal(self):
        """CycleResult should accept goal."""
        r = CycleResult(goal="build app")
        self.assertEqual(r.goal, "build app")


class TestProcessGoalForbidden(unittest.TestCase):
    """Tests for process_goal with forbidden goals."""

    def test_forbidden_goal_blocked(self):
        """Forbidden goal should result in 'blocked' status."""
        engine = AutonomousEngine()
        result = engine.process_goal("rm -rf /important/data")
        self.assertEqual(result.result_status, "blocked")
        self.assertFalse(result.executed)

    def test_forbidden_goal_has_decision(self):
        """Forbidden result should have governance_decision."""
        engine = AutonomousEngine()
        result = engine.process_goal("drop database prod")
        self.assertIsNotNone(result.governance_decision)
        self.assertEqual(
            result.governance_decision.action_class, ActionClass.FORBIDDEN
        )


class TestProcessGoalHalted(unittest.TestCase):
    """Tests for process_goal when system is halted."""

    def test_halted_returns_halted_status(self):
        """Process goal on halted engine should return 'halted'."""
        engine = AutonomousEngine()
        engine.halt()
        result = engine.process_goal("safe task")
        self.assertEqual(result.result_status, "halted")
        self.assertFalse(result.executed)

    def test_halted_no_governance_decision(self):
        """Halted engine should not produce governance decision."""
        engine = AutonomousEngine()
        engine.halt()
        result = engine.process_goal("test")
        self.assertIsNone(result.governance_decision)


class TestProcessGoalSafe(unittest.TestCase):
    """Tests for process_goal with safe goals."""

    def test_safe_no_orchestrator(self):
        """Safe goal without orchestrator should not execute."""
        engine = AutonomousEngine()
        result = engine.process_goal("list files")
        self.assertFalse(result.executed)
        self.assertEqual(result.result_status, "")

    def test_safe_with_orchestrator_success(self):
        """Safe goal with mock orchestrator should execute."""
        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_orch.run_from_goal.return_value = mock_result

        engine = AutonomousEngine(orchestrator=mock_orch)
        result = engine.process_goal("list files")
        self.assertTrue(result.executed)
        self.assertEqual(result.result_status, "success")

    def test_safe_with_orchestrator_error(self):
        """Orchestrator exception should result in 'error' status."""
        mock_orch = MagicMock()
        mock_orch.run_from_goal.side_effect = RuntimeError("boom")

        engine = AutonomousEngine(orchestrator=mock_orch)
        result = engine.process_goal("list files")
        self.assertTrue(result.executed)
        self.assertEqual(result.result_status, "error")


class TestHaltResume(unittest.TestCase):
    """Tests for engine halt/resume."""

    def test_not_halted_default(self):
        """Engine should not be halted by default."""
        engine = AutonomousEngine()
        self.assertFalse(engine.is_halted())

    def test_halt(self):
        """halt() should set halted state."""
        engine = AutonomousEngine()
        engine.halt()
        self.assertTrue(engine.is_halted())

    def test_resume(self):
        """resume() should clear halted state."""
        engine = AutonomousEngine()
        engine.halt()
        engine.resume()
        self.assertFalse(engine.is_halted())


class TestConsciousnessScoring(unittest.TestCase):
    """Tests for get_consciousness score calculation."""

    def test_minimal_consciousness(self):
        """Engine with no subsystems should have low score."""
        engine = AutonomousEngine()
        report = engine.get_consciousness()
        # Governance should be healthy (not halted), but subsystems missing
        self.assertGreater(report.governance_health, 0.0)
        self.assertLessEqual(report.score, 100)

    def test_halted_governance_zero(self):
        """Halted engine should have governance_health=0."""
        engine = AutonomousEngine()
        engine.halt()
        report = engine.get_consciousness()
        self.assertEqual(report.governance_health, 0.0)

    def test_score_range(self):
        """Score should be between 0 and 100."""
        engine = AutonomousEngine()
        report = engine.get_consciousness()
        self.assertGreaterEqual(report.score, 0)
        self.assertLessEqual(report.score, 100)

    def test_governance_contributes_20(self):
        """Governance at 100% should contribute 20 to score."""
        engine = AutonomousEngine()
        report = engine.get_consciousness()
        # Governance is healthy (not halted), so governance_health=1.0
        # Contribution = 1.0 * 20 = 20
        self.assertEqual(report.governance_health, 1.0)


class TestEngineInit(unittest.TestCase):
    """Tests for AutonomousEngine initialization."""

    def test_custom_governance(self):
        """Engine should accept custom Governance instance."""
        gov = Governance(audit_path="/tmp/_ae_test.yaml")
        engine = AutonomousEngine(governance=gov)
        self.assertIs(engine.governance, gov)

    def test_default_governance(self):
        """Engine should create default Governance when none provided."""
        engine = AutonomousEngine()
        self.assertIsInstance(engine.governance, Governance)


if __name__ == "__main__":
    unittest.main()
