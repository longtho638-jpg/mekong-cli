"""PEV Dashboard Data — Phase 7 Telemetry.

Provides pipeline execution history for dashboard visualization.
Reads from PEVMetricsCollector and disk-persisted pipeline files.

Usage:
    from src.core.pev_dashboard_data import get_dashboard_data
    dashboard = get_dashboard_data()
    overview = dashboard.get_overview()
    history = dashboard.get_execution_history(limit=20)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from .pev_metrics_collector import PEVMetricsCollector, get_pev_metrics


class PEVDashboardData:
    """Provides queryable dashboard data for PEV pipeline history.

    Combines in-memory metrics with disk-persisted history.
    """

    def __init__(
        self,
        metrics: Optional[PEVMetricsCollector] = None,
        storage_dir: Optional[str] = None,
    ) -> None:
        self._metrics = metrics or get_pev_metrics()
        self._storage_dir = (
            Path(storage_dir) if storage_dir
            else Path.home() / ".mekong" / "metrics"
        )

    def get_overview(self) -> dict[str, Any]:
        """Get high-level dashboard overview.

        Returns:
            Dict with global metrics + recent pipeline summaries.
        """
        global_metrics = self._metrics.get_global_metrics()
        recent = self._metrics.get_recent_pipelines(limit=5)
        return {
            "global": global_metrics,
            "recent_pipelines": recent,
        }

    def get_execution_history(self, limit: int = 20) -> list[dict[str, Any]]:
        """Get pipeline execution history from memory and disk.

        Args:
            limit: Max pipelines to return.

        Returns:
            List of pipeline summaries, newest first.
        """
        # First get from in-memory
        results = self._metrics.get_recent_pipelines(limit=limit)
        seen_ids = {r["pipeline_id"] for r in results}

        # Fill from disk if needed
        if len(results) < limit and self._storage_dir.exists():
            disk_files = sorted(
                self._storage_dir.glob("*.json"),
                key=lambda f: f.stat().st_mtime,
                reverse=True,
            )
            for filepath in disk_files:
                if len(results) >= limit:
                    break
                try:
                    data = json.loads(filepath.read_text())
                    pid = data.get("pipeline_id", filepath.stem)
                    if pid not in seen_ids:
                        results.append(data)
                        seen_ids.add(pid)
                except (json.JSONDecodeError, OSError):
                    continue

        return results[:limit]

    def get_pipeline_detail(self, pipeline_id: str) -> Optional[dict[str, Any]]:
        """Get detailed metrics for a specific pipeline.

        Args:
            pipeline_id: Pipeline identifier.

        Returns:
            Pipeline summary dict or None if not found.
        """
        # Check in-memory first
        summary = self._metrics.get_pipeline_summary(pipeline_id)
        if summary:
            return summary

        # Try disk
        filepath = self._storage_dir / f"{pipeline_id}.json"
        if filepath.exists():
            try:
                result: dict[str, Any] = json.loads(filepath.read_text())
                return result
            except (json.JSONDecodeError, OSError):
                return None
        return None

    def get_success_rate_trend(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get success rate trend over recent pipelines.

        Args:
            limit: Number of recent pipelines to include.

        Returns:
            List of {pipeline_id, success_rate, timestamp} entries.
        """
        history = self.get_execution_history(limit=limit)
        return [
            {
                "pipeline_id": p["pipeline_id"],
                "success_rate": p.get("success_rate", 0.0),
                "duration_ms": p.get("duration_ms", 0.0),
                "status": p.get("status", "unknown"),
                "start_time": p.get("start_time"),
            }
            for p in history
        ]


# Singleton
_dashboard_data: Optional[PEVDashboardData] = None


def get_dashboard_data() -> PEVDashboardData:
    """Get singleton PEVDashboardData instance."""
    global _dashboard_data
    if _dashboard_data is None:
        _dashboard_data = PEVDashboardData()
    return _dashboard_data


def reset_dashboard_data() -> None:
    """Reset singleton (for testing)."""
    global _dashboard_data
    _dashboard_data = None
