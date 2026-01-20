"""
Orchestrator Delegator - Logic for executing individual steps
"""
import logging
import time
from antigravity.core.agent_memory.blackboard import blackboard
from antigravity.core.chains import AgentStep
from antigravity.core.types import HookContextDict
from typing import Any, Dict, List, Optional

from .models import StepResult, StepStatus

logger = logging.getLogger(__name__)

class OrchestratorDelegator:
    """Handles the invocation of specialized agents."""

    def __init__(self, verbose: bool = True, reporting = None):
        self.verbose = verbose
        self.reporting = reporting

    def execute_step(
        self, step: AgentStep, index: int, total: int, context: Optional[HookContextDict]
    ) -> StepResult:
        """Invokes an individual agent and captures the result."""
        start_time = time.time()

        if self.verbose and self.reporting:
            self.reporting.print_step_start(step, index, total)

        try:
            # 1. Prepare context from Blackboard
            # Agents can access shared data via namespaces
            shared_context = blackboard.get_namespace("global")
            if context:
                shared_context.update(context)

            # INTERFACE POINT: Real agent invocation would happen here.
            # We simulate agent execution and result capturing.
            time.sleep(0.01)

            # Simulation: Agent might write to blackboard
            output = f"Executed {step.action} using {step.agent}"

            # Store output in blackboard for next steps
            blackboard.set(f"last_output_{step.agent}", output)
            if step.id:
                blackboard.set(f"step_{step.id}_result", output)
            else:
                blackboard.set(f"step_{index}_result", output)

            status = StepStatus.COMPLETED
            error = None

        except Exception as e:
            logger.exception(f"Agent {step.agent} failed during {step.action}")
            output = None
            status = StepStatus.FAILED
            error = str(e)

        duration = (time.time() - start_time) * 1000

        if self.verbose and status == StepStatus.COMPLETED and self.reporting:
            self.reporting.print_step_success(duration)

        return StepResult(
            agent=step.agent,
            action=step.action,
            status=status,
            output=output,
            duration_ms=duration,
            error=error,
        )

    def execute_parallel(
        self, steps: List[AgentStep], index: int, total: int, context: Optional[HookContextDict]
    ) -> StepResult:
        """Executes multiple agent steps in parallel using a thread pool."""
        import threading
        from concurrent.futures import ThreadPoolExecutor

        start_time = time.time()
        logger.info(f"🚀 Executing {len(steps)} steps in parallel")

        results = []
        with ThreadPoolExecutor(max_workers=len(steps)) as executor:
            futures = [
                executor.submit(self.execute_step, step, index, total, context)
                for step in steps
            ]
            for future in futures:
                results.append(future.result())

        duration = (time.time() - start_time) * 1000

        # Determine overall status
        failed = any(r.status == StepStatus.FAILED for r in results)
        status = StepStatus.FAILED if failed else StepStatus.COMPLETED

        combined_output = f"Parallel execution of {len(steps)} steps completed. Results: {[r.status.value for r in results]}"

        return StepResult(
            agent="parallel-executor",
            action="parallel-execution",
            status=status,
            output=combined_output,
            duration_ms=duration,
            error="One or more parallel steps failed" if failed else None,
        )
