"""Tests for Tiered Telemetry Storage (Netdata DBENGINE-inspired)."""

import json
import pytest
from src.core.telemetry import (
    ExecutionTrace,
    StepTrace,
    TelemetryCollector,
    TieredTelemetryStore,
)


class TestTieredTelemetryStore:
    """Test tiered storage: Tier 0 (full), Tier 1 (summary), Tier 2 (archive)."""

    def _make_trace(self, goal: str = "test goal") -> ExecutionTrace:
        return ExecutionTrace(
            goal=goal,
            steps=[
                StepTrace(step_order=1, title="step1", duration_seconds=1.5, exit_code=0),
                StepTrace(step_order=2, title="step2", duration_seconds=2.0, exit_code=0,
                          self_healed=True),
                StepTrace(step_order=3, title="step3", duration_seconds=0.5, exit_code=1),
            ],
            total_duration=4.0,
            llm_calls=2,
            errors=["step3 failed"],
        )

    def test_store_trace_tier0(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        trace = self._make_trace()
        path = store.store_trace(trace)
        assert path.exists()
        data = json.loads(path.read_text())
        assert data["goal"] == "test goal"
        assert len(data["steps"]) == 3

    def test_summarize_to_tier1(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        trace = self._make_trace()
        summary = store.summarize_to_tier1(trace)
        assert summary["goal"] == "test goal"
        assert summary["step_count"] == 3
        assert summary["success_count"] == 2
        assert summary["self_healed"] == 1
        assert summary["error_count"] == 1
        assert summary["llm_calls"] == 2
        # Check file exists
        tier1_dir = tmp_path / "tier1"
        assert tier1_dir.exists()
        jsonl_files = list(tier1_dir.glob("summary-*.jsonl"))
        assert len(jsonl_files) == 1

    def test_summarize_appends_to_same_day(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        store.summarize_to_tier1(self._make_trace("goal1"))
        store.summarize_to_tier1(self._make_trace("goal2"))
        tier1_dir = tmp_path / "tier1"
        jsonl_files = list(tier1_dir.glob("summary-*.jsonl"))
        assert len(jsonl_files) == 1  # Same day = same file
        lines = jsonl_files[0].read_text().strip().splitlines()
        assert len(lines) == 2

    def test_get_recent_summaries(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        for i in range(5):
            store.summarize_to_tier1(self._make_trace(f"goal-{i}"))
        summaries = store.get_recent_summaries(limit=3)
        assert len(summaries) == 3

    def test_get_recent_summaries_empty(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        assert store.get_recent_summaries() == []

    def test_cleanup_expired_removes_old_files(self, tmp_path):
        import time
        store = TieredTelemetryStore(str(tmp_path))
        # Create a tier0 file
        tier0 = tmp_path / "tier0"
        tier0.mkdir(parents=True)
        old_file = tier0 / "trace-old.json"
        old_file.write_text("{}")
        # Set modification time to 30 days ago (beyond 14-day retention)
        old_mtime = time.time() - (30 * 86400)
        import os
        os.utime(old_file, (old_mtime, old_mtime))
        removed = store.cleanup_expired()
        assert removed == 1
        assert not old_file.exists()

    def test_cleanup_keeps_recent_files(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        tier0 = tmp_path / "tier0"
        tier0.mkdir(parents=True)
        recent_file = tier0 / "trace-recent.json"
        recent_file.write_text("{}")
        removed = store.cleanup_expired()
        assert removed == 0
        assert recent_file.exists()

    def test_compact_to_tier2_empty(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        assert store.compact_to_tier2() == 0

    def test_tier_directories(self, tmp_path):
        store = TieredTelemetryStore(str(tmp_path))
        assert store._tier_dir(0) == tmp_path / "tier0"
        assert store._tier_dir(1) == tmp_path / "tier1"
        assert store._tier_dir(2) == tmp_path / "tier2"


class TestTelemetryCollectorIntegration:
    """Test TelemetryCollector with tiered store integration."""

    def test_full_trace_lifecycle(self, tmp_path):
        collector = TelemetryCollector(output_dir=str(tmp_path))
        collector.start_trace("deploy app")
        collector.record_step(1, "Install deps", 2.5, 0)
        collector.record_step(2, "Build", 5.0, 0, self_healed=True)
        collector.record_llm_call()
        collector.record_error("minor warning")
        trace = collector.finish_trace()
        assert trace is not None
        assert trace.goal == "deploy app"
        assert len(trace.steps) == 2
        assert trace.llm_calls == 1
        assert len(trace.errors) == 1
