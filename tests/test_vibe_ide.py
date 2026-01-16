"""
Tests for VIBE IDE Core system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.vibe_ide import VIBEIDE

class TestVIBEIDE:

    def test_create_plan(self, tmp_path):
        """Test plan generation and file creation."""
        ide = VIBEIDE(workspace=str(tmp_path))
        plan_file = ide.create_plan(
            title="Refactor Core",
            description="Clean up technical debt",
            priority="P1"
        )

        assert plan_file.exists()
        assert "Refactor Core" in plan_file.read_text()
        assert (plan_file.parent / "research").exists()
        assert ide.get_active_plan_path() == plan_file.absolute()

    def test_todo_management(self, tmp_path):
        """Test simple todo list operations."""
        ide = VIBEIDE(workspace=str(tmp_path))
        t = ide.add_todo("Write tests")

        assert len(ide.todos) == 1
        assert t.text == "Write tests"
        assert t.completed is False

        ide.complete_todo(t.id)
        assert t.completed is True

    def test_list_plans(self, tmp_path):
        """Test plan discovery and listing."""
        ide = VIBEIDE(workspace=str(tmp_path))
        ide.create_plan("P1", "D1")
        ide.create_plan("P2", "D2")

        plans = ide.list_plans()
        assert len(plans) == 2
        assert any(p["title"] == "P1" for p in plans)

if __name__ == "__main__":
    pytest.main([__file__])
