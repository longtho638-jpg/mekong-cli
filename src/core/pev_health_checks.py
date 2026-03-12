"""PEV Health Checks — Phase 7 Telemetry.

Registers PEV-specific component health checks with the health endpoint.
Monitors pipeline success rate, active pipelines, and metrics collector status.

Usage:
    from src.core.pev_health_checks import register_pev_health_checks
    register_pev_health_checks()
"""

from __future__ import annotations

from typing import Any

from .health_endpoint import ComponentStatus, register_component_check
from .pev_metrics_collector import get_pev_metrics


def check_pev_engine() -> ComponentStatus:
    """Check PEV engine health based on recent pipeline metrics."""
    metrics = get_pev_metrics()
    global_metrics = metrics.get_global_metrics()

    total = global_metrics["total_pipelines"]
    if total == 0:
        return ComponentStatus(
            status="healthy",
            message="No pipelines executed yet",
        )

    success_rate = global_metrics["overall_success_rate"]
    active = global_metrics["active_pipelines"]

    if success_rate < 0.5:
        return ComponentStatus(
            status="unhealthy",
            message=f"Low success rate: {success_rate:.1%} ({total} pipelines)",
        )

    if success_rate < 0.8:
        return ComponentStatus(
            status="degraded",
            message=f"Success rate: {success_rate:.1%} ({total} pipelines)",
        )

    return ComponentStatus(
        status="healthy",
        message=f"Success rate: {success_rate:.1%}, {active} active",
        latency_ms=global_metrics.get("avg_duration_ms"),
    )


def check_pipeline_activity() -> ComponentStatus:
    """Check for stuck/long-running pipelines."""
    metrics = get_pev_metrics()
    global_metrics = metrics.get_global_metrics()
    active = global_metrics["active_pipelines"]

    if active > 5:
        return ComponentStatus(
            status="degraded",
            message=f"{active} active pipelines (possible backlog)",
        )

    return ComponentStatus(
        status="healthy",
        message=f"{active} active pipeline(s)",
    )


def check_retry_rate() -> ComponentStatus:
    """Check if retry rate indicates systemic issues."""
    metrics = get_pev_metrics()
    global_metrics = metrics.get_global_metrics()

    total_retries = global_metrics["total_retries"]
    total_pipelines = global_metrics["total_pipelines"]

    if total_pipelines == 0:
        return ComponentStatus(status="healthy", message="No data")

    retry_per_pipeline = total_retries / total_pipelines

    if retry_per_pipeline > 3.0:
        return ComponentStatus(
            status="unhealthy",
            message=f"High retry rate: {retry_per_pipeline:.1f}/pipeline",
        )

    if retry_per_pipeline > 1.0:
        return ComponentStatus(
            status="degraded",
            message=f"Elevated retry rate: {retry_per_pipeline:.1f}/pipeline",
        )

    return ComponentStatus(
        status="healthy",
        message=f"Retry rate: {retry_per_pipeline:.1f}/pipeline",
    )


def register_pev_health_checks() -> None:
    """Register all PEV health checks with the health endpoint."""
    register_component_check("pev_engine", check_pev_engine)
    register_component_check("pipeline_activity", check_pipeline_activity)
    register_component_check("retry_rate", check_retry_rate)


def get_pev_health_summary() -> dict[str, Any]:
    """Get PEV health summary without HTTP server."""
    return {
        "pev_engine": check_pev_engine().model_dump(),
        "pipeline_activity": check_pipeline_activity().model_dump(),
        "retry_rate": check_retry_rate().model_dump(),
    }
