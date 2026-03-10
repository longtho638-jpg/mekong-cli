"""Mekong CLI - Gateway Server (OpenClaw Hybrid Commander).

FastAPI server exposing the Plan-Execute-Verify engine via HTTP + WebSocket.
Includes "Washing Machine" dashboard for one-button operation.
Enables remote command execution: Cloud Ra Lenh + Local Thuc Thi.
"""

import asyncio
import contextlib
import json
import os
from collections.abc import AsyncGenerator
from dataclasses import asdict
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from src.core.event_bus import EventType, get_event_bus
from src.core.gateway.models import (
    AutoRecipeInfo,
    CommandRequest,
    CommandResponse,
    GovernanceCheckRequest,
    HaltRequest,
    HealthResponse,
    HumanSummary,
    MemoryEntryInfo,
    MemoryStatsResponse,
    NLUParseRequest,
    NLUParseResponse,
    PresetAction,
    ProjectInfo,
    RecipeGenerateRequest,
    RecipeGenerateResponse,
    RecipeValidateRequest,
    RecipeValidateResponse,
    ScheduleAddRequest,
    ScheduleJobInfo,
    StepSummary,
    SwarmDispatchRequest,
    SwarmNodeInfo,
    SwarmRegisterRequest,
)
from src.core.gateway_config import GatewayConfig, load_config
from src.core.gateway_dashboard import DASHBOARD_HTML
from src.core.llm_client import get_client
from src.core.memory import MemoryStore
from src.core.orchestrator import OrchestrationResult, RecipeOrchestrator
from src.core.scheduler import Scheduler
from src.core.swarm import SwarmRegistry

# -- Load config; export presets for backward compatibility --
GATEWAY_CONFIG: GatewayConfig = load_config()
PRESET_ACTIONS: list[dict[str, str]] = GATEWAY_CONFIG.presets

VERSION = "1.0.0"


# -- Token verification --

def verify_token(token: str) -> None:
    """Verify the provided token against MEKONG_API_TOKEN env var."""
    expected = os.environ.get("MEKONG_API_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=500,
            detail="MEKONG_API_TOKEN not configured on server",
        )
    import hmac as _hmac
    if not _hmac.compare_digest(token.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid token")


def build_human_summary(result: OrchestrationResult) -> HumanSummary:
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


def _scan_projects() -> list[ProjectInfo]:
    """Scan configured project paths for sub-projects."""
    projects: list[ProjectInfo] = []
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


def _build_orchestrator() -> RecipeOrchestrator:
    """Create a configured RecipeOrchestrator instance."""
    llm_client = get_client()
    return RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=True,
        enable_rollback=True,
    )


def _build_cmd_response(result: OrchestrationResult, goal: str, orchestrator: RecipeOrchestrator) -> CommandResponse:
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

    @contextlib.asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        """Manage Telegram bot lifecycle."""
        telegram_token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
        app.state.bot = None
        if telegram_token:
            try:
                from src.core.notifier import Notifier
                from src.core.telegram_bot import MekongBot

                app.state.bot = MekongBot(token=telegram_token)
                notifier = Notifier(bot=app.state.bot)
                notifier.subscribe(get_event_bus())
                asyncio.create_task(app.state.bot.start())
            except ImportError:
                pass
        yield
        if app.state.bot:
            await app.state.bot.stop()

    gateway = FastAPI(
        title="Mekong Gateway",
        description="OpenClaw Hybrid Commander — Cloud Ra Lenh, Local Thuc Thi",
        version=VERSION,
        lifespan=lifespan,
    )

    # CORS middleware - Configure allow_origins for production
    gateway.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Update to specific origins in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @gateway.get("/", response_class=HTMLResponse)
    def dashboard() -> HTMLResponse:
        """Serve the Washing Machine dashboard UI."""
        presets_json = json.dumps(PRESET_ACTIONS)
        html = DASHBOARD_HTML.replace("__PRESETS_JSON__", presets_json)
        html = html.replace("__VERSION__", f"v{VERSION}")
        return HTMLResponse(content=html)

    @gateway.get("/presets")
    def list_presets() -> list[PresetAction]:
        """List available one-button preset actions."""
        return [PresetAction(**p) for p in PRESET_ACTIONS]

    @gateway.get("/projects")
    def list_projects() -> list[ProjectInfo]:
        """List available sub-projects from apps/ directory."""
        return _scan_projects()

    @gateway.get("/health")
    def health_check() -> HealthResponse:
        """Health check endpoint."""
        return HealthResponse()

    @gateway.post("/cmd")
    def execute_command(req: CommandRequest) -> CommandResponse:
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
    async def ws_execute(websocket: WebSocket) -> None:
        """Execute a goal with real-time step-by-step progress streaming."""
        await websocket.accept()
        try:
            data = await websocket.receive_json()
            goal = data.get("goal", "")
            token = data.get("token", "")

            if not goal or not token:
                await websocket.send_json(
                    {"type": "error", "message": "Missing goal or token"},
                )
                return

            try:
                verify_token(token)
            except HTTPException as exc:
                await websocket.send_json(
                    {"type": "error", "message": exc.detail},
                )
                return

            await websocket.send_json(
                {"type": "status", "message": "Planning..."},
            )

            loop = asyncio.get_running_loop()

            def progress_callback(step_result: Any, current_result: Any) -> None:
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
                    websocket.send_json(msg), loop,
                )
                future.result(timeout=10)

            def run_goal() -> tuple[OrchestrationResult, RecipeOrchestrator]:
                """Execute the orchestration pipeline in a worker thread."""
                orchestrator = _build_orchestrator()
                result = orchestrator.run_from_goal(
                    goal, progress_callback=progress_callback,
                )
                return result, orchestrator

            result, _orchestrator = await asyncio.to_thread(run_goal)

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
            with contextlib.suppress(Exception):
                await websocket.send_json(
                    {"type": "error", "message": str(e)},
                )

    # -- NLU endpoint --

    @gateway.post("/nlu/parse")
    def nlu_parse(req: NLUParseRequest) -> NLUParseResponse:
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

    # -- Recipe generation endpoints --

    @gateway.post("/recipes/generate")
    def recipes_generate(req: RecipeGenerateRequest) -> RecipeGenerateResponse:
        """Generate a recipe from a goal pattern."""
        from src.core.recipe_gen import RecipeGenerator

        gen = RecipeGenerator()
        recipe = gen.from_goal_pattern(req.goal, req.steps or None)
        path = gen.save_recipe(recipe) if recipe.valid else ""
        return RecipeGenerateResponse(
            name=recipe.name, content=recipe.content,
            source=recipe.source, valid=recipe.valid, path=path,
        )

    @gateway.get("/recipes/auto")
    def recipes_auto_list() -> list[AutoRecipeInfo]:
        """List auto-generated recipes."""
        from src.core.recipe_gen import RecipeGenerator

        gen = RecipeGenerator()
        return [AutoRecipeInfo(**r) for r in gen.list_auto_recipes()]

    @gateway.post("/recipes/validate")
    def recipes_validate(req: RecipeValidateRequest) -> RecipeValidateResponse:
        """Validate recipe markdown content."""
        from src.core.recipe_gen import RecipeGenerator

        gen = RecipeGenerator()
        valid, errors = gen.validate_recipe(req.content)
        return RecipeValidateResponse(valid=valid, errors=errors)

    @gateway.get("/telegram/status")
    def telegram_status() -> dict[str, Any]:
        """Check Telegram bot status."""
        bot = getattr(gateway.state, "bot", None)
        return {
            "running": bot.is_running() if bot else False,
            "configured": bool(os.environ.get("MEKONG_TELEGRAM_TOKEN", "")),
        }

    # -- Swarm endpoints --
    swarm_registry = SwarmRegistry()

    @gateway.post("/swarm/register")
    def swarm_register(req: SwarmRegisterRequest) -> SwarmNodeInfo:
        """Register a remote Mekong node in the swarm."""
        from datetime import datetime
        node = swarm_registry.register_node(
            name=req.name, host=req.host, port=req.port, token=req.token,
        )
        return SwarmNodeInfo(
            id=node.id, name=node.name, host=node.host,
            port=node.port, token=req.token,
            registered_at=datetime.now().isoformat(),
            last_seen=datetime.now().isoformat(),
            status=node.status,
        )

    @gateway.get("/swarm/nodes")
    def swarm_list_nodes() -> list[SwarmNodeInfo]:
        """List all registered swarm nodes with health status."""
        swarm_registry.check_all_health(timeout=2.0)
        from datetime import datetime
        return [
            SwarmNodeInfo(
                id=n.id, name=n.name, host=n.host, port=n.port,
                token=n.token,
                registered_at=datetime.fromtimestamp(n.last_heartbeat).isoformat() if n.last_heartbeat > 0 else datetime.now().isoformat(),
                last_seen=datetime.fromtimestamp(n.last_heartbeat).isoformat() if n.last_heartbeat > 0 else "never",
                status=n.status,
            )
            for n in swarm_registry.list_nodes()
        ]

    @gateway.post("/swarm/dispatch")
    def swarm_dispatch(req: SwarmDispatchRequest) -> Any:
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
    def swarm_remove_node(node_id: str) -> dict[str, str]:
        """Remove a node from the swarm."""
        removed = swarm_registry.remove_node(node_id)
        if not removed:
            raise HTTPException(status_code=404, detail="Node not found")
        return {"status": "removed", "node_id": node_id}

    # -- Schedule endpoints --
    scheduler = Scheduler()

    # -- Memory endpoints --
    memory_store = MemoryStore()

    @gateway.get("/memory/recent")
    def memory_recent(limit: int = 20) -> list[MemoryEntryInfo]:
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

    @gateway.get("/memory/stats")
    def memory_stats() -> MemoryStatsResponse:
        """Get memory aggregate statistics."""
        s = memory_store.stats()
        return MemoryStatsResponse(**s)

    @gateway.get("/memory/search")
    def memory_search(q: str = "") -> list[MemoryEntryInfo]:
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

    @gateway.post("/schedule/jobs")
    def schedule_add_job(req: ScheduleAddRequest) -> ScheduleJobInfo:
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

    @gateway.get("/schedule/jobs")
    def schedule_list_jobs() -> list[ScheduleJobInfo]:
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
    def schedule_remove_job(job_id: str) -> dict[str, str]:
        """Remove a scheduled job."""
        removed = scheduler.remove_job(job_id)
        if not removed:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"status": "removed", "job_id": job_id}

    # -- Autonomous / Governance endpoints (L14) --

    @gateway.get("/autonomous/consciousness")
    def consciousness() -> dict[str, Any]:
        """Get Consciousness Score and subsystem health."""
        from src.core.autonomous import AutonomousEngine

        engine = AutonomousEngine()
        report = engine.get_consciousness()
        return {
            "score": report.score,
            "memory_health": report.memory_health,
            "nlu_health": report.nlu_health,
            "router_health": report.router_health,
            "executor_health": report.executor_health,
            "learner_health": report.learner_health,
            "evolution_health": report.evolution_health,
            "governance_health": report.governance_health,
        }

    @gateway.post("/governance/check")
    def governance_check(req: GovernanceCheckRequest) -> dict[str, Any]:
        """Classify a goal's safety level."""
        from src.core.governance import Governance

        gov = Governance()
        decision = gov.classify(req.goal)
        return {
            "action_class": decision.action_class.value,
            "reason": decision.reason,
            "requires_approval": decision.requires_approval,
        }

    @gateway.get("/governance/audit")
    def governance_audit(limit: int = 50) -> list[dict[str, Any]]:
        """Get recent audit trail entries."""
        from src.core.governance import Governance

        gov = Governance()
        entries = gov.get_audit_trail(limit)
        return [
            {
                "timestamp": e.timestamp,
                "goal": e.goal,
                "action_class": e.action_class,
                "approved": e.approved,
                "result": e.result,
            }
            for e in entries
        ]

    @gateway.post("/halt")
    def halt_system(req: HaltRequest) -> dict[str, str]:
        """Emergency halt all autonomous operations."""
        server_token = os.environ.get("MEKONG_API_TOKEN", "")
        if not server_token:
            raise HTTPException(status_code=500, detail="MEKONG_API_TOKEN not configured")
        import hmac as _hmac
        if not _hmac.compare_digest(req.token.encode(), server_token.encode()):
            raise HTTPException(status_code=401, detail="Invalid token")

        from src.core.governance import Governance

        gov = Governance()
        gov.halt()
        return {"status": "halted", "message": "All autonomous operations stopped."}

    # -- AGI daemon proxy endpoints --

    @gateway.get("/api/agi/health")
    async def agi_health() -> dict[str, Any]:
        """Proxy to Tom Hum health endpoint (port 9090)."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get("http://127.0.0.1:9090/health", timeout=5.0)
                result: dict[str, Any] = resp.json()
                return result
        except (httpx.ConnectError, httpx.TimeoutException):
            return {"error": "AGI daemon not reachable", "status": "offline"}

    @gateway.get("/api/agi/metrics")
    async def agi_metrics() -> dict[str, Any]:
        """Proxy to Tom Hum metrics endpoint (port 9090)."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get("http://127.0.0.1:9090/metrics", timeout=5.0)
                result: dict[str, Any] = resp.json()
                return result
        except (httpx.ConnectError, httpx.TimeoutException):
            return {"error": "AGI daemon not reachable", "status": "offline"}

    return gateway


# Module-level app instance for uvicorn
app = create_app()

# Mount RaaS /v1/ router
from src.api.raas_router import router as _raas_router  # noqa: E402

app.include_router(_raas_router)

# Mount Tier Config API routes
from src.api.tier_config_routes import router as _tier_config_router  # noqa: E402

app.include_router(_tier_config_router)

# Mount Quota Status API routes
from src.api.quota_status_endpoints import quota_router as _quota_router  # noqa: E402

app.include_router(_quota_router)


__all__ = [
    "GATEWAY_CONFIG",
    "PRESET_ACTIONS",
    "VERSION",
    "AutoRecipeInfo",
    "CommandRequest",
    "CommandResponse",
    "GovernanceCheckRequest",
    "HaltRequest",
    "HealthResponse",
    "HumanSummary",
    "MemoryEntryInfo",
    "MemoryStatsResponse",
    "NLUParseRequest",
    "NLUParseResponse",
    "PresetAction",
    "ProjectInfo",
    "RecipeGenerateRequest",
    "RecipeGenerateResponse",
    "RecipeValidateRequest",
    "RecipeValidateResponse",
    "ScheduleAddRequest",
    "ScheduleJobInfo",
    "StepSummary",
    "SwarmDispatchRequest",
    "SwarmNodeInfo",
    "SwarmRegisterRequest",
    "app",
    "build_human_summary",
    "create_app",
    "verify_token",
]
