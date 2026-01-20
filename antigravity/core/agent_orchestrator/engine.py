"""
Agent Orchestrator Engine (Facade)
==================================

The central execution engine for Agency OS. It maps commands to optimal
specialized agents, manages their execution state, and tracks performance metrics.
"""

import logging
from antigravity.core.agent_chains import get_chain
from antigravity.core.mixins import StatsMixin
from antigravity.core.types import HookContextDict, OrchestratorStatsDict
from datetime import datetime
from typing import Dict, List, Optional

from .analytics import OrchestratorAnalytics
from .models import ChainResult, StepStatus
from .reporting import OrchestratorReporting
from .delegator import OrchestratorDelegator
from .monitor import OrchestratorMonitor

# Configure logging
logger = logging.getLogger(__name__)

class AgentOrchestrator(StatsMixin):
    """
    Agent Orchestrator

    The master conductor of AI workflows.
    It ensures that complex tasks are broken down and handled by the best agents.
    """

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.history: List[ChainResult] = []

        # Sub-components
        self.reporting = OrchestratorReporting()
        self.analytics = OrchestratorAnalytics()
        self.delegator = OrchestratorDelegator(verbose=verbose, reporting=self.reporting)
        self.monitor = OrchestratorMonitor(analytics=self.analytics)

    def run(
        self, suite: str, subcommand: str, context: Optional[HookContextDict] = None
    ) -> ChainResult:
        """
        Executes the optimized agent chain for a specific command suite.
        """
        chain = get_chain(suite, subcommand)

        if not chain:
            logger.warning(f"No execution chain defined for {suite}:{subcommand}")
            result = self._empty_result(suite, subcommand)
            self.history.append(result)
            return result

        result = ChainResult(suite=suite, subcommand=subcommand, started_at=datetime.now())

        if self.verbose:
            self.reporting.print_header(suite, subcommand, len(chain))

        for i, step in enumerate(chain, 1):
            step_res = self.delegator.execute_step(step, i, len(chain), context)
            result.steps.append(step_res)

            # Critical Path Logic: Stop on failure unless step is optional
            if step_res.status == StepStatus.FAILED and not step.optional:
                logger.error(f"Chain halted due to failure in critical step: {step.agent}")
                break

        result.completed_at = datetime.now()
        result.total_duration_ms = (result.completed_at - result.started_at).total_seconds() * 1000
        result.success = self.monitor.check_chain_success(result.steps)

        self.history.append(result)

        if self.verbose:
            self.reporting.print_summary(result)

        return result

    def _empty_result(self, suite: str, subcommand: str) -> ChainResult:
        """Fallback result for missing configurations."""
        return ChainResult(
            suite=suite, subcommand=subcommand, success=False, started_at=datetime.now()
        )

    def _collect_stats(self) -> OrchestratorStatsDict:
        """Aggregates performance data from the current session."""
        return self.monitor.get_session_stats(self.history)

# Quick Access Function
def execute_chain(suite: str, subcommand: str, context: Optional[Dict] = None) -> ChainResult:
    """Convenience wrapper for one-off chain execution."""
    orchestrator = AgentOrchestrator()
    return orchestrator.run(suite, subcommand, context)
