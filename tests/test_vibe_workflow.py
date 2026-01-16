"""
Tests for VIBE Workflow system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.vibe_workflow import VIBEWorkflow, WorkflowStep, TaskStatus

class TestVIBEWorkflow:

    def test_plan_detection(self, tmp_path):
        """Test finding a plan file."""
        plans_dir = tmp_path / "plans"
        plans_dir.mkdir()
        plan_file = plans_dir / "plan.md"
        plan_file.write_text("# Plan\n- [ ] Task 1", encoding="utf-8")

        wf = VIBEWorkflow(plans_dir=str(plans_dir))
        detected = wf.detect_plan()

        assert detected == plan_file
        assert wf.current_step == WorkflowStep.ANALYSIS

    def test_analyze_plan(self, tmp_path):
        """Test task extraction from plan."""
        plans_dir = tmp_path / "plans"
        plans_dir.mkdir()
        plan_file = plans_dir / "plan.md"
        plan_file.write_text("- [ ] Task 1\n- [x] Done Task", encoding="utf-8")

        wf = VIBEWorkflow(plans_dir=str(plans_dir))
        wf.detect_plan()
        tasks = wf.analyze_plan()

        assert len(tasks) == 2
        assert tasks[0].name == "Task 1"
        assert tasks[0].status == TaskStatus.PENDING
        assert tasks[1].status == TaskStatus.COMPLETED

    def test_task_management(self, tmp_path):
        """Test starting and completing tasks."""
        plans_dir = tmp_path / "plans"
        plans_dir.mkdir()
        plan_file = plans_dir / "plan.md"
        plan_file.write_text("- [ ] Task A", encoding="utf-8")

        wf = VIBEWorkflow(plans_dir=str(plans_dir))
        wf.detect_plan()
        wf.analyze_plan()

        task_id = wf.tasks[0].id
        wf.start_task(task_id)
        assert wf.tasks[0].status == TaskStatus.IN_PROGRESS

        wf.complete_task(task_id)
        assert wf.tasks[0].status == TaskStatus.COMPLETED

    def test_stats_aggregation(self, tmp_path):
        """Test telemetry extraction."""
        wf = VIBEWorkflow(plans_dir=str(tmp_path))
        stats = wf.get_stats()
        assert "current_step" in stats
        assert stats["tasks"]["total"] == 0

if __name__ == "__main__":
    pytest.main([__file__])
