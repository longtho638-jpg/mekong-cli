"""
Mekong CLI - Gateway Server (OpenClaw Hybrid Commander)

FastAPI server exposing the Plan-Execute-Verify engine via HTTP + WebSocket.
Includes "Washing Machine" dashboard for one-button operation.
Enables remote command execution: Cloud Ra Lenh + Local Thuc Thi.
"""

import asyncio
import json
import os
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from src.core.llm_client import get_client
from src.core.orchestrator import RecipeOrchestrator
from src.core.gateway_config import DEFAULT_PRESETS, GatewayConfig, load_config
from src.core.gateway_dashboard import DASHBOARD_HTML
from src.core.swarm import SwarmNode, SwarmRegistry
from src.core.event_bus import EventType, get_event_bus
from src.core.scheduler import Scheduler, ScheduledJob
from src.core.memory import MemoryStore, MemoryEntry


# -- Load config; export presets for backward compatibility --
GATEWAY_CONFIG: GatewayConfig = load_config()
PRESET_ACTIONS: List[Dict[str, str]] = GATEWAY_CONFIG.presets

VERSION = "0.9.0"


# -- Request / Response models --

class CommandRequest(BaseModel):
    """Incoming command from the cloud brain"""
    goal: str = Field(..., min_length=1, description="High-level goal to execute")
    token: str = Field(..., min_length=1, description="API authentication token")


class StepSummary(BaseModel):
    """Summary of a single execution step"""
    order: int
    title: str
    passed: bool
    exit_code: int
    summary: str


class HumanSummary(BaseModel):
    """Non-dev friendly summary in both languages"""
    en: str
    vi: str


class CommandResponse(BaseModel):
    """Response returned to the cloud caller"""
    status: str
    goal: str
    total_steps: int
    completed_steps: int
    failed_steps: int
    success_rate: float
    errors: List[str]
    warnings: List[str]
    steps: List[StepSummary]
    trace: Optional[Dict[str, Any]] = None
    human_summary: Optional[HumanSummary] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "ok"
    version: str = VERSION
    engine: str = "Plan-Execute-Verify"


class PresetAction(BaseModel):
    """A preset one-button action for the dashboard"""
    id: str
    icon: str
    label: str
    label_vi: str
    goal: str


class ProjectInfo(BaseModel):
    """A project discovered in the apps/ directory"""
    name: str
    path: str
    has_git: bool


class SwarmNodeInfo(BaseModel):
    """Swarm node info returned by API"""
    id: str
    name: str
    host: str
    port: int
    status: str
    last_heartbeat: float


class SwarmRegisterRequest(BaseModel):
    """Request to register a new swarm node"""
    name: str = Field(..., min_length=1)
    host: str = Field(..., min_length=1)
    port: int = Field(8000, ge=1, le=65535)
    token: str = Field(..., min_length=1)


class SwarmDispatchRequest(BaseModel):
    """Request to dispatch a goal to a remote node"""
    node_id: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)


class ScheduleJobInfo(BaseModel):
    """Schedule job info returned by API"""
    id: str
    name: str
    goal: str
    job_type: str
    interval_seconds: int
    daily_time: str
    enabled: bool
    last_run: float
    next_run: float
    run_count: int


class ScheduleAddRequest(BaseModel):
    """Request to add a new scheduled job"""
    name: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    job_type: str = Field("interval", pattern="^(interval|daily)$")
    interval_seconds: int = Field(300, ge=10)
    daily_time: str = Field("09:00")


class MemoryEntryInfo(BaseModel):
    """Memory entry returned by API"""
    goal: str
    status: str
    timestamp: float
    duration_ms: float
    error_summary: str
    recipe_used: str


class MemoryStatsResponse(BaseModel):
    """Memory aggregate statistics"""
    total: int
    success_rate: float
    top_goals: List[str]
    recent_failures: int


class NLUParseRequest(BaseModel):
    """NLU parse request"""
    goal: str = Field(..., min_length=1)


class NLUParseResponse(BaseModel):
    """NLU parse response"""
    intent: str
    confidence: float
    entities: Dict[str, str]
    suggested_recipe: str


# -- Token verification --

def verify_token(token: str) -> None:
    """Verify the provided token against MEKONG_API_TOKEN env var."""
    expected = os.environ.get("MEKONG_API_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=500,
            detail="MEKONG_API_TOKEN not configured on server",
        )
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid token")


def build_human_summary(result) -> HumanSummary:
    """Generate a non-dev friendly summary from orchestration result."""
    status = result.status.value
    rate = result.success_rate

    if status == "success":
        en = f"All done! {result.completed_steps} tasks completed successfully."
        vi = f"Xong! {result.completed_steps} tac vu hoan thanh thanh cong."
    elif status == "partial":
        en = (f"Partially done. {result.completed_steps}/{result.total_steps} "
              f"tasks completed ({rate:.0f}%). Some issues need attention.")
        vi = (f"Hoan thanh mot phan. {result.completed_steps}/{result.total_steps} "
              f"tac vu ({rate:.0f}%). Can xem lai mot so van de.")
    else:
        en = f"Failed. {result.failed_steps} tasks had problems. Please check errors."
        vi = f"That bai. {result.failed_steps} tac vu gap loi. Vui long kiem tra."

    return HumanSummary(en=en, vi=vi)


def _scan_projects() -> List[ProjectInfo]:
    """Scan configured project paths for sub-projects."""
    projects: List[ProjectInfo] = []
    for base in GATEWAY_CONFIG.project_paths:
        base_dir = Path(base)
        if not base_dir.is_dir():
            continue
        for child in sorted(base_dir.iterdir()):
            if child.is_dir() and not child.name.startswith("."):
                projects.append(ProjectInfo(
                    name=child.name,
                    path=str(child),
                    has_git=(child / ".git").exists(),
                ))
    return projects


def _build_orchestrator():
    """Create a configured RecipeOrchestrator instance."""
    llm_client = get_client()
    return RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=True,
        enable_rollback=True,
    )


def _build_cmd_response(result, goal: str, orchestrator) -> CommandResponse:
    """Build CommandResponse from orchestration result."""
    steps = [
        StepSummary(
            order=sr.step.order,
            title=sr.step.title,
            passed=sr.verification.passed,
            exit_code=sr.execution.exit_code,
            summary=sr.verification.summary,
        )
        for sr in result.step_results
    ]

    trace = None
    trace_obj = orchestrator.telemetry.get_trace()
    if trace_obj:
        trace = asdict(trace_obj)

    human_summary = build_human_summary(result)

    return CommandResponse(
        status=result.status.value,
        goal=goal,
        total_steps=result.total_steps,
        completed_steps=result.completed_steps,
        failed_steps=result.failed_steps,
        success_rate=result.success_rate,
        errors=result.errors,
        warnings=result.warnings,
        steps=steps,
        trace=trace,
        human_summary=human_summary,
    )


# -- FastAPI app factory --

def create_app() -> FastAPI:
    """Create and configure the gateway FastAPI application."""
    gateway = FastAPI(
        title="Mekong Gateway",
        description="OpenClaw Hybrid Commander — Cloud Ra Lenh, Local Thuc Thi",
        version=VERSION,
    )

    @gateway.get("/", response_class=HTMLResponse)
    def dashboard():
        """Serve the Washing Machine dashboard UI"""
        presets_json = json.dumps(PRESET_ACTIONS)
        html = DASHBOARD_HTML.replace("__PRESETS_JSON__", presets_json)
        html = html.replace("__VERSION__", f"v{VERSION}")
        return HTMLResponse(content=html)

    @gateway.get("/presets", response_model=List[PresetAction])
    def list_presets():
        """List available one-button preset actions"""
        return [PresetAction(**p) for p in PRESET_ACTIONS]

    @gateway.get("/projects", response_model=List[ProjectInfo])
    def list_projects():
        """List available sub-projects from apps/ directory"""
        return _scan_projects()

    @gateway.get("/health", response_model=HealthResponse)
    def health_check():
        """Health check endpoint"""
        return HealthResponse()

    @gateway.post("/cmd", response_model=CommandResponse)
    def execute_command(req: CommandRequest):
        """Execute a goal through the Plan-Execute-Verify engine (HTTP)."""
        verify_token(req.token)
        try:
            orchestrator = _build_orchestrator()
            result = orchestrator.run_from_goal(req.goal)
            return _build_cmd_response(result, req.goal, orchestrator)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @gateway.websocket("/ws")
    async def ws_execute(websocket: WebSocket):
        """Execute a goal with real-time step-by-step progress streaming."""
        await websocket.accept()
        try:
            data = await websocket.receive_json()
            goal = data.get("goal", "")
            token = data.get("token", "")

            if not goal or not token:
                await websocket.send_json(
                    {"type": "error", "message": "Missing goal or token"}
                )
                return

            try:
                verify_token(token)
            except HTTPException as exc:
                await websocket.send_json(
                    {"type": "error", "message": exc.detail}
                )
                return

            await websocket.send_json(
                {"type": "status", "message": "Planning..."}
            )

            loop = asyncio.get_running_loop()

            def progress_callback(step_result, current_result):
                """Send step progress over WebSocket (called from worker thread)."""
                msg = {
                    "type": "step",
                    "order": step_result.step.order,
                    "title": step_result.step.title,
                    "passed": step_result.verification.passed,
                    "exit_code": step_result.execution.exit_code,
                    "summary": step_result.verification.summary,
                    "completed": current_result.completed_steps,
                    "total": current_result.total_steps,
                }
                future = asyncio.run_coroutine_threadsafe(
                    websocket.send_json(msg), loop
                )
                future.result(timeout=10)

            def run_goal():
                orchestrator = _build_orchestrator()
                result = orchestrator.run_from_goal(
                    goal, progress_callback=progress_callback
                )
                return result, orchestrator

            result, orchestrator = await asyncio.to_thread(run_goal)

            human_summary = build_human_summary(result)
            await websocket.send_json({
                "type": "complete",
                "status": result.status.value,
                "goal": goal,
                "total_steps": result.total_steps,
                "completed_steps": result.completed_steps,
                "failed_steps": result.failed_steps,
                "success_rate": result.success_rate,
                "errors": result.errors,
                "human_summary": {"en": human_summary.en, "vi": human_summary.vi},
            })

        except WebSocketDisconnect:
            pass
        except Exception as e:
            try:
                await websocket.send_json(
                    {"type": "error", "message": str(e)}
                )
            except Exception:
                pass

    # -- NLU endpoint --

    @gateway.post("/nlu/parse", response_model=NLUParseResponse)
    def nlu_parse(req: NLUParseRequest):
        """Parse a goal into intent, confidence, and entities."""
        from src.core.nlu import IntentClassifier

        classifier = IntentClassifier()
        result = classifier.classify(req.goal)
        return NLUParseResponse(
            intent=result.intent.value,
            confidence=result.confidence,
            entities=result.entities,
            suggested_recipe=result.suggested_recipe,
        )

    # -- Telegram bot integration --
    telegram_token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
    _bot = None

    if telegram_token:
        try:
            from src.core.telegram_bot import MekongBot
            from src.core.notifier import Notifier

            _bot = MekongBot(token=telegram_token)
            _notifier = Notifier(bot=_bot)
            _notifier.subscribe(get_event_bus())
        except ImportError:
            pass

    @gateway.on_event("startup")
    async def _startup_bot():
        if _bot:
            asyncio.create_task(_bot.start())

    @gateway.on_event("shutdown")
    async def _shutdown_bot():
        if _bot:
            await _bot.stop()

    @gateway.get("/telegram/status")
    def telegram_status():
        """Check Telegram bot status."""
        return {
            "running": _bot.is_running() if _bot else False,
            "configured": bool(telegram_token),
        }

    # -- Swarm endpoints --
    swarm_registry = SwarmRegistry()

    @gateway.post("/swarm/register", response_model=SwarmNodeInfo)
    def swarm_register(req: SwarmRegisterRequest):
        """Register a remote Mekong node in the swarm."""
        node = swarm_registry.register_node(
            name=req.name, host=req.host, port=req.port, token=req.token
        )
        return SwarmNodeInfo(
            id=node.id, name=node.name, host=node.host,
            port=node.port, status=node.status,
            last_heartbeat=node.last_heartbeat,
        )

    @gateway.get("/swarm/nodes", response_model=List[SwarmNodeInfo])
    def swarm_list_nodes():
        """List all registered swarm nodes with health status."""
        swarm_registry.check_all_health(timeout=2.0)
        return [
            SwarmNodeInfo(
                id=n.id, name=n.name, host=n.host, port=n.port,
                status=n.status, last_heartbeat=n.last_heartbeat,
            )
            for n in swarm_registry.list_nodes()
        ]

    @gateway.post("/swarm/dispatch")
    def swarm_dispatch(req: SwarmDispatchRequest):
        """Send a goal to a specific remote node."""
        node = swarm_registry.get_node(req.node_id)
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        bus = get_event_bus()
        bus.emit(EventType.GOAL_STARTED, {"node_id": req.node_id, "goal": req.goal})
        result = swarm_registry.dispatch_goal(req.node_id, req.goal)
        bus.emit(EventType.GOAL_COMPLETED, {"node_id": req.node_id, "result": result})
        return result

    @gateway.delete("/swarm/nodes/{node_id}")
    def swarm_remove_node(node_id: str):
        """Remove a node from the swarm."""
        removed = swarm_registry.remove_node(node_id)
        if not removed:
            raise HTTPException(status_code=404, detail="Node not found")
        return {"status": "removed", "node_id": node_id}

    # -- Schedule endpoints --
    scheduler = Scheduler()

    # -- Memory endpoints --
    memory_store = MemoryStore()

    @gateway.get("/memory/recent", response_model=List[MemoryEntryInfo])
    def memory_recent(limit: int = 20):
        """Get recent execution memory entries."""
        entries = memory_store.recent(limit)
        return [
            MemoryEntryInfo(
                goal=e.goal, status=e.status, timestamp=e.timestamp,
                duration_ms=e.duration_ms, error_summary=e.error_summary,
                recipe_used=e.recipe_used,
            )
            for e in entries
        ]

    @gateway.get("/memory/stats", response_model=MemoryStatsResponse)
    def memory_stats():
        """Get memory aggregate statistics."""
        s = memory_store.stats()
        return MemoryStatsResponse(**s)

    @gateway.get("/memory/search", response_model=List[MemoryEntryInfo])
    def memory_search(q: str = ""):
        """Search execution memory by goal pattern."""
        entries = memory_store.query(q) if q else memory_store.recent()
        return [
            MemoryEntryInfo(
                goal=e.goal, status=e.status, timestamp=e.timestamp,
                duration_ms=e.duration_ms, error_summary=e.error_summary,
                recipe_used=e.recipe_used,
            )
            for e in entries
        ]

    @gateway.post("/schedule/jobs", response_model=ScheduleJobInfo)
    def schedule_add_job(req: ScheduleAddRequest):
        """Add a new scheduled job."""
        job = scheduler.add_job(
            name=req.name,
            goal=req.goal,
            job_type=req.job_type,
            interval_seconds=req.interval_seconds,
            daily_time=req.daily_time,
        )
        return ScheduleJobInfo(
            id=job.id, name=job.name, goal=job.goal,
            job_type=job.job_type, interval_seconds=job.interval_seconds,
            daily_time=job.daily_time, enabled=job.enabled,
            last_run=job.last_run, next_run=job.next_run,
            run_count=job.run_count,
        )

    @gateway.get("/schedule/jobs", response_model=List[ScheduleJobInfo])
    def schedule_list_jobs():
        """List all scheduled jobs."""
        return [
            ScheduleJobInfo(
                id=j.id, name=j.name, goal=j.goal,
                job_type=j.job_type, interval_seconds=j.interval_seconds,
                daily_time=j.daily_time, enabled=j.enabled,
                last_run=j.last_run, next_run=j.next_run,
                run_count=j.run_count,
            )
            for j in scheduler.list_jobs()
        ]

    @gateway.delete("/schedule/jobs/{job_id}")
    def schedule_remove_job(job_id: str):
        """Remove a scheduled job."""
        removed = scheduler.remove_job(job_id)
        if not removed:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"status": "removed", "job_id": job_id}

    return gateway


# Module-level app instance for uvicorn
app = create_app()


__all__ = [
    "create_app",
    "app",
    "CommandRequest",
    "CommandResponse",
    "HealthResponse",
    "HumanSummary",
    "StepSummary",
    "PresetAction",
    "ProjectInfo",
    "SwarmNodeInfo",
    "SwarmRegisterRequest",
    "SwarmDispatchRequest",
    "ScheduleJobInfo",
    "ScheduleAddRequest",
    "MemoryEntryInfo",
    "MemoryStatsResponse",
    "NLUParseRequest",
    "NLUParseResponse",
    "PRESET_ACTIONS",
    "GATEWAY_CONFIG",
    "VERSION",
    "verify_token",
    "build_human_summary",
]
