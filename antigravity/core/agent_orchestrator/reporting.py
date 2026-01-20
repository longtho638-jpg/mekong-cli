"""
🏯 Agent Orchestrator Reporting Logic
"""
from antigravity.core.chains import AgentStep
from typing import Optional

from .models import ChainResult, StepResult, StepStatus


class OrchestratorReporting:
    """Handles console output and visualization for the orchestrator."""

    def print_header(self, suite: str, subcommand: str, steps: int) -> None:
        """Standard visual header for CLI execution."""
        print(f"\n🚀 ORCHESTRATING: /{suite}:{subcommand}")
        print("═" * 60)
        print(f"   Deployment: {steps} specialized agents active")
        print("─" * 60)

    def print_step_start(self, step: AgentStep, index: int, total: int) -> None:
        """Prints the start of a step execution."""
        print(f"   [{index}/{total}] 🤖 {step.agent:<20} | {step.description}...")

    def print_step_success(self, duration_ms: float) -> None:
        """Prints success status for a step."""
        print(f"   ✓ Success ({duration_ms:.0f}ms)")

    def print_summary(self, result: ChainResult) -> None:
        """Standard visual summary for CLI completion."""
        print("─" * 60)
        icon = "✅" if result.success else "❌"
        status_text = "MISSION COMPLETE" if result.success else "MISSION FAILED"
        print(f"   {icon} {status_text} | Total Time: {result.total_duration_ms:.0f}ms")
        print("═" * 60)
