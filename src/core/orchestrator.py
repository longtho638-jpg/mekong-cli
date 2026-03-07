"""Mekong CLI - Recipe Orchestrator.

Coordinates Plan → Execute → Verify workflow.
Implements ClaudeKit DNA's triadic pattern.

Modular implementation with internal submodules.
"""

from __future__ import annotations

import subprocess
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from .llm_client import LLMClient

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from .dag_scheduler import DAGScheduler, validate_dag
from .event_bus import get_event_bus
from .execution_history import EventKind, ExecutionEvent, ExecutionHistory
from .executor import RecipeExecutor
from .health_endpoint import (
    register_component_check,
    start_health_server,
)
from .memory import MemoryEntry, MemoryStore
from .nlu import IntentClassifier
from .parser import Recipe, RecipeStep
from .planner import PlanningContext, RecipePlanner
from .retry_policy import RetryPolicy
from .telemetry import TelemetryCollector
from .verifier import RecipeVerifier, VerificationReport
from .workflow_state import StepStatus, WorkflowState, WorkflowStatus


class OrchestrationStatus(Enum):
    """Status of orchestration workflow."""

    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    ROLLED_BACK = "rolled_back"


@dataclass
class StepResult:
    """Result of executing and verifying a single step."""

    step: RecipeStep
    execution: Any  # ExecutionResult
    verification: VerificationReport
    retry_count: int = 0
    self_healed: bool = False


@dataclass
class OrchestrationResult:
    """Complete result of Plan → Execute → Verify workflow."""

    status: OrchestrationStatus
    recipe: Recipe
    step_results: list[StepResult] = field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0
    failed_steps: int = 0
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_steps == 0:
            return 0.0
        return (self.completed_steps / self.total_steps) * 100


class StepExecutor:
    """Executes and verifies individual recipe steps."""

    def __init__(
        self,
        executor: RecipeExecutor,
        verifier: RecipeVerifier,
        llm_client: Any | None = None,
        history: Any | None = None,
        telemetry: Any | None = None,
    ) -> None:
        self.executor = executor
        self.verifier = verifier
        self.llm_client = llm_client
        self.history = history
        self.telemetry = telemetry

    def execute_and_verify(
        self,
        step: RecipeStep,
        workflow_id: str = "",
        step_order: int = 0,
    ) -> StepResult:
        """Execute single step and verify results."""
        step_start = time.time()
        self_healed = False

        execution_result = self.executor.execute_step(step)

        # Self-healing for failed shell commands
        step_type = step.params.get("type", "shell") if step.params else "shell"
        if (
            step_type == "shell"
            and execution_result.exit_code != 0
            and self.llm_client
            and hasattr(self.llm_client, "generate")
        ):
            command = step.description.strip()
            stderr = execution_result.stderr or ""

            if self.telemetry:
                self.telemetry.record_llm_call()

            try:
                prompt = (
                    f"This shell command failed: `{command}`. "
                    f"Error: `{stderr[:500]}`. "
                    "Suggest a corrected command. "
                    "Reply with ONLY the corrected command, no explanation."
                )
                corrected = self.llm_client.generate(prompt).strip()

                if corrected and corrected != command:
                    healed_step = RecipeStep(
                        order=step.order,
                        title=f"{step.title} (healed)",
                        description=corrected,
                        agent=step.agent,
                        params=step.params,
                    )
                    execution_result = self.executor.execute_step(healed_step)
                    if execution_result.exit_code == 0:
                        self_healed = True

            except Exception:
                pass

        criteria = step.params.get("verification", {}) if step.params else {}
        verification_report = self.verifier.verify(execution_result, criteria)

        duration = time.time() - step_start
        if self.telemetry:
            self.telemetry.record_step(
                step_order=step.order,
                title=step.title,
                duration=duration,
                exit_code=execution_result.exit_code,
                self_healed=self_healed,
                agent=step.agent,
            )

        return StepResult(
            step=step,
            execution=execution_result,
            verification=verification_report,
            self_healed=self_healed,
        )


class RollbackHandler:
    """Handles rollback of failed recipe steps."""

    def __init__(self, enable_rollback: bool = True) -> None:
        self.enable_rollback = enable_rollback
        self.console = Console()

    def rollback(
        self,
        result: OrchestrationResult,
        failed_step: RecipeStep,
    ) -> None:
        """Rollback completed steps after failure."""
        if not self.enable_rollback:
            return

        self.console.print("[yellow]🔄 Rolling back completed steps...[/yellow]")
        rollback_errors: list[str] = []

        for step_result in reversed(result.step_results):
            if not step_result.verification.passed:
                continue

            step = step_result.step
            rollback_cmd = step.params.get("rollback") if step.params else None

            if not rollback_cmd:
                self.console.print(
                    f"  [dim]Step {step.order}: no rollback — skipping[/dim]",
                )
                continue

            self.console.print(f"  [yellow]↩ Rolling back step {step.order}...[/yellow]")

            try:
                proc = subprocess.run(
                    rollback_cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if proc.returncode == 0:
                    self.console.print(f"  [green]✓ Step {step.order} rolled back[/green]")
                else:
                    msg = f"Step {step.order} rollback failed: {proc.stderr.strip()}"
                    rollback_errors.append(msg)
                    self.console.print(f"  [red]✗ {msg}[/red]")

            except subprocess.TimeoutExpired:
                msg = f"Step {step.order} rollback timed out"
                rollback_errors.append(msg)
                self.console.print(f"  [red]✗ {msg}[/red]")

            except Exception as e:
                msg = f"Step {step.order} rollback error: {e}"
                rollback_errors.append(msg)
                self.console.print(f"  [red]✗ {msg}[/red]")

        if rollback_errors:
            result.errors.extend(rollback_errors)
            result.warnings.append("Rollback completed with errors")

        result.status = OrchestrationStatus.ROLLED_BACK


class ReportFormatter:
    """Formats and displays orchestration reports."""

    def __init__(self) -> None:
        self.console = Console()

    def display(self, result: OrchestrationResult) -> None:
        """Display final orchestration report."""
        self.console.print("\n" + "=" * 60)
        self.console.print("[bold]📊 ORCHESTRATION REPORT[/bold]")
        self.console.print("=" * 60)

        table = Table(show_header=False, box=None)
        table.add_column("Metric", style="bold")
        table.add_column("Value")

        table.add_row("Status", self._format_status(result.status))
        table.add_row("Total Steps", str(result.total_steps))
        table.add_row("Completed", f"[green]{result.completed_steps}[/green]")
        table.add_row("Failed", f"[red]{result.failed_steps}[/red]")
        table.add_row("Success Rate", f"{result.success_rate:.1f}%")

        self.console.print(table)

        if result.errors:
            self.console.print("\n[bold red]❌ Errors:[/bold red]")
            for error in result.errors:
                self.console.print(f"  • {error}")

        if result.warnings:
            self.console.print("\n[bold yellow]⚠️  Warnings:[/bold yellow]")
            for warning in result.warnings:
                self.console.print(f"  • {warning}")

        self.console.print("\n" + "=" * 60)

    def _format_status(self, status: OrchestrationStatus) -> str:
        """Format status with color."""
        colors = {
            OrchestrationStatus.SUCCESS: "green",
            OrchestrationStatus.FAILED: "red",
            OrchestrationStatus.PARTIAL: "yellow",
            OrchestrationStatus.ROLLED_BACK: "magenta",
        }
        color = colors.get(status, "white")
        return f"[{color}]{status.value.upper()}[/{color}]"


class RecipeOrchestrator:
    """Main workflow coordinator for Plan → Execute → Verify."""

    def __init__(
        self,
        llm_client: Optional["LLMClient"] = None,
        strict_verification: bool = True,
        enable_rollback: bool = True,
        use_swarm: bool = False,
        retry_policy: RetryPolicy | None = None,
        enable_health_endpoint: bool = True,
        health_port: int = 9192,
    ) -> None:
        self.planner = RecipePlanner(llm_client=llm_client)
        self.verifier = RecipeVerifier(strict_mode=strict_verification)
        self.console = Console()
        self.enable_rollback = enable_rollback
        self.telemetry = TelemetryCollector()
        self.memory = MemoryStore()
        self.nlu = IntentClassifier(llm_client=llm_client)
        self.retry_policy = retry_policy or RetryPolicy()
        self.history = ExecutionHistory()

        self.step_executor: StepExecutor | None = None
        self.rollback_handler = RollbackHandler(enable_rollback=enable_rollback)
        self.report_formatter = ReportFormatter()

        # Health endpoint integration
        self._health_endpoint_enabled = enable_health_endpoint
        self._health_port = health_port
        self._heartbeat_interval = 30  # seconds
        self._last_heartbeat: float | None = None

        if use_swarm:
            from .swarm import SwarmDispatcher, SwarmRegistry

            self.dispatcher: Any | None = SwarmDispatcher(SwarmRegistry())
        else:
            self.dispatcher = None

        self.bmad_loader: Any | None = None
        try:
            from packages.core.bmad.parsers.python.loader import BMADWorkflowLoader

            self.bmad_loader = BMADWorkflowLoader()
        except ImportError:
            self.console.print("[yellow]Warning: BMAD loader not available[/yellow]")

        # Initialize health endpoint if enabled
        if self._health_endpoint_enabled:
            self._init_health_endpoint()

    def _init_health_endpoint(self) -> None:
        """Initialize health endpoint with component checks."""
        try:
            # Import here to avoid circular imports
            from src.core.crash_detector import get_crash_detector

            def check_license() -> dict:
                from src.core.health_endpoint import ComponentStatus
                try:
                    from src.lib.raas_gate_validator import RaasGateValidator
                    validator = RaasGateValidator()
                    is_valid, _ = validator.validate()
                    return ComponentStatus(
                        status="healthy" if is_valid else "degraded",
                        message="License valid" if is_valid else "License invalid/expired",
                    )
                except Exception as e:
                    return ComponentStatus(status="unhealthy", message=str(e))

            def check_usage() -> dict:
                from src.core.health_endpoint import ComponentStatus
                try:
                    return ComponentStatus(status="healthy", message="Usage tracking ready")
                except Exception as e:
                    return ComponentStatus(status="degraded", message=str(e))

            def check_crash_detector() -> dict:
                from src.core.health_endpoint import ComponentStatus
                try:
                    detector = get_crash_detector()
                    freq = detector.get_frequency()
                    if freq.crashes_per_hour > 10:
                        return ComponentStatus(
                            status="degraded",
                            message=f"High crash rate: {freq.crashes_per_hour:.1f}/hour",
                        )
                    return ComponentStatus(
                        status="healthy",
                        message=f"{freq.crashes_last_hour} crashes in last hour",
                    )
                except Exception as e:
                    return ComponentStatus(status="unhealthy", message=str(e))

            def check_telegram() -> dict:
                from src.core.health_endpoint import ComponentStatus
                try:
                    import os
                    if os.getenv("TELEGRAM_BOT_TOKEN"):
                        return ComponentStatus(status="healthy", message="Telegram configured")
                    return ComponentStatus(status="degraded", message="Telegram not configured")
                except Exception as e:
                    return ComponentStatus(status="unhealthy", message=str(e))

            def check_proxy() -> dict:
                from src.core.health_endpoint import ComponentStatus
                try:
                    import os
                    proxy_url = os.getenv("ANTHROPIC_BASE_URL", "http://localhost:9191")
                    return ComponentStatus(
                        status="healthy",
                        message=f"Proxy at {proxy_url}",
                    )
                except Exception as e:
                    return ComponentStatus(status="unhealthy", message=str(e))

            register_component_check("license", check_license)
            register_component_check("usage", check_usage)
            register_component_check("crash_detector", check_crash_detector)
            register_component_check("telegram", check_telegram)
            register_component_check("proxy", check_proxy)

            # Start health server
            start_health_server(port=self._health_port)
            self.console.print(
                f"[dim]Health endpoint: http://127.0.0.1:{self._health_port}/health[/dim]",
            )
        except Exception as e:
            self.console.print(f"[yellow]Warning: Failed to start health endpoint: {e}[/yellow]")

    def _emit_heartbeat(self) -> None:
        """Emit heartbeat event to EventBus."""
        now = time.time()
        if self._last_heartbeat is None or (now - self._last_heartbeat) >= self._heartbeat_interval:
            self._last_heartbeat = now
            event_bus = get_event_bus()
            event_bus.emit(
                EventType.PATTERN_DETECTED,
                {
                    "type": "heartbeat",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "interval": self._heartbeat_interval,
                },
            )

    def _init_step_executor(self, executor: RecipeExecutor) -> StepExecutor:
        self.step_executor = StepExecutor(
            executor=executor,
            verifier=self.verifier,
            llm_client=self.planner.llm_client,
            history=self.history,
            telemetry=self.telemetry,
        )
        return self.step_executor

    def run_from_goal(
        self,
        goal: str,
        context: PlanningContext | None = None,
        progress_callback: Callable[..., None] | None = None,
    ) -> OrchestrationResult:
        """Execute complete workflow from high-level goal."""
        self.console.print(
            Panel(
                f"[bold]Goal:[/bold] {goal}",
                title="🎯 Mekong Orchestrator",
                border_style="cyan",
            ),
        )

        goal_start_time = time.time()
        self.telemetry.start_trace(goal)

        # NLU Phase
        intent_result = self.nlu.classify(goal)
        if intent_result.confidence > 0.7 and intent_result.suggested_recipe:
            from .smart_router import SmartRouter

            router = SmartRouter(memory_store=self.memory)
            route = router.route(intent_result)
            if route.action == "recipe" and route.recipe_path:
                from .parser import RecipeParser

                try:
                    from pathlib import Path as _Path

                    recipe = RecipeParser().parse(_Path(route.recipe_path))
                    self.console.print(
                        f"[green]NLU:[/green] Matched recipe '{route.recipe_name}'",
                    )
                    result = self.run_from_recipe(
                        recipe,
                        progress_callback=progress_callback,
                    )
                    self._finalize_workflow(result, goal, goal_start_time)
                    return result
                except Exception:
                    pass

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

        plan_issues = self.planner.validate_plan(recipe)
        if plan_issues:
            self.console.print("[yellow]⚠️  Plan validation warnings:[/yellow]")
            for issue in plan_issues:
                self.console.print(f"  • {issue}")

        self.console.print(f"[green]✓[/green] Generated {len(recipe.steps)} steps")

        # PHASE 2 & 3: EXECUTE → VERIFY
        result = self.run_from_recipe(recipe, progress_callback=progress_callback)
        self._finalize_workflow(result, goal, goal_start_time)
        return result

    def _finalize_workflow(
        self,
        result: OrchestrationResult,
        goal: str,
        goal_start_time: float,
    ) -> None:
        self.telemetry.finish_trace()

        entry = MemoryEntry(
            goal=goal,
            status=result.status.value,
            duration_ms=(time.time() - goal_start_time) * 1000,
            error_summary="; ".join(result.errors[:3]) if result.errors else "",
            recipe_used=result.recipe.name if result.recipe else "",
        )
        self.memory.record(entry)

    def run_from_recipe(
        self,
        recipe: Recipe,
        progress_callback: Callable[..., None] | None = None,
    ) -> OrchestrationResult:
        """Execute existing recipe with verification."""
        workflow_id = uuid.uuid4().hex[:12]
        result = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=recipe,
            total_steps=len(recipe.steps),
        )

        wf_state = WorkflowState(workflow_id=workflow_id)
        wf_state.register_steps(len(recipe.steps))
        wf_state.transition(WorkflowStatus.RUNNING)

        self.history.append(
            ExecutionEvent.create(
                EventKind.WORKFLOW_STARTED,
                workflow_id,
                data={"recipe": recipe.name, "steps": len(recipe.steps)},
            ),
        )

        self.console.print(
            "\n[bold yellow]⚙️  PHASE 2: EXECUTION & VERIFICATION[/bold yellow]",
        )

        executor = RecipeExecutor(recipe)
        step_executor = self._init_step_executor(executor)

        dag = DAGScheduler(recipe.steps)
        if dag.has_dependencies():
            return self._run_dag_workflow(dag, step_executor, result, workflow_id)

        return self._run_sequential_workflow(
            recipe,
            step_executor,
            result,
            workflow_id,
            wf_state,
            progress_callback,
        )

    def _run_dag_workflow(
        self,
        dag: DAGScheduler,
        step_executor: StepExecutor,
        result: OrchestrationResult,
        workflow_id: str,
    ) -> OrchestrationResult:
        """Run DAG-based parallel execution."""
        cycle_err = validate_dag(dag.steps)
        if cycle_err:
            result.status = OrchestrationStatus.FAILED
            result.errors.append(cycle_err)
            self.report_formatter.display(result)
            return result

        self.console.print("[dim]DAG mode: parallel execution enabled[/dim]")

        def _dag_executor(step: RecipeStep) -> StepResult:
            return step_executor.execute_and_verify(step, workflow_id, step.order)

        def _on_dag_complete(order: int, dag_result: Any) -> None:
            if dag_result.success:
                result.completed_steps += 1
                self.console.print(f"[green]✓[/green] Step {order} passed")
            else:
                result.failed_steps += 1
                self.console.print(f"[red]✗[/red] Step {order} failed")

        dag_results = dag.execute_all(_dag_executor, _on_dag_complete)

        for order in sorted(dag_results):
            dr = dag_results[order]
            if dr.result:
                result.step_results.append(dr.result)
            if not dr.success:
                result.status = OrchestrationStatus.PARTIAL
                if dr.error:
                    result.errors.append(f"Step {order}: {dr.error}")

        self._finalize_dag_workflow(result, dag.cancelled_steps, workflow_id)
        self.report_formatter.display(result)
        return result

    def _finalize_dag_workflow(
        self,
        result: OrchestrationResult,
        cancelled_steps: list[int],
        workflow_id: str,
    ) -> None:
        if result.failed_steps == 0 and not cancelled_steps:
            result.status = OrchestrationStatus.SUCCESS
            self.history.append(
                ExecutionEvent.create(
                    EventKind.WORKFLOW_COMPLETED,
                    workflow_id,
                    data={"success_rate": result.success_rate},
                ),
            )
        else:
            self.history.append(
                ExecutionEvent.create(
                    EventKind.WORKFLOW_FAILED,
                    workflow_id,
                    data={"errors": result.errors[:5]},
                ),
            )

        self.history.persist(workflow_id)

    def _run_sequential_workflow(
        self,
        recipe: Recipe,
        step_executor: StepExecutor,
        result: OrchestrationResult,
        workflow_id: str,
        wf_state: WorkflowState,
        progress_callback: Callable[..., None] | None,
    ) -> OrchestrationResult:
        """Run sequential step execution."""
        for step in recipe.steps:
            self.history.append(
                ExecutionEvent.create(
                    EventKind.STEP_SCHEDULED,
                    workflow_id,
                    step.order,
                ),
            )
            wf_state.step_transition(step.order, StepStatus.STARTED)

            step_result = step_executor.execute_and_verify(
                step,
                workflow_id,
                step.order,
            )
            result.step_results.append(step_result)

            if step_result.verification.passed:
                result.completed_steps += 1
                wf_state.step_transition(step.order, StepStatus.COMPLETED)
                self.history.append(
                    ExecutionEvent.create(
                        EventKind.STEP_COMPLETED,
                        workflow_id,
                        step.order,
                    ),
                )
                self.console.print(f"[green]✓[/green] Step {step.order} passed")
            else:
                result.failed_steps += 1
                result.status = OrchestrationStatus.FAILED
                wf_state.step_transition(step.order, StepStatus.FAILED)
                self.history.append(
                    ExecutionEvent.create(
                        EventKind.STEP_FAILED,
                        workflow_id,
                        step.order,
                        data={"errors": step_result.verification.errors[:3]},
                    ),
                )
                self.console.print(f"[red]✗[/red] Step {step.order} failed")

                for error in step_result.verification.errors:
                    result.errors.append(f"Step {step.order}: {error}")

                for warning in step_result.verification.warnings:
                    result.warnings.append(f"Step {step.order}: {warning}")

                if progress_callback:
                    progress_callback(step_result, result)

                if not step_result.verification.passed:
                    if self.enable_rollback:
                        self.history.append(
                            ExecutionEvent.create(
                                EventKind.ROLLBACK_STARTED,
                                workflow_id,
                                step.order,
                            ),
                        )
                        self.rollback_handler.rollback(result, step)
                        self.history.append(
                            ExecutionEvent.create(
                                EventKind.ROLLBACK_COMPLETED,
                                workflow_id,
                                step.order,
                            ),
                        )
                        break
                    result.status = OrchestrationStatus.PARTIAL

        self._finalize_sequential_workflow(result, workflow_id)
        self.report_formatter.display(result)
        return result

    def _finalize_sequential_workflow(
        self,
        result: OrchestrationResult,
        workflow_id: str,
    ) -> None:
        if result.status == OrchestrationStatus.SUCCESS:
            self.history.append(
                ExecutionEvent.create(
                    EventKind.WORKFLOW_COMPLETED,
                    workflow_id,
                    data={"success_rate": result.success_rate},
                ),
            )
        elif result.status == OrchestrationStatus.FAILED:
            self.history.append(
                ExecutionEvent.create(
                    EventKind.WORKFLOW_FAILED,
                    workflow_id,
                    data={"errors": result.errors[:5]},
                ),
            )

        self.history.persist(workflow_id)

    def run_bmad_workflow(
        self,
        workflow_id: str,
        context: dict[str, Any] | None = None,
    ) -> OrchestrationResult:
        """Execute a BMAD workflow by ID."""
        if not self.bmad_loader:
            msg = "BMAD loader not available"
            raise RuntimeError(msg)

        workflow = self.bmad_loader.get_workflow(workflow_id)
        if not workflow:
            msg = f"Workflow not found: {workflow_id}"
            raise ValueError(msg)

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
    "OrchestrationResult",
    "OrchestrationStatus",
    "RecipeOrchestrator",
    "StepResult",
    "StepExecutor",
    "RollbackHandler",
    "ReportFormatter",
]
