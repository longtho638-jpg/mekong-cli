"""
Tests for Agent Crews system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.agent_crews import (
    CREWS,
    get_crew,
    run_crew,
    CrewStatus,
    get_crew_summary
)

class TestAgentCrews:
    
    def test_crew_definitions(self):
        """Verify crew definitions are valid."""
        assert "product_launch" in CREWS
        assert "revenue_accelerator" in CREWS
        
        for name, crew in CREWS.items():
            assert crew.lead is not None
            assert len(crew.workers) > 0
            assert crew.qa is not None

    def test_get_crew(self):
        """Test crew retrieval."""
        crew = get_crew("product_launch")
        assert crew.name == "Product Launch Crew"
        
        assert get_crew("non_existent") is None

    def test_get_crew_summary(self):
        """Test summary formatting."""
        summary = get_crew_summary("product_launch")
        assert "CREW: Product Launch Crew" in summary
        assert "Lead    : ⭐ project-manager" in summary

    def test_run_crew_simulation(self):
        """Test simulation of crew run."""
        result = run_crew("product_launch")
        assert result.status == CrewStatus.COMPLETED
        assert result.steps_completed == result.total_steps
        assert result.error is None

if __name__ == "__main__":
    pytest.main([__file__])
