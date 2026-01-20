"""
Orchestrator Delegator - Logic for executing individual steps
"""
import logging
import time
from typing import Optional
from antigravity.core.chains import AgentStep
from .models import StepResult, StepStatus
from antigravity.core.types import HookContextDict

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
