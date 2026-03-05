"""
Mekong CLI - Tiered Telemetry Store

Tiered storage for telemetry data with configurable retention.
"""

import json
import time
from dataclasses import asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from .telemetry_models import ExecutionTrace


class TieredTelemetryStore:
    """
    Tiered telemetry storage with retention policies.

    Tier 0: Full step-level traces (retention: 14 days)
    Tier 1: Phase summaries (retention: 90 days)
    Tier 2: Project archives (retention: 365 days)
    """

    TIER_RETENTION_DAYS = {0: 14, 1: 90, 2: 365}

    def __init__(self, base_dir: Optional[str] = None) -> None:
        """Initialize tiered store with base directory."""
        self._base = Path(base_dir) if base_dir else Path(".mekong/telemetry")

    def _tier_dir(self, tier: int) -> Path:
        """Get directory for a specific tier."""
        return self._base / f"tier{tier}"

    def store_trace(self, trace: ExecutionTrace) -> Path:
        """Store a full trace in Tier 0 (per-step detail)."""
        tier_dir = self._tier_dir(0)
        tier_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        path = tier_dir / f"trace-{timestamp}.json"

        def _serialize_obj(obj: Any) -> Any:
            if isinstance(obj, (int, float, str, bool, type(None))):
                return obj
            elif isinstance(obj, (list, tuple)):
                return [_serialize_obj(item) for item in obj]
            elif isinstance(obj, dict):
                return {key: _serialize_obj(value) for key, value in obj.items()}
            elif hasattr(obj, "__dataclass_fields__"):
                result = {}
                for field_name in obj.__dataclass_fields__:
                    field_value = getattr(obj, field_name)
                    if field_value is trace:
                        return {"__ref__": "circular_reference"}
                    result[field_name] = _serialize_obj(field_value)
                return result
            else:
                return str(obj)

        trace_dict = _serialize_obj(asdict(trace))
        path.write_text(json.dumps(trace_dict, indent=2))
        return path

    def summarize_to_tier1(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """Compress trace to Tier 1 phase summary (strip step details)."""
        summary: Dict[str, Any] = {
            "goal": trace.goal,
            "total_duration": trace.total_duration,
            "step_count": len(trace.steps),
            "success_count": sum(1 for s in trace.steps if s.exit_code == 0),
            "llm_calls": trace.llm_calls,
            "error_count": len(trace.errors),
            "self_healed": sum(1 for s in trace.steps if s.self_healed),
            "timestamp": datetime.now().isoformat(),
        }
        tier_dir = self._tier_dir(1)
        tier_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d")
        path = tier_dir / f"summary-{date_str}.jsonl"
        with open(path, "a") as f:
            f.write(json.dumps(summary) + "\n")
        return summary

    def compact_to_tier2(self) -> int:
        """Compact Tier 1 summaries into Tier 2 monthly archives."""
        tier1_dir = self._tier_dir(1)
        tier2_dir = self._tier_dir(2)
        tier2_dir.mkdir(parents=True, exist_ok=True)

        if not tier1_dir.exists():
            return 0

        compacted = 0
        cutoff = datetime.now() - timedelta(days=self.TIER_RETENTION_DAYS[1])

        for summary_file in sorted(tier1_dir.glob("summary-*.jsonl")):
            try:
                date_part = summary_file.stem.split("-", 1)[1]
                file_date = datetime.strptime(date_part, "%Y%m%d")
            except (ValueError, IndexError):
                continue

            if file_date < cutoff:
                month_key = file_date.strftime("%Y%m")
                archive_path = tier2_dir / f"archive-{month_key}.jsonl"
                content = summary_file.read_text()
                with open(archive_path, "a") as f:
                    f.write(content)
                summary_file.unlink()
                compacted += 1

        return compacted

    def cleanup_expired(self) -> int:
        """Remove traces that exceed their tier retention period."""
        removed = 0
        for tier, days in self.TIER_RETENTION_DAYS.items():
            tier_dir = self._tier_dir(tier)
            if not tier_dir.exists():
                continue
            cutoff = time.time() - (days * 86400)
            for f in tier_dir.iterdir():
                if f.is_file() and f.stat().st_mtime < cutoff:
                    f.unlink()
                    removed += 1
        return removed

    def get_recent_summaries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Read recent Tier 1 summaries."""
        tier1_dir = self._tier_dir(1)
        if not tier1_dir.exists():
            return []

        entries: List[Dict[str, Any]] = []
        for f in sorted(tier1_dir.glob("summary-*.jsonl"), reverse=True):
            for line in reversed(f.read_text().strip().splitlines()):
                if line.strip():
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
                    if len(entries) >= limit:
                        return entries
        return entries


__all__ = ["TieredTelemetryStore"]
