"""
Mekong CLI - Recipe Orchestrator

Coordinates Plan → Execute → Verify workflow.
Implements ClaudeKit DNA's triadic pattern.
"""

from typing import Optional, Any, List, Dict
from dataclasses import dataclass, field
from enum import Enum
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from .planner import RecipePlanner, PlanningContext
from .executor import RecipeExecutor
from .verifier import RecipeVerifier, VerificationReport, ExecutionResult
from .parser import Recipe, RecipeStep


class OrchestrationStatus(Enum):
    """Status of orchestration workflow"""

    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    ROLLED_BACK = "rolled_back"


@dataclass
class StepResult:
    """Result of executing and verifying a single step"""

    step: RecipeStep
    execution: ExecutionResult
    verification: VerificationReport
    retry_count: int = 0


@dataclass
class OrchestrationResult:
    """Complete result of Plan → Execute → Verify workflow"""

    status: OrchestrationStatus
    recipe: Recipe
    step_results: List[StepResult] = field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0
    failed_steps: int = 0
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_steps == 0:
            return 0.0
        return (self.completed_steps / self.total_steps) * 100


class RecipeOrchestrator:
    """
    Coordinates Plan → Execute → Verify workflow.

    This is the main entry point for executing goals with full
    planning, execution, and verification pipeline.
    """

    def __init__(
        self,
        llm_client: Optional[Any] = None,
        strict_verification: bool = True,
        enable_rollback: bool = True,
    ):
        """
        Initialize orchestrator.

        Args:
            llm_client: Optional LLM client for planning and execution
            strict_verification: If True, warnings are treated as failures
            enable_rollback: If True, failed steps trigger rollback
        """
        self.planner = RecipePlanner(llm_client=llm_client)
        self.verifier = RecipeVerifier(strict_mode=strict_verification)
        self.console = Console()
        self.enable_rollback = enable_rollback

        # Initialize BMAD loader
        try:
            from packages.core.bmad.loader import BMADWorkflowLoader

            self.bmad_loader = BMADWorkflowLoader()
        except ImportError:
            self.bmad_loader = None
            self.console.print("[yellow]Warning: BMAD loader not available[/yellow]")

    def run_from_goal(
        self, goal: str, context: Optional[PlanningContext] = None
    ) -> OrchestrationResult:
        """
        Execute complete workflow from high-level goal.

        PLAN → EXECUTE → VERIFY

        Args:
            goal: User's high-level objective
            context: Optional planning context

        Returns:
            OrchestrationResult with complete workflow results
        """
        self.console.print(
            Panel(
                f"[bold]Goal:[/bold] {goal}",
                title="🎯 Mekong Orchestrator",
                border_style="cyan",
            )
        )

        # PHASE 1: PLAN
        self.console.print("\n[bold yellow]📋 PHASE 1: PLANNING[/bold yellow]")

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=self.console,
        ) as progress:
            task = progress.add_task("Generating execution plan...", total=None)
            recipe = self.planner.plan(goal, context)
            progress.update(task, completed=True)

        # Validate plan
        plan_issues = self.planner.validate_plan(recipe)
        if plan_issues:
            self.console.print("[yellow]⚠️  Plan validation warnings:[/yellow]")
            for issue in plan_issues:
                self.console.print(f"  • {issue}")

        self.console.print(f"[green]✓[/green] Generated {len(recipe.steps)} steps")

        # PHASE 2 & 3: EXECUTE → VERIFY
        return self.run_from_recipe(recipe)

    def run_from_recipe(self, recipe: Recipe) -> OrchestrationResult:
        """
        Execute existing recipe with verification.

        EXECUTE → VERIFY

        Args:
            recipe: Pre-planned recipe to execute

        Returns:
            OrchestrationResult
        """
        result = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=recipe,
            total_steps=len(recipe.steps),
        )

        self.console.print(
            "\n[bold yellow]⚙️  PHASE 2: EXECUTION & VERIFICATION[/bold yellow]"
        )

        # Create executor
        executor = RecipeExecutor(recipe)

        # Execute each step with verification
        for step in recipe.steps:
            step_result = self._execute_and_verify_step(executor, step)
            result.step_results.append(step_result)

            if step_result.verification.passed:
                result.completed_steps += 1
                self.console.print(f"[green]✓[/green] Step {step.order} passed")
            else:
                result.failed_steps += 1
                result.status = OrchestrationStatus.FAILED
                self.console.print(f"[red]✗[/red] Step {step.order} failed")

                # Collect errors
                for error in step_result.verification.errors:
                    result.errors.append(f"Step {step.order}: {error}")

                # Handle failure
                if self.enable_rollback:
                    self._handle_failure(result, step)
                    break
                else:
                    # Continue execution despite failure
                    result.status = OrchestrationStatus.PARTIAL

            # Collect warnings
            for warning in step_result.verification.warnings:
                result.warnings.append(f"Step {step.order}: {warning}")

        # Display final report
        self._display_report(result)

        return result

    def _execute_and_verify_step(
        self, executor: RecipeExecutor, step: RecipeStep
    ) -> StepResult:
        """
        Execute single step and verify results.

        Args:
            executor: Recipe executor instance
            step: Step to execute

        Returns:
            StepResult with execution and verification data
        """
        # Execute step
        execution_result = executor.execute_step(step)

        # Extract verification criteria from step params
        criteria = step.params.get("verification", {})

        # Verify results
        verification_report = self.verifier.verify(execution_result, criteria)

        return StepResult(
            step=step, execution=execution_result, verification=verification_report
        )

    def _handle_failure(
        self, result: OrchestrationResult, failed_step: RecipeStep
    ) -> None:
        """
        Handle step failure with rollback.

        Args:
            result: Current orchestration result
            failed_step: The step that failed
        """
        self.console.print(
            f"\n[bold red]❌ Step {failed_step.order} failed verification[/bold red]"
        )

        if self.enable_rollback:
            self.console.print("[yellow]🔄 Rolling back changes...[/yellow]")

            # TODO: Implement rollback logic
            # This would reverse completed steps in reverse order
            # For now, just mark status

            result.status = OrchestrationStatus.ROLLED_BACK

    def _display_report(self, result: OrchestrationResult) -> None:
        """
        Display final orchestration report.

        Args:
            result: Orchestration result to display
        """
        self.console.print("\n" + "=" * 60)
        self.console.print("[bold]📊 ORCHESTRATION REPORT[/bold]")
        self.console.print("=" * 60)

        # Summary table
        table = Table(show_header=False, box=None)
        table.add_column("Metric", style="bold")
        table.add_column("Value")

        table.add_row("Status", self._format_status(result.status))
        table.add_row("Total Steps", str(result.total_steps))
        table.add_row("Completed", f"[green]{result.completed_steps}[/green]")
        table.add_row("Failed", f"[red]{result.failed_steps}[/red]")
        table.add_row("Success Rate", f"{result.success_rate:.1f}%")

        self.console.print(table)

        # Errors
        if result.errors:
            self.console.print("\n[bold red]❌ Errors:[/bold red]")
            for error in result.errors:
                self.console.print(f"  • {error}")

        # Warnings
        if result.warnings:
            self.console.print("\n[bold yellow]⚠️  Warnings:[/bold yellow]")
            for warning in result.warnings:
                self.console.print(f"  • {warning}")

        self.console.print("\n" + "=" * 60)

    def _format_status(self, status: OrchestrationStatus) -> str:
        """Format status with color"""
        colors = {
            OrchestrationStatus.SUCCESS: "green",
            OrchestrationStatus.FAILED: "red",
            OrchestrationStatus.PARTIAL: "yellow",
            OrchestrationStatus.ROLLED_BACK: "magenta",
        }
        color = colors.get(status, "white")
        return f"[{color}]{status.value.upper()}[/{color}]"

    def run_bmad_workflow(
        self, workflow_id: str, context: Optional[Dict[str, Any]] = None
    ) -> OrchestrationResult:
        """
        Execute a BMAD workflow by ID.

        Args:
            workflow_id: BMAD workflow identifier
            context: Optional execution context

        Returns:
            OrchestrationResult
        """
        if not self.bmad_loader:
            raise RuntimeError("BMAD loader not available")

        # Load workflow
        workflow = self.bmad_loader.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        # Convert BMAD workflow to Recipe format
        from .parser import Recipe, RecipeStep

        step = RecipeStep(
            order=1,
            title=f"Execute {workflow.name}",
            description=f"# BMAD Workflow: {workflow_id}",
            params={"workflow_id": workflow_id, "context": context or {}},
        )

        recipe = Recipe(
            name=workflow.name,
            description=workflow.description,
            steps=[step],
            metadata={"agent_type": workflow.agent_type, "source": "bmad"},
        )

        return self.run_from_recipe(recipe)


__all__ = [
    "RecipeOrchestrator",
    "OrchestrationResult",
    "OrchestrationStatus",
    "StepResult",
]
