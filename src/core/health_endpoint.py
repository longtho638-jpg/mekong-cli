"""
Mekong CLI - Health Endpoint Server.

FastAPI-based HTTP health endpoint providing real-time system status.
GET /health returns JSON with status, components, timestamp, version.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from src.core.event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)


class ComponentStatus(BaseModel):
    """Status of a single component."""

    status: str  # "healthy", "degraded", "unhealthy"
    message: str | None = None
    latency_ms: float | None = None


class HealthResponse(BaseModel):
    """Health endpoint response schema."""

    status: str  # "healthy", "degraded", "unhealthy"
    components: dict[str, ComponentStatus]
    timestamp: str
    version: str
    uptime_seconds: float | None = None


# Global state
_startup_time: float | None = None
_server_instance: uvicorn.Server | None = None
_component_checks: dict[str, callable] = {}


def register_component_check(
    name: str,
    check_fn: callable,
) -> None:
    """Register a health check function for a component.

    Args:
        name: Component name (e.g., "license", "usage", "crash_detector")
        check_fn: Function that returns ComponentStatus
    """
    _component_checks[name] = check_fn
    logger.info(f"Registered health check for component: {name}")


def unregister_component_check(name: str) -> bool:
    """Unregister a component health check.

    Args:
        name: Component name to remove

    Returns:
        True if component was registered and removed
    """
    removed = _component_checks.pop(name, None) is not None
    if removed:
        logger.info(f"Unregistered health check for component: {name}")
    return removed


def _check_component(name: str) -> ComponentStatus:
    """Execute health check for a component.

    Args:
        name: Component name to check

    Returns:
        ComponentStatus with health state
    """
    check_fn = _component_checks.get(name)
    if not check_fn:
        return ComponentStatus(
            status="unknown",
            message=f"No health check registered for '{name}'",
        )

    try:
        return check_fn()
    except Exception as e:
        logger.exception(f"Health check failed for component '{name}': {e}")
        return ComponentStatus(
            status="unhealthy",
            message=f"Check failed: {str(e)}",
        )


def _compute_overall_status(
    components: dict[str, ComponentStatus],
) -> str:
    """Compute overall health status from component statuses.

    Args:
        components: Dict of component name to ComponentStatus

    Returns:
        Overall status string
    """
    statuses = [c.status for c in components.values()]

    if all(s == "healthy" for s in statuses):
        return "healthy"
    if any(s == "unhealthy" for s in statuses):
        return "unhealthy"
    return "degraded"


def create_health_app() -> FastAPI:
    """Create FastAPI application for health endpoint.

    Returns:
        Configured FastAPI application
    """
    app = FastAPI(
        title="Mekong CLI Health",
        description="Health endpoint for Mekong CLI system monitoring",
        version="3.0.0",
    )

    @app.get("/health", response_model=HealthResponse)
    async def get_health() -> HealthResponse:
        """Get system health status.

        Returns health status with component checks, timestamp, and version.
        """
        components: dict[str, ComponentStatus] = {}

        for name in _component_checks:
            components[name] = _check_component(name)

        overall_status = _compute_overall_status(components)

        uptime = None
        if _startup_time is not None:
            uptime = datetime.now(timezone.utc).timestamp() - _startup_time

        return HealthResponse(
            status=overall_status,
            components=components,
            timestamp=datetime.now(timezone.utc).isoformat(),
            version="3.0.0",
            uptime_seconds=uptime,
        )

    @app.get("/ready")
    async def get_readiness() -> dict[str, Any]:
        """Kubernetes-style readiness probe.

        Returns ready status for load balancer integration.
        """
        components: dict[str, ComponentStatus] = {}
        for name in _component_checks:
            components[name] = _check_component(name)

        is_ready = all(
            c.status in ("healthy", "unknown")
            for c in components.values()
        )

        return {
            "ready": is_ready,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/live")
    async def get_liveness() -> dict[str, Any]:
        """Kubernetes-style liveness probe.

        Returns alive status for container health checks.
        """
        return {
            "alive": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return app


def start_health_server(
    host: str = "127.0.0.1",
    port: int = 9192,
    log_level: str = "warning",
) -> uvicorn.Server:
    """Start health endpoint server.

    Args:
        host: Host to bind server (default: 127.0.0.1)
        port: Port to listen on (default: 9192)
        log_level: Logging level (default: warning)

    Returns:
        Uvicorn server instance
    """
    global _startup_time, _server_instance

    app = create_health_app()

    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        log_level=log_level,
        access_log=False,
    )

    server = uvicorn.Server(config)

    # Start server in background task
    import threading

    def run_server() -> None:
        global _startup_time
        _startup_time = datetime.now(timezone.utc).timestamp()
        _server_instance = server
        logger.info(f"Health endpoint started at http://{host}:{port}")
        get_event_bus().emit(
            EventType.COLLECTOR_DISCOVERED,
            {
                "type": "health_endpoint",
                "host": host,
                "port": port,
                "url": f"http://{host}:{port}/health",
            },
        )
        server.run()

    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()

    # Wait for server to start
    import time
    time.sleep(0.5)

    return server


def stop_health_server() -> None:
    """Stop health endpoint server gracefully."""
    global _server_instance, _startup_time

    if _server_instance is not None:
        logger.info("Stopping health endpoint server...")
        _server_instance.should_exit = True
        _server_instance = None
        _startup_time = None
        logger.info("Health endpoint server stopped")


def get_health_url(host: str = "127.0.0.1", port: int = 9192) -> str:
    """Get health endpoint URL.

    Args:
        host: Server host
        port: Server port

    Returns:
        Full health endpoint URL
    """
    return f"http://{host}:{port}/health"


__all__ = [
    "HealthResponse",
    "ComponentStatus",
    "register_component_check",
    "unregister_component_check",
    "start_health_server",
    "stop_health_server",
    "get_health_url",
    "create_health_app",
]
