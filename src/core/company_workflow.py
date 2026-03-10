"""Company Workflow — /company workflow backend.

Automated workflows: onboard, upsell, bug-pipeline, weekly-brief, deploy.
Each workflow is a composable pipeline of agent steps.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

logger = logging.getLogger(__name__)

AGENT_ROLES = ("cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data")


@dataclass
class WorkflowStep:
    """Single step in a workflow pipeline."""

    agent_role: str
    model_hint: str
    goal: str
    output: str = ""
    status: str = "pending"
    mcu_cost: int = 0


@dataclass
class WorkflowResult:
    """Result of executing a workflow."""

    name: str
    steps: list[WorkflowStep] = field(default_factory=list)
    status: str = "pending"
    total_mcu: int = 0
    outputs: dict[str, str] = field(default_factory=dict)
    error: str = ""


@dataclass
class WorkflowDef:
    """Definition of a workflow."""

    name: str
    trigger: str
    agents: list[str]
    steps: list[WorkflowStep]


# Built-in workflow definitions
def _build_onboard(tenant_id: str, email: str, tier: str) -> WorkflowDef:
    mcu_seed = {"starter": 100, "growth": 500, "premium": 2000}.get(tier, 100)
    return WorkflowDef(
        name="onboard",
        trigger="subscription.created",
        agents=["coo", "cs", "cmo"],
        steps=[
            WorkflowStep(
                agent_role="coo",
                model_hint="local",
                goal=f"Setup new tenant {tenant_id} on tier {tier}. Seed {mcu_seed} MCU.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cs",
                model_hint="haiku",
                goal=f"Write welcome email for {email} on {tier} plan.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cmo",
                model_hint="gemini",
                goal=f"Create onboarding tips sequence for {tier} user.",
                mcu_cost=1,
            ),
        ],
    )


def _build_upsell(tenant_id: str, balance: int) -> WorkflowDef:
    return WorkflowDef(
        name="upsell",
        trigger="credits.low",
        agents=["data", "sales", "cmo"],
        steps=[
            WorkflowStep(
                agent_role="data",
                model_hint="local",
                goal=f"Analyze usage pattern for tenant {tenant_id}.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="sales",
                model_hint="haiku",
                goal=f"Craft personalized upgrade offer. Current balance: {balance} MCU.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cmo",
                model_hint="gemini",
                goal="Write 2 subject line variants for upsell email.",
                mcu_cost=1,
            ),
        ],
    )


def _build_bug_pipeline(ticket: str, tenant_id: str = "") -> WorkflowDef:
    ctx = f" for tenant {tenant_id}" if tenant_id else ""
    return WorkflowDef(
        name="bug-pipeline",
        trigger="manual",
        agents=["cs", "cto", "coo"],
        steps=[
            WorkflowStep(
                agent_role="cs",
                model_hint="haiku",
                goal=f"Acknowledge bug report{ctx}, draft response.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cto",
                model_hint="sonnet",
                goal=f"Investigate and fix: {ticket}",
                mcu_cost=5,
            ),
            WorkflowStep(
                agent_role="coo",
                model_hint="local",
                goal="Log bug fix to activity log, update tenant status.",
                mcu_cost=1,
            ),
        ],
    )


def _build_weekly_brief() -> WorkflowDef:
    return WorkflowDef(
        name="weekly-brief",
        trigger="manual",
        agents=["data", "cfo", "cmo"],
        steps=[
            WorkflowStep(
                agent_role="data",
                model_hint="local",
                goal="Generate weekly business metrics summary.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cfo",
                model_hint="local",
                goal="Calculate weekly LLM cost vs MCU revenue margin.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cmo",
                model_hint="gemini",
                goal="Write CEO newsletter from weekly metrics.",
                mcu_cost=1,
            ),
        ],
    )


def _build_deploy(env: str, service: str = "") -> WorkflowDef:
    svc_label = f" {service}" if service else ""
    return WorkflowDef(
        name="deploy",
        trigger="manual",
        agents=["cto", "coo"],
        steps=[
            WorkflowStep(
                agent_role="cto",
                model_hint="sonnet",
                goal=f"Pre-deploy checklist for {env}{svc_label}: tests, no TODOs, no secrets.",
                mcu_cost=3,
            ),
            WorkflowStep(
                agent_role="coo",
                model_hint="local",
                goal=f"Deploy{svc_label} to {env} via fly.io.",
                mcu_cost=1,
            ),
            WorkflowStep(
                agent_role="cto",
                model_hint="haiku",
                goal=f"Smoke test {env}: /health, /v1/missions, /v1/mcu/balance.",
                mcu_cost=1,
            ),
        ],
    )


WORKFLOW_BUILDERS: dict[str, Callable] = {
    "onboard": _build_onboard,
    "upsell": _build_upsell,
    "bug-pipeline": _build_bug_pipeline,
    "weekly-brief": _build_weekly_brief,
    "deploy": _build_deploy,
}


def list_workflows(base_dir: str | Path = ".") -> list[dict]:
    """List all registered workflows (built-in + custom)."""
    workflows = []

    # Built-in
    for name in WORKFLOW_BUILDERS:
        workflows.append({
            "name": name,
            "type": "built-in",
            "trigger": _get_trigger(name),
        })

    # Custom from .mekong/workflows/
    base = Path(base_dir)
    wf_dir = base / ".mekong" / "workflows"
    if wf_dir.exists():
        for f in sorted(wf_dir.glob("*.md")):
            workflows.append({
                "name": f.stem,
                "type": "custom",
                "trigger": "manual",
            })

    return workflows


def _get_trigger(name: str) -> str:
    triggers = {
        "onboard": "subscription.created",
        "upsell": "credits.low",
        "bug-pipeline": "manual",
        "weekly-brief": "manual",
        "deploy": "manual",
    }
    return triggers.get(name, "manual")


def build_workflow(name: str, **kwargs) -> WorkflowDef:
    """Build a workflow definition by name with given args."""
    builder = WORKFLOW_BUILDERS.get(name)
    if not builder:
        raise ValueError(f"Unknown workflow: {name}. Available: {list(WORKFLOW_BUILDERS.keys())}")
    return builder(**kwargs)


def execute_workflow(
    workflow: WorkflowDef,
    step_executor: Callable[[WorkflowStep], str] | None = None,
) -> WorkflowResult:
    """Execute a workflow pipeline step by step.

    Args:
        workflow: The workflow definition to execute.
        step_executor: Optional callable that executes a step and returns output.
                      If None, steps are marked as completed with placeholder output.

    Returns:
        WorkflowResult with all step outputs and total MCU.
    """
    result = WorkflowResult(name=workflow.name)

    for step in workflow.steps:
        try:
            if step_executor:
                output = step_executor(step)
            else:
                output = f"[{step.agent_role}] Completed: {step.goal}"

            step.status = "completed"
            step.output = output
            result.steps.append(step)
            result.outputs[step.agent_role] = output
            result.total_mcu += step.mcu_cost

        except Exception as e:
            step.status = "failed"
            step.output = str(e)
            result.steps.append(step)
            result.status = "failed"
            result.error = f"Step [{step.agent_role}] failed: {e}"
            return result

    result.status = "completed"
    return result


def log_workflow_run(
    result: WorkflowResult,
    base_dir: str | Path = ".",
) -> str:
    """Log workflow execution to activity log.

    Returns path to log entry.
    """
    base = Path(base_dir)
    log_dir = base / ".mekong"
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / "activity.log"
    now = datetime.now(timezone.utc).isoformat()

    entry = {
        "timestamp": now,
        "workflow": result.name,
        "status": result.status,
        "total_mcu": result.total_mcu,
        "steps": len(result.steps),
        "error": result.error,
    }

    # Append to log file
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    return str(log_file)


def add_custom_workflow(
    name: str,
    content: str,
    base_dir: str | Path = ".",
) -> str:
    """Register a custom workflow from markdown content.

    Returns path to saved workflow file.
    """
    base = Path(base_dir)
    wf_dir = base / ".mekong" / "workflows"
    wf_dir.mkdir(parents=True, exist_ok=True)

    wf_file = wf_dir / f"{name}.md"
    wf_file.write_text(content, encoding="utf-8")

    return str(wf_file)
