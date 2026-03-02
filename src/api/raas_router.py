"""
RaaS API — /v1/ route handlers: tasks, agents, SSE streaming.

Mounts onto the existing gateway FastAPI app via include_router().
All routes require Bearer auth resolved by raas_auth_middleware.require_tenant.
Wires directly to RecipeOrchestrator and AGENT_REGISTRY — no mocks.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from src.api.raas_auth_middleware import require_tenant
from src.api.raas_task_models import (
    AgentInfo,
    AgentRunRequest,
    AgentRunResponse,
    StepDetail,
    TaskRequest,
    TaskResponse,
    TaskStatus,
    TaskStatusResponse,
)
from src.api.raas_task_store import TaskRecord, get_task_store
from src.raas.auth import TenantContext

router = APIRouter(prefix="/v1", tags=["RaaS v1"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_orchestrator() -> Any:
    """Create a RecipeOrchestrator wired to the LLM client."""
    from src.core.llm_client import get_client
    from src.core.orchestrator import RecipeOrchestrator

    client = get_client()
    return RecipeOrchestrator(
        llm_client=client if client.is_available else None,
        strict_verification=True,
        enable_rollback=True,
    )


def _result_to_record(record: TaskRecord, result: Any) -> TaskRecord:
    """Populate a TaskRecord from an OrchestrationResult in-place."""
    from src.core.orchestrator import OrchestrationStatus

    status_map = {
        OrchestrationStatus.SUCCESS: TaskStatus.SUCCESS,
        OrchestrationStatus.FAILED: TaskStatus.FAILED,
        OrchestrationStatus.PARTIAL: TaskStatus.PARTIAL,
        OrchestrationStatus.ROLLED_BACK: TaskStatus.ROLLED_BACK,
    }
    record.status = status_map.get(result.status, TaskStatus.FAILED)
    record.total_steps = result.total_steps
    record.completed_steps = result.completed_steps
    record.failed_steps = result.failed_steps
    record.success_rate = result.success_rate
    record.errors = result.errors
    record.warnings = result.warnings
    record.steps = [
        StepDetail(
            order=sr.step.order,
            title=sr.step.title,
            passed=sr.verification.passed,
            exit_code=sr.execution.exit_code,
            summary=sr.verification.summary,
        )
        for sr in result.step_results
    ]
    return record


# ---------------------------------------------------------------------------
# Task endpoints
# ---------------------------------------------------------------------------


@router.post("/tasks", response_model=TaskResponse, status_code=202)
def submit_task(
    body: TaskRequest,
    tenant: TenantContext = Depends(require_tenant),
) -> TaskResponse:
    """Submit a goal for execution and return a task_id for polling.

    Runs the orchestrator synchronously in the same thread (suitable for
    short goals). For long-running goals, callers should poll GET /v1/tasks/{id}
    or stream via GET /v1/tasks/{id}/stream.

    Args:
        body: Task submission payload.
        tenant: Resolved tenant from Bearer token.

    Returns:
        :class:`TaskResponse` with task_id and initial status.
    """
    store = get_task_store()
    record = store.create(goal=body.goal, tenant_id=tenant.tenant_id)

    try:
        record.status = TaskStatus.RUNNING
        store.update(record)

        orchestrator = _build_orchestrator()
        result = orchestrator.run_from_goal(body.goal)
        record = _result_to_record(record, result)

    except Exception as exc:
        record.status = TaskStatus.FAILED
        record.errors.append(str(exc))

    store.update(record)
    return TaskResponse(
        task_id=record.task_id,
        status=record.status,
        tenant_id=tenant.tenant_id,
    )


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
def get_task_status(
    task_id: str,
    tenant: TenantContext = Depends(require_tenant),
) -> TaskStatusResponse:
    """Poll full status and result for a previously submitted task.

    Args:
        task_id: Identifier returned by POST /v1/tasks.
        tenant: Resolved tenant (enforces tenant isolation).

    Returns:
        :class:`TaskStatusResponse` with current status and step details.

    Raises:
        HTTPException 404: Task not found or belongs to another tenant.
    """
    store = get_task_store()
    record = store.get(task_id=task_id, tenant_id=tenant.tenant_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    return TaskStatusResponse(
        task_id=record.task_id,
        status=record.status,
        goal=record.goal,
        tenant_id=record.tenant_id,
        total_steps=record.total_steps,
        completed_steps=record.completed_steps,
        failed_steps=record.failed_steps,
        success_rate=record.success_rate,
        errors=record.errors,
        warnings=record.warnings,
        steps=record.steps,
    )


@router.get("/tasks/{task_id}/stream")
async def stream_task(
    task_id: str,
    tenant: TenantContext = Depends(require_tenant),
) -> StreamingResponse:
    """Stream task execution progress as Server-Sent Events (SSE).

    Runs the orchestrator in a background thread and yields step events
    as they complete. Clients connect with ``Accept: text/event-stream``.

    Args:
        task_id: Identifier returned by POST /v1/tasks.
        tenant: Resolved tenant.

    Returns:
        :class:`StreamingResponse` with SSE content-type.

    Raises:
        HTTPException 404: Task not found or belongs to another tenant.
    """
    store = get_task_store()
    record = store.get(task_id=task_id, tenant_id=tenant.tenant_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    async def _event_stream() -> AsyncGenerator[str, None]:
        queue: asyncio.Queue[Dict] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _on_step(step_result: Any, current: Any) -> None:
            event = {
                "type": "step",
                "order": step_result.step.order,
                "title": step_result.step.title,
                "passed": step_result.verification.passed,
                "exit_code": step_result.execution.exit_code,
                "summary": step_result.verification.summary,
                "completed": current.completed_steps,
                "total": current.total_steps,
            }
            asyncio.run_coroutine_threadsafe(queue.put(event), loop)

        def _run() -> Any:
            orch = _build_orchestrator()
            return orch.run_from_goal(record.goal, progress_callback=_on_step)

        future = loop.run_in_executor(None, _run)

        # Drain step events until execution finishes
        while not future.done():
            try:
                event = await asyncio.wait_for(queue.get(), timeout=0.5)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                continue

        # Flush remaining queued events
        while not queue.empty():
            event = queue.get_nowait()
            yield f"data: {json.dumps(event)}\n\n"

        # Emit final completion event
        try:
            result = future.result()
            record_updated = _result_to_record(record, result)
            store.update(record_updated)
            done_event = {
                "type": "complete",
                "status": record_updated.status.value,
                "success_rate": record_updated.success_rate,
                "errors": record_updated.errors,
            }
        except Exception as exc:
            done_event = {"type": "error", "message": str(exc)}

        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Agent endpoints
# ---------------------------------------------------------------------------


@router.get("/agents", response_model=List[AgentInfo])
def list_agents(
    tenant: TenantContext = Depends(require_tenant),
) -> List[AgentInfo]:
    """List all agents registered in AGENT_REGISTRY.

    Args:
        tenant: Resolved tenant (auth required, tenant unused in response).

    Returns:
        List of :class:`AgentInfo` with name and description.
    """
    from src.agents import registry

    agents: List[AgentInfo] = []
    for name in registry.list_agents():
        cls = registry.get(name)
        description = (cls.__doc__ or "").strip().splitlines()[0] if cls.__doc__ else name
        agents.append(AgentInfo(name=name, description=description))
    return agents


@router.post("/agents/{name}/run", response_model=AgentRunResponse)
def run_agent(
    name: str,
    body: AgentRunRequest,
    tenant: TenantContext = Depends(require_tenant),
) -> AgentRunResponse:
    """Run a named agent directly with a goal.

    Instantiates the agent from AGENT_REGISTRY, calls plan() then execute(),
    and returns structured output. Does NOT go through the full orchestrator.

    Args:
        name: Registered agent name (e.g. 'git', 'file', 'shell').
        body: Goal and options for the agent.
        tenant: Resolved tenant.

    Returns:
        :class:`AgentRunResponse` with agent output.

    Raises:
        HTTPException 404: Agent name not registered.
        HTTPException 500: Agent execution error.
    """
    from src.agents import registry

    if name not in registry:
        available = registry.list_agents()
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{name}' not found. Available: {available}",
        )

    try:
        agent_cls = registry.get(name)
        agent = agent_cls()

        plan = agent.plan(body.goal)
        exec_result = agent.execute(plan)

        output = str(exec_result) if exec_result is not None else ""
        return AgentRunResponse(agent=name, status="success", output=output)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Agent '{name}' execution error: {exc}",
        ) from exc


__all__ = ["router"]
