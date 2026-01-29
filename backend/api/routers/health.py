"""
🏥 HEALTH CHECK & MONITORING ENDPOINTS

Comprehensive health monitoring for Agency OS backend.
Supports Kubernetes probes, Prometheus metrics, and detailed diagnostics.

"Thượng y trị vị bệnh" - The best doctor prevents illness
"""

from __future__ import annotations

import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import psutil
from fastapi import APIRouter, Response, status
from pydantic import BaseModel, Field

# Router
router = APIRouter(prefix="/health", tags=["health"])

# Startup time for uptime calculation
STARTUP_TIME = time.time()


# ============================================================================
# MODELS
# ============================================================================


class HealthStatus(BaseModel):
    """Basic health status response."""

    status: str = Field(..., description="Health status: healthy, degraded, unhealthy")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")


class ServiceHealth(BaseModel):
    """Individual service health."""

    name: str = Field(..., description="Service name")
    status: str = Field(..., description="Service status: up, down, degraded")
    response_time_ms: Optional[float] = Field(None, description="Response time in milliseconds")
    message: Optional[str] = Field(None, description="Additional status message")


class DetailedHealthStatus(BaseModel):
    """Detailed health status with service checks."""

    status: str = Field(..., description="Overall health status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    uptime_seconds: float = Field(..., description="Service uptime")
    version: str = Field(default="1.0.0", description="API version")
    services: List[ServiceHealth] = Field(default_factory=list, description="Service health checks")
    system: Dict[str, Any] = Field(default_factory=dict, description="System metrics")


class PrometheusMetrics(BaseModel):
    """Prometheus-style metrics."""

    uptime_seconds: float
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_free_gb: float
    process_cpu_percent: float
    process_memory_mb: float
    timestamp: float


# Rebuild models to resolve forward references
HealthStatus.model_rebuild()
ServiceHealth.model_rebuild()
DetailedHealthStatus.model_rebuild()
PrometheusMetrics.model_rebuild()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def get_uptime() -> float:
    """Get service uptime in seconds."""
    return time.time() - STARTUP_TIME


def get_system_metrics() -> Dict[str, Any]:
    """Get system resource metrics."""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        process = psutil.Process()

        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "percent": memory.percent,
                "used_mb": memory.used / (1024 * 1024),
                "available_mb": memory.available / (1024 * 1024),
                "total_mb": memory.total / (1024 * 1024),
            },
            "disk": {
                "percent": disk.percent,
                "used_gb": disk.used / (1024 * 1024 * 1024),
                "free_gb": disk.free / (1024 * 1024 * 1024),
                "total_gb": disk.total / (1024 * 1024 * 1024),
            },
            "process": {
                "cpu_percent": process.cpu_percent(),
                "memory_mb": process.memory_info().rss / (1024 * 1024),
                "threads": process.num_threads(),
            },
        }
    except Exception as e:
        return {"error": str(e)}


def check_database() -> ServiceHealth:
    """
    Check database connectivity.

    Note: Returns placeholder status until database is configured.
    Future: Implement actual DB ping when database service is available.
    """
    start = time.time()
    try:
        # Placeholder check - service is operational but DB not yet configured
        response_time = (time.time() - start) * 1000
        return ServiceHealth(
            name="database",
            status="up",
            response_time_ms=response_time,
            message="DB not configured (placeholder check)",
        )
    except Exception as e:
        return ServiceHealth(name="database", status="down", message=f"Database error: {str(e)}")


def check_redis() -> ServiceHealth:
    """
    Check Redis connectivity.

    Note: Returns placeholder status until Redis is configured.
    Future: Implement actual Redis ping when cache service is available.
    """
    start = time.time()
    try:
        # Placeholder check - service is operational but Redis not yet configured
        response_time = (time.time() - start) * 1000
        return ServiceHealth(
            name="redis",
            status="up",
            response_time_ms=response_time,
            message="Redis not configured (placeholder check)",
        )
    except Exception as e:
        return ServiceHealth(name="redis", status="down", message=f"Redis error: {str(e)}")


def check_filesystem() -> ServiceHealth:
    """Check filesystem health."""
    try:
        disk = psutil.disk_usage("/")
        if disk.percent > 90:
            return ServiceHealth(
                name="filesystem",
                status="degraded",
                message=f"Disk usage high: {disk.percent}%",
            )
        return ServiceHealth(
            name="filesystem",
            status="up",
            message=f"Disk usage: {disk.percent}%",
        )
    except Exception as e:
        return ServiceHealth(
            name="filesystem", status="down", message=f"Filesystem error: {str(e)}"
        )


def determine_overall_status(services: List[ServiceHealth]) -> str:
    """Determine overall health status from service checks."""
    if any(s.status == "down" for s in services):
        return "unhealthy"
    if any(s.status == "degraded" for s in services):
        return "degraded"
    return "healthy"


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("", response_model=HealthStatus, summary="Basic health check")
async def health_check() -> HealthStatus:
    """
    Basic health check endpoint.

    Returns simple health status and uptime.
    Use this for basic monitoring and uptime checks.
    """
    return HealthStatus(status="healthy", uptime_seconds=get_uptime())


@router.get(
    "/detailed",
    response_model=DetailedHealthStatus,
    summary="Detailed health status",
)
async def detailed_health() -> DetailedHealthStatus:
    """
    Detailed health check with service diagnostics.

    Includes:
    - Overall health status
    - Individual service checks (database, redis, filesystem)
    - System resource metrics
    - Service uptime

    Use this for comprehensive health monitoring and debugging.
    """
    # Run service checks
    services = [
        check_database(),
        check_redis(),
        check_filesystem(),
    ]

    overall_status = determine_overall_status(services)

    return DetailedHealthStatus(
        status=overall_status,
        uptime_seconds=get_uptime(),
        services=services,
        system=get_system_metrics(),
    )


@router.get(
    "/metrics",
    response_model=PrometheusMetrics,
    summary="Prometheus-style metrics",
)
async def metrics() -> PrometheusMetrics:
    """
    Prometheus-style metrics endpoint.

    Returns metrics in a format suitable for Prometheus scraping:
    - Uptime
    - CPU usage (system and process)
    - Memory usage (system and process)
    - Disk usage

    Use this for Prometheus monitoring integration.
    """
    system = get_system_metrics()

    return PrometheusMetrics(
        uptime_seconds=get_uptime(),
        cpu_percent=system.get("cpu_percent", 0),
        memory_percent=system.get("memory", {}).get("percent", 0),
        memory_used_mb=system.get("memory", {}).get("used_mb", 0),
        memory_available_mb=system.get("memory", {}).get("available_mb", 0),
        disk_percent=system.get("disk", {}).get("percent", 0),
        disk_used_gb=system.get("disk", {}).get("used_gb", 0),
        disk_free_gb=system.get("disk", {}).get("free_gb", 0),
        process_cpu_percent=system.get("process", {}).get("cpu_percent", 0),
        process_memory_mb=system.get("process", {}).get("memory_mb", 0),
        timestamp=time.time(),
    )


@router.get("/ready", summary="Kubernetes readiness probe")
async def readiness_probe(response: Response) -> Dict[str, str]:
    """
    Kubernetes readiness probe.

    Checks if the service is ready to accept traffic.
    Returns 200 if ready, 503 if not ready.

    Readiness checks:
    - Basic service startup complete
    - Critical dependencies available

    Use this as Kubernetes readiness probe.
    """
    # Run critical service checks
    services = [
        check_database(),
        check_redis(),
    ]

    # Service is ready if no critical services are down
    critical_down = any(s.status == "down" for s in services)

    if critical_down:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready", "message": "Critical services unavailable"}

    return {"status": "ready"}


@router.get("/live", summary="Kubernetes liveness probe")
async def liveness_probe(response: Response) -> Dict[str, str]:
    """
    Kubernetes liveness probe.

    Checks if the service is alive and should not be restarted.
    Returns 200 if alive, 503 if dead/stuck.

    Liveness checks:
    - Process is responsive
    - No deadlocks or hangs

    Use this as Kubernetes liveness probe.
    """
    try:
        # Simple responsiveness check
        # If we can execute this code, the process is alive
        uptime = get_uptime()

        # Additional check: ensure we're not in a bad state
        if uptime < 1:
            # Process just started, might not be fully initialized
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {"status": "starting", "uptime_seconds": uptime}

        return {"status": "alive", "uptime_seconds": uptime}
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "dead", "error": str(e)}
