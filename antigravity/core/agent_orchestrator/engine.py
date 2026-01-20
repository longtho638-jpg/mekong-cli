"""
🏯 Agent Orchestrator Engine
===========================

The central execution engine for Agency OS. It maps commands to optimal
specialized agents, manages their execution state, and tracks performance metrics.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from antigravity.core.agent_chains import get_chain
from antigravity.core.chains import AgentStep
from .models import ChainResult, StepResult, StepStatus

# Configure logging
logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    🏯 Agent Orchestrator

    The master conductor of AI workflows.
    It ensures that complex tasks are broken down and handled by the best agents.
    """

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.history: List[ChainResult] = []

    def run(
        self, suite: str, subcommand: str, context: Optional[Dict[str, Any]] = None
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
            self._print_header(suite, subcommand, len(chain.agents))

        for i, step in enumerate(chain.agents, 1):
            step_res = self._execute_step(step, i, len(chain.agents), context)
            result.steps.append(step_res)

            # Critical Path Logic: Stop on failure unless step is optional
            if step_res.status == StepStatus.FAILED and not step.optional:
                logger.error(f"Chain halted due to failure in critical step: {step.agent}")
                break

        result.completed_at = datetime.now()
        result.total_duration_ms = (result.completed_at - result.started_at).total_seconds() * 1000

        # Chain success = all non-optional steps completed
        result.success = all(
            r.status in [StepStatus.COMPLETED, StepStatus.SKIPPED] for r in result.steps
        )

        self.history.append(result)

        if self.verbose:
            self._print_summary(result)

        return result

    def _execute_step(
        self, step: AgentStep, index: int, total: int, context: Optional[Dict[str, Any]]
    ) -> StepResult:
        """Invokes an individual agent and captures the result."""
        start_time = time.time()

        if self.verbose:
            print(f"   [{index}/{total}] 🤖 {step.agent:<20} | {step.description}...")

        try:
            # INTERFACE POINT: Real agent invocation would happen here.
            # For this prototype, we simulate a successful execution.
            time.sleep(0.01)  # Simulated network/processing latency

            output = f"Simulated output for {step.action}"
            status = StepStatus.COMPLETED
            error = None

        except Exception as e:
            logger.exception(f"Agent {step.agent} failed during {step.action}")
            output = None
            status = StepStatus.FAILED
            error = str(e)

        duration = (time.time() - start_time) * 1000

        if self.verbose and status == StepStatus.COMPLETED:
            print(f"   ✓ Success ({duration:.0f}ms)")

        return StepResult(
            agent=step.agent,
            action=step.action,
            status=status,
            output=output,
            duration_ms=duration,
            error=error,
        )

    def _print_header(self, suite: str, subcommand: str, steps: int):
        """Standard visual header for CLI execution."""
        print(f"\n🚀 ORCHESTRATING: /{suite}:{subcommand}")
        print("═" * 60)
        print(f"   Deployment: {steps} specialized agents active")
        print("─" * 60)

    def _print_summary(self, result: ChainResult):
        """Standard visual summary for CLI completion."""
        print("─" * 60)
        icon = "✅" if result.success else "❌"
        status_text = "MISSION COMPLETE" if result.success else "MISSION FAILED"
        print(f"   {icon} {status_text} | Total Time: {result.total_duration_ms:.0f}ms")
        print("═" * 60)

    def _empty_result(self, suite: str, subcommand: str) -> ChainResult:
        """Fallback result for missing configurations."""
        return ChainResult(
            suite=suite, subcommand=subcommand, success=False, started_at=datetime.now()
        )

    def get_stats(self) -> Dict[str, Any]:
        """Aggregates performance data from the current session."""
        total = len(self.history)
        successful = sum(1 for r in self.history if r.success)

        agent_usage: Dict[str, int] = {}
        for res in self.history:
            for step in res.steps:
                agent_usage[step.agent] = agent_usage.get(step.agent, 0) + 1

        return {
            "total_runs": total,
            "success_rate": (successful / total * 100) if total > 0 else 0,
            "agent_usage": agent_usage,
            "session_duration_ms": sum(r.total_duration_ms for r in self.history),
        }


# Quick Access Function
def execute_chain(suite: str, subcommand: str, context: Optional[Dict] = None) -> ChainResult:
    """Convenience wrapper for one-off chain execution."""
    orchestrator = AgentOrchestrator()
    return orchestrator.run(suite, subcommand, context)
