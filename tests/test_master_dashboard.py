"""
Tests for Master Dashboard system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.dashboard import MasterDashboard


class TestMasterDashboard:
    def test_summary_aggregation(self):
        """Test that summary combines all layers."""
        dashboard = MasterDashboard()
        summary = dashboard.get_summary()

        # Check Layer structure
        assert "layers" in summary
        assert "agentic" in summary["layers"]
        assert "retention" in summary["layers"]
        assert "revenue" in summary["layers"]
        assert "infra" in summary["layers"]

        assert summary["layers"]["agentic"]["agents_active"] > 0
        assert "moat_strength" in summary["layers"]["retention"]

    def test_platform_score(self):
        """Test the composite platform score."""
        dashboard = MasterDashboard()
        score = dashboard.get_platform_score()

        assert 0 <= score <= 100
        # Should be reasonable starting point
        assert score > 10


if __name__ == "__main__":
    pytest.main([__file__])
