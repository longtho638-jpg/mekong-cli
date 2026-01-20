"""
🏯 Agent Orchestrator Analytics Logic
"""
from typing import Dict, List

from antigravity.core.types import OrchestratorStatsDict
from .models import ChainResult


class OrchestratorAnalytics:
    """Handles performance tracking and metrics aggregation."""

    def get_stats(self, history: List[ChainResult]) -> OrchestratorStatsDict:
        """Aggregates performance data from the current session."""
        total = len(history)
        successful = sum(1 for r in history if r.success)

        agent_usage: Dict[str, int] = {}
        for res in history:
            for step in res.steps:
                agent_usage[step.agent] = agent_usage.get(step.agent, 0) + 1

        return {
            "total_runs": total,
            "success_rate": (successful / total * 100) if total > 0 else 0,
            "agent_usage": agent_usage,
            "session_duration_ms": sum(r.total_duration_ms for r in history),
        }
