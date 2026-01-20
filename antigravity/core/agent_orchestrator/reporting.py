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

    def export_mermaid(self, result: ChainResult) -> str:
        """Exports the execution trace as a Mermaid diagram."""
        lines = ["graph TD"]
        lines.append("    Start((Start)) --> Step1")

        for i, step in enumerate(result.steps, 1):
            status_icon = "✅" if step.status == StepStatus.COMPLETED else "❌"
            label = f"{step.agent}\n({step.action})\n{status_icon}"
            lines.append(f'    Step{i}["{label}"]')

            if i < len(result.steps):
                lines.append(f"    Step{i} --> Step{i+1}")
            else:
                lines.append(f"    Step{i} --> End((End))")

        return "\n".join(lines)
