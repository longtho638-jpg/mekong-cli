"""
Tests for Agent Memory system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.agent_memory import AgentMemory

class TestAgentMemory:
    
    def test_remember_and_recall(self, tmp_path):
        """Test basic remember and recall functionality."""
        memory_sys = AgentMemory(storage_path=str(tmp_path))
        
        # Remember
        memory_sys.remember(
            agent="debugger",
            context={"file": "main.py", "error": "ImportError"},
            outcome="Fixed by adding import",
            success=True,
            patterns=["missing_import"]
        )
        
        # Recall
        results = memory_sys.recall("debugger")
        assert len(results) == 1
        assert results[0].agent == "debugger"
        assert results[0].success is True
        
        # Filter recall
        results = memory_sys.recall("debugger", query="main.py")
        assert len(results) == 1
        
        results = memory_sys.recall("debugger", query="other.py")
        assert len(results) == 0

    def test_pattern_learning(self, tmp_path):
        """Test pattern success rate tracking."""
        memory_sys = AgentMemory(storage_path=str(tmp_path))
        
        # Learn pattern twice
        memory_sys.learn_pattern("planner", "fast_track", success=True)
        memory_sys.learn_pattern("planner", "fast_track", success=False)
        
        patterns = memory_sys.get_patterns("planner")
        assert len(patterns) == 1
        assert patterns[0].pattern == "fast_track"
        assert patterns[0].success_rate == 0.5
        assert patterns[0].occurrences == 2

    def test_persistence(self, tmp_path):
        """Test memory saving and loading."""
        storage = str(tmp_path)
        m1 = AgentMemory(storage_path=storage)
        m1.remember("tester", {"test": "suite"}, "pass", True)
        
        # Load in new instance
        m2 = AgentMemory(storage_path=storage)
        assert len(m2.memories) == 1
        assert m2.memories[0].agent == "tester"

if __name__ == "__main__":
    pytest.main([__file__])
