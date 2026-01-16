"""
Tests for Telemetry system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.telemetry import Telemetry

class TestTelemetry:
    
    def test_track_event(self, tmp_path):
        """Test event tracking and storage."""
        tel = Telemetry(storage_path=str(tmp_path))
        tel.track("command", "/cook", duration_ms=500)
        
        assert len(tel.events) == 1
        assert tel.events[0].category == "command"
        assert tel.events[0].duration_ms == 500

    def test_usage_stats(self, tmp_path):
        """Test statistical aggregation."""
        tel = Telemetry(storage_path=str(tmp_path))
        tel.track("agent", "planner")
        tel.track("agent", "planner")
        tel.track("agent", "coder")
        
        stats = tel.get_summary()
        assert stats["volume"]["total_events"] == 3
        assert stats["top_categories"]["agent"] == 3
        assert stats["top_actions"]["planner"] == 2

    def test_persistence(self, tmp_path):
        """Test event persistence."""
        storage = str(tmp_path)
        t1 = Telemetry(storage_path=storage)
        t1.track("sys", "init")
        
        t2 = Telemetry(storage_path=storage)
        assert len(t2.events) == 1
        assert t2.events[0].action == "init"

if __name__ == "__main__":
    pytest.main([__file__])
