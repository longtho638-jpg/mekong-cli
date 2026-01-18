"""
Tests for Jules Runner system.
"""

import os
import sys
from unittest.mock import patch

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.jules_runner import JULES_MISSIONS, trigger_jules_mission


class TestJulesRunner:
    def test_task_registry(self):
        """Verify standard tasks are registered."""
        assert "tests" in JULES_MISSIONS
        assert "lint" in JULES_MISSIONS
        assert "docs" in JULES_MISSIONS

    @patch("antigravity.core.jules_runner.subprocess.run")
    def test_run_task_dry(self, mock_run):
        """Test dry run mode."""
        success = trigger_jules_mission("tests", dry_run=True)
        assert success is True
        # subprocess should NOT be called in dry run
        mock_run.assert_not_called()

    def test_invalid_task(self):
        """Test behavior with non-existent task."""
        success = trigger_jules_mission("make_coffee")
        assert success is False


if __name__ == "__main__":
    pytest.main([__file__])
