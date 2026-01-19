"""
Tests for Agent Orchestrator system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.agent_orchestrator import AgentOrchestrator, StepStatus


class TestAgentOrchestrator:
    def test_run_valid_chain(self):
        """Test running a valid agent chain."""
        orchestrator = AgentOrchestrator(verbose=False)
        result = orchestrator.run("dev", "cook")

        assert result.success is True
        assert len(result.steps) > 0
        assert result.suite == "dev"
        assert result.subcommand == "cook"
        assert all(s.status == StepStatus.COMPLETED for s in result.steps)

    def test_run_invalid_chain(self):
        """Test behavior with non-existent chain."""
        orchestrator = AgentOrchestrator(verbose=False)
        result = orchestrator.run("invalid", "suite")

        assert result.success is False
        assert len(result.steps) == 0

    def test_orchestrator_stats(self):
        """Test statistics tracking."""
        orchestrator = AgentOrchestrator(verbose=False)
        orchestrator.run("dev", "cook")
        orchestrator.run("dev", "test")

        stats = orchestrator.get_stats()
        assert stats["total_runs"] == 2
        assert stats["success_rate"] == 100.0
        assert "planner" in stats["agent_usage"]


if __name__ == "__main__":
    pytest.main([__file__])
