"""
Agent Orchestrator Engine (Facade)
==================================

The central execution engine for Agency OS. It maps commands to optimal
specialized agents, manages their execution state, and tracks performance metrics.
"""

import logging
from antigravity.core.agent_chains import get_chain, get_chain_obj
from antigravity.core.algorithm.validation import validate_win3_logic
from antigravity.core.chains import Chain
from antigravity.core.mixins import StatsMixin
from antigravity.core.telemetry import agent_telemetry
from antigravity.core.types import HookContextDict, OrchestratorStatsDict
from datetime import datetime
from typing import Any, Dict, List, Optional

from .analytics import OrchestratorAnalytics
from .delegator import OrchestratorDelegator
from .models import ChainResult, StepStatus
from .monitor import OrchestratorMonitor
from .reporting import OrchestratorReporting

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

    @agent_telemetry(operation="orchestrator_run")
    def run(
        self, suite: str, subcommand: str, context: Optional[HookContextDict] = None
    ) -> ChainResult:
        """
        Executes the optimized agent chain for a specific command suite.
        Includes a mandatory WIN-WIN-WIN validation gate for all suites.
        """
        # 1. Strategic Gate: WIN-WIN-WIN Validation
        context = context or {}

        # In non-revenue suites, we use defaults if not provided, but the gate MUST pass.
        anh_win = context.get("anh_win")
        agency_win = context.get("agency_win")
        startup_win = context.get("startup_win")

        # Heuristic: If it's a dev/ops/docs suite, we auto-fill intent if missing to reduce friction
        if suite not in ["revenue", "strategy", "crm"]:
            if anh_win is None:
                anh_win = f"Operational efficiency for {suite}"
            if agency_win is None:
                agency_win = f"Infrastructure improved via {subcommand}"
            if startup_win is None:
                startup_win = "Faster delivery/higher quality for client"

        win_check = validate_win3_logic(
            action=f"{suite}:{subcommand}",
            anh_win=anh_win,
            agency_win=agency_win,
            startup_win=startup_win
        )

        if not win_check.is_valid:
            logger.error(f"Execution blocked by WIN-WIN-WIN Gate: {', '.join(win_check.violations)}")
            result = self._empty_result(suite, subcommand)
            result.success = False
            result.output = f"BLOCKED: {win_check.violations[0]}"
            self.history.append(result)
            return result

        # 2. Chain Execution
        chain_obj = get_chain_obj(suite, subcommand)
        if not chain_obj:
            logger.warning(f"No execution chain defined for {suite}:{subcommand}")
            result = self._empty_result(suite, subcommand)
            self.history.append(result)
            return result

        chain = chain_obj.agents
        result = ChainResult(suite=suite, subcommand=subcommand, started_at=datetime.now())

        if self.verbose:
            self.reporting.print_header(suite, subcommand, len(chain))

        # Graph-based Execution Loop
        step_map = {step.id: step for step in chain if step.id}
        current_index = 0

        while current_index < len(chain):
            step = chain[current_index]

            # Skip if already executed in a loop unless we want to allow it (let's allow for now)
            # executed_steps.add(id(step))

            # Handle Condition
            if step.condition:
                if not self._evaluate_condition(step.condition, context):
                    logger.info(f"⏭️ Skipping step {step.id or current_index} due to condition: {step.condition}")
                    current_index += 1
                    continue

            # Handle Parallel execution
            if step.parallel:
                step_res = self.delegator.execute_parallel(step.parallel, current_index + 1, len(chain), context)
            else:
                step_res = self.delegator.execute_step(step, current_index + 1, len(chain), context)

            result.steps.append(step_res)

            # Critical Path Logic
            if step_res.status == StepStatus.FAILED and not step.optional:
                logger.error(f"Chain halted due to failure in critical step: {step.agent or 'parallel group'}")
                break

            # Handle Jumps (goto/next_step)
            if step.next_step and step.next_step in step_map:
                # Find index of next step
                target_step = step_map[step.next_step]
                current_index = chain.index(target_step)
                logger.info(f"↩️ Jumping to step ID: {step.next_step}")
            else:
                current_index += 1

        result.completed_at = datetime.now()
        result.total_duration_ms = (result.completed_at - result.started_at).total_seconds() * 1000
        result.success = self.monitor.check_chain_success(result.steps)

        self.history.append(result)

        if self.verbose:
            self.reporting.print_summary(result)

        return result

    def _evaluate_condition(self, condition: str, context: Optional[HookContextDict]) -> bool:
        """
        Evaluates a condition string against the blackboard and context.
        Simple evaluation: checks for presence of a key or simple comparison.
        """
        from antigravity.core.agent_memory.blackboard import blackboard

        # Merge context and blackboard for evaluation
        # Type safety: blackboard.get_namespace returns a dict
        eval_data: Dict[str, Any] = blackboard.get_namespace("global")
        if context:
            eval_data.update(context)  # type: ignore

        try:
            # Simple expression evaluation (limited subset for security)
            # In a real system, we'd use a safe evaluator or AST parsing.
            # For now, we'll check for "key" or "key == value"
            if " == " in condition:
                parts = condition.split(" == ")
                if len(parts) == 2:
                    k, v = parts
                    return str(eval_data.get(k.strip())) == v.strip().strip("'").strip('"')

            # Default to checking if key exists and is truthy
            return bool(eval_data.get(condition.strip()))
        except Exception as e:
            logger.error(f"Failed to evaluate condition '{condition}': {e}")
            return False

    def _empty_result(self, suite: str, subcommand: str) -> ChainResult:
        """Fallback result for missing configurations."""
        return ChainResult(
            suite=suite, subcommand=subcommand, success=False, started_at=datetime.now()
        )

    def _collect_stats(self) -> OrchestratorStatsDict:
        """Aggregates performance data from the current session."""
        return self.monitor.get_session_stats(self.history)

# Quick Access Function
def execute_chain(suite: str, subcommand: str, context: Optional[HookContextDict] = None) -> ChainResult:
    """Convenience wrapper for one-off chain execution."""
    orchestrator = AgentOrchestrator()
    return orchestrator.run(suite, subcommand, context)
