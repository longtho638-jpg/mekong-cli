"""
Orchestrator Delegator - Logic for executing individual steps
"""
import logging
import time
from antigravity.core.chains import AgentStep
from antigravity.core.types import HookContextDict
from typing import Optional, Any, Dict

from .models import StepResult, StepStatus
from antigravity.core.agent_memory.blackboard import blackboard

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
