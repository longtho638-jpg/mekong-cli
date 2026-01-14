"""
Tests for Agent Chains configuration.
"""

import sys
import os
import pytest
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.agent_chains import (
    AGENT_INVENTORY, 
    AGENT_CHAINS, 
    get_chain, 
    get_chain_summary, 
    AgentCategory,
    AgentStep
)

class TestAgentChains:
    
    def test_inventory_structure(self):
        """Verify inventory has correct structure."""
        for name, info in AGENT_INVENTORY.items():
            assert "category" in info
            assert "file" in info
            assert isinstance(info["category"], AgentCategory)
            assert info["file"].startswith(".claude/agents/")

    def test_chains_structure(self):
        """Verify chains are valid."""
        for key, steps in AGENT_CHAINS.items():
            assert ":" in key
            assert isinstance(steps, list)
            for step in steps:
                assert isinstance(step, AgentStep)
                # Verify agent exists in inventory
                assert step.agent in AGENT_INVENTORY
                
    def test_get_chain(self):
        """Test get_chain retrieval."""
        chain = get_chain("dev", "cook")
        assert len(chain) > 0
        assert chain[0].agent == "planner"
        
        # Test non-existent
        assert get_chain("invalid", "command") == []

    def test_get_chain_summary(self):
        """Test summary formatting."""
        summary = get_chain_summary("dev", "cook")
        assert "🔗 Chain: /dev:cook" in summary
        assert "1. planner" in summary

if __name__ == "__main__":
    pytest.main([__file__])
