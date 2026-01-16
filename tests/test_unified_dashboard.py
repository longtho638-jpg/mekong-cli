"""
Tests for Unified Dashboard.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.unified_dashboard import AgenticDashboard

class TestUnifiedDashboard:

    def test_get_stats(self):
        """Test aggregation of statistics."""
        dashboard = AgenticDashboard()
        stats = dashboard.get_stats()

        assert "inventory" in stats
        assert "ip" in stats
        assert "cognition" in stats
        assert stats["inventory"]["agents"] > 0
        assert "success_rate" in stats["cognition"]

    def test_integration_score(self):
        """Test score calculation logic."""
        dashboard = AgenticDashboard()
        stats = dashboard.get_stats()
        score = dashboard._calculate_integration_score(stats)

        assert 0 <= score <= 100
        # Given current state, score should be quite high
        assert score >= 30 # Adjusted threshold for new formula

if __name__ == "__main__":
    pytest.main([__file__])
