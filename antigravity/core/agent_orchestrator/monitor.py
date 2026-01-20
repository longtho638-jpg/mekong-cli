"""
Orchestrator Monitor - Logic for tracking execution state
"""
from antigravity.core.types import OrchestratorStatsDict
from typing import List

from .models import ChainResult, StepStatus


class OrchestratorMonitor:
    """Tracks the progress and health of orchestrator chains."""

    def __init__(self, analytics):
        self.analytics = analytics

    def check_chain_success(self, steps) -> bool:
        """Chain success = all non-optional steps completed."""
        return all(
            r.status in [StepStatus.COMPLETED, StepStatus.SKIPPED] for r in steps
        )

    def get_session_stats(self, history: List[ChainResult]) -> OrchestratorStatsDict:
        """Aggregates performance data from the current session."""
        return self.analytics.get_stats(history)
