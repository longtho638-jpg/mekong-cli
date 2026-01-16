"""
Tests for Autonomous Mode system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.autonomous_mode import AutonomousOrchestrator, AutonomousStatus

class TestAutonomousOrchestrator:

    def test_set_goal_and_planning(self):
        """Test goal analysis and plan creation."""
        auto = AutonomousOrchestrator(verbose=False)
        auto.set_goal("Launch a new product")

        assert auto.goal == "Launch a new product"
        assert auto.plan is not None
        assert len(auto.plan.tasks) > 0
        # Should have strategy crew for product goals
        assert any(t.crew == "strategy" for t in auto.plan.tasks)

    def test_execute_simulation(self):
        """Test simulation of autonomous execution."""
        auto = AutonomousOrchestrator(verbose=False)
        auto.set_goal("Fix bugs")

        success = auto.execute()
        assert success is True
        assert auto.status == AutonomousStatus.COMPLETED
        assert all(t.status == "completed" for t in auto.plan.tasks)

    def test_status_tracking(self):
        """Test status dashboard data."""
        auto = AutonomousOrchestrator(verbose=False)
        auto.set_goal("Build feature")

        report = auto.get_mission_report()
        assert report["mission"]["goal"] == "Build feature"
        assert report["mission"]["phases_total"] > 0

if __name__ == "__main__":
    pytest.main([__file__])
