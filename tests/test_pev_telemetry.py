"""Tests for PEV Phase 7 — Telemetry and Monitoring.

Tests PEVStructuredLogger, PEVMetricsCollector, PEVDashboardData,
and PEV health checks.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestPEVStructuredLogger(unittest.TestCase):
    """Tests for PEVStructuredLogger."""

    def setUp(self):
        from src.core.pev_structured_logger import PEVStructuredLogger
        self.logger = PEVStructuredLogger(logger_name="test.pev")

    def test_log_entry_json_format(self):
        """Log entries serialize to valid JSON."""
        entry = self.logger.plan_started("build app")
        parsed = json.loads(entry.to_json())
        assert parsed["component"] == "planner"
        assert parsed["operation"] == "plan_started"
        assert "timestamp" in parsed
        assert parsed["level"] == "INFO"

    def test_step_started_and_completed(self):
        """Step start/complete cycle with auto-duration."""
        self.logger.step_started(1, "install deps")
        time.sleep(0.01)
        entry = self.logger.step_completed(1)
        assert entry.duration_ms is not None
        assert entry.duration_ms > 0
        assert entry.step_order == 1

    def test_step_failed_clears_timer(self):
        """Step failure clears the timer for that step."""
        self.logger.step_started(2, "compile")
        self.logger.step_failed(2, "syntax error")
        # Timer should be cleared
        assert 2 not in self.logger._step_timers

    def test_step_retried_logging(self):
        """Step retry logs with attempt number."""
        entry = self.logger.step_retried(1, attempt=3)
        parsed = json.loads(entry.to_json())
        assert parsed["metadata"]["attempt"] == 3
        assert parsed["level"] == "WARNING"

    def test_pipeline_context(self):
        """Pipeline ID propagates to all log entries."""
        self.logger.pipeline_started("pipe-1", stage_count=3)
        entry = self.logger.step_started(1, "step A")
        assert entry.pipeline_id == "pipe-1"

        self.logger.pipeline_completed("pipe-1", "completed", 5000.0)
        entry2 = self.logger.step_started(2, "step B")
        assert entry2.pipeline_id is None  # Cleared after pipeline end

    def test_plan_completed_with_duration(self):
        """Plan completion records step count and duration."""
        entry = self.logger.plan_completed(step_count=5, duration_ms=1500.0)
        parsed = json.loads(entry.to_json())
        assert parsed["duration_ms"] == 1500.0
        assert parsed["metadata"]["step_count"] == 5

    def test_plan_failed_error_level(self):
        """Plan failure uses ERROR level."""
        entry = self.logger.plan_failed("LLM timeout")
        assert entry.level == "ERROR"

    def test_verify_operations(self):
        """Verification log operations."""
        e1 = self.logger.verify_started(1)
        assert e1.component == "verifier"

        e2 = self.logger.verify_passed(1)
        assert e2.operation == "verify_passed"

        e3 = self.logger.verify_failed(1, "exit code mismatch")
        assert e3.level == "WARNING"

    def test_orchestration_operations(self):
        """Orchestration log operations."""
        e1 = self.logger.orchestration_started("deploy app")
        assert e1.component == "orchestrator"

        e2 = self.logger.orchestration_completed("success", 3000.0)
        assert e2.level == "INFO"

        e3 = self.logger.orchestration_completed("failed", 1000.0)
        assert e3.level == "WARNING"

    def test_rollback_triggered(self):
        """Rollback trigger logged as WARNING."""
        entry = self.logger.rollback_triggered("step 3 failed")
        assert entry.level == "WARNING"
        assert entry.operation == "rollback_triggered"

    def test_null_fields_omitted_in_json(self):
        """None fields are omitted from JSON output."""
        entry = self.logger.plan_started("test")
        parsed = json.loads(entry.to_json())
        assert "duration_ms" not in parsed
        assert "step_order" not in parsed

    def test_singleton_get_pev_logger(self):
        """Singleton returns same instance."""
        from src.core.pev_structured_logger import get_pev_logger
        l1 = get_pev_logger()
        l2 = get_pev_logger()
        assert l1 is l2


class TestPEVMetricsCollector(unittest.TestCase):
    """Tests for PEVMetricsCollector."""

    def setUp(self):
        from src.core.pev_metrics_collector import PEVMetricsCollector
        self.tmpdir = tempfile.mkdtemp()
        self.collector = PEVMetricsCollector(storage_dir=self.tmpdir)

    def test_pipeline_lifecycle(self):
        """Full pipeline start → steps → end lifecycle."""
        self.collector.record_pipeline_start("p1")
        self.collector.record_step_result("p1", 1, True, 500.0)
        self.collector.record_step_result("p1", 2, True, 300.0)
        self.collector.record_pipeline_end("p1", "completed")

        summary = self.collector.get_pipeline_summary("p1")
        assert summary is not None
        assert summary["status"] == "completed"
        assert summary["total_steps"] == 2
        assert summary["successful_steps"] == 2
        assert summary["success_rate"] == 1.0
        assert summary["duration_ms"] > 0

    def test_failed_steps_tracked(self):
        """Failed steps reduce success rate."""
        self.collector.record_pipeline_start("p2")
        self.collector.record_step_result("p2", 1, True, 100.0)
        self.collector.record_step_result("p2", 2, False, 200.0)
        self.collector.record_pipeline_end("p2", "partial")

        summary = self.collector.get_pipeline_summary("p2")
        assert summary["failed_steps"] == 1
        assert summary["success_rate"] == 0.5

    def test_retry_count_aggregated(self):
        """Retry counts aggregate at pipeline level."""
        self.collector.record_pipeline_start("p3")
        self.collector.record_step_result("p3", 1, True, 100.0, retry_count=2)
        self.collector.record_step_result("p3", 2, True, 100.0, retry_count=1)
        self.collector.record_pipeline_end("p3", "completed")

        summary = self.collector.get_pipeline_summary("p3")
        assert summary["total_retries"] == 3

    def test_self_heal_count(self):
        """Self-healing events tracked."""
        self.collector.record_pipeline_start("p4")
        self.collector.record_step_result("p4", 1, True, 100.0, self_healed=True)
        self.collector.record_step_result("p4", 2, True, 100.0, self_healed=False)
        self.collector.record_pipeline_end("p4", "completed")

        summary = self.collector.get_pipeline_summary("p4")
        assert summary["self_heal_count"] == 1

    def test_global_metrics(self):
        """Global metrics aggregate across pipelines."""
        self.collector.record_pipeline_start("g1")
        self.collector.record_step_result("g1", 1, True, 100.0)
        self.collector.record_pipeline_end("g1", "completed")

        self.collector.record_pipeline_start("g2")
        self.collector.record_step_result("g2", 1, False, 200.0)
        self.collector.record_pipeline_end("g2", "failed")

        metrics = self.collector.get_global_metrics()
        assert metrics["total_pipelines"] == 2
        assert metrics["total_successful"] == 1
        assert metrics["total_failed"] == 1
        assert metrics["overall_success_rate"] == 0.5

    def test_recent_pipelines(self):
        """Recent pipelines returned in reverse chronological order."""
        for i in range(5):
            pid = f"r{i}"
            self.collector.record_pipeline_start(pid)
            self.collector.record_pipeline_end(pid, "completed")

        recent = self.collector.get_recent_pipelines(limit=3)
        assert len(recent) == 3
        assert recent[0]["pipeline_id"] == "r4"
        assert recent[2]["pipeline_id"] == "r2"

    def test_nonexistent_pipeline(self):
        """Querying nonexistent pipeline returns None."""
        assert self.collector.get_pipeline_summary("nope") is None

    def test_step_result_for_unknown_pipeline_ignored(self):
        """Step result for unknown pipeline is silently ignored."""
        self.collector.record_step_result("unknown", 1, True, 100.0)
        assert self.collector.get_pipeline_summary("unknown") is None

    def test_disk_persistence(self):
        """Pipeline metrics persisted to disk."""
        self.collector.record_pipeline_start("disk1")
        self.collector.record_step_result("disk1", 1, True, 100.0)
        self.collector.record_pipeline_end("disk1", "completed")

        import pathlib
        filepath = pathlib.Path(self.tmpdir) / "disk1.json"
        assert filepath.exists()
        data = json.loads(filepath.read_text())
        assert data["pipeline_id"] == "disk1"

    def test_history_trimming(self):
        """Old pipelines trimmed when exceeding MAX_HISTORY."""
        self.collector.MAX_HISTORY = 3
        for i in range(5):
            pid = f"trim{i}"
            self.collector.record_pipeline_start(pid)
            self.collector.record_pipeline_end(pid, "completed")

        assert len(self.collector._history) == 3
        assert "trim0" not in self.collector._pipelines
        assert "trim1" not in self.collector._pipelines

    def test_running_pipeline_duration(self):
        """Running pipeline calculates duration from start to now."""
        self.collector.record_pipeline_start("running1")
        time.sleep(0.01)
        summary = self.collector.get_pipeline_summary("running1")
        assert summary["duration_ms"] > 0
        assert summary["status"] == "running"

    def test_reset(self):
        """Reset clears all state."""
        self.collector.record_pipeline_start("x")
        self.collector.record_pipeline_end("x", "completed")
        self.collector.reset()

        assert self.collector.get_global_metrics()["total_pipelines"] == 0
        assert self.collector.get_pipeline_summary("x") is None


class TestPEVDashboardData(unittest.TestCase):
    """Tests for PEVDashboardData."""

    def setUp(self):
        from src.core.pev_metrics_collector import PEVMetricsCollector
        from src.core.pev_dashboard_data import PEVDashboardData
        self.tmpdir = tempfile.mkdtemp()
        self.metrics = PEVMetricsCollector(storage_dir=self.tmpdir)
        self.dashboard = PEVDashboardData(
            metrics=self.metrics, storage_dir=self.tmpdir
        )

    def test_overview_empty(self):
        """Overview with no pipelines returns zero metrics."""
        overview = self.dashboard.get_overview()
        assert overview["global"]["total_pipelines"] == 0
        assert overview["recent_pipelines"] == []

    def test_overview_with_pipelines(self):
        """Overview reflects pipeline data."""
        self.metrics.record_pipeline_start("d1")
        self.metrics.record_step_result("d1", 1, True, 500.0)
        self.metrics.record_pipeline_end("d1", "completed")

        overview = self.dashboard.get_overview()
        assert overview["global"]["total_pipelines"] == 1
        assert len(overview["recent_pipelines"]) == 1

    def test_execution_history_from_memory(self):
        """Execution history reads from in-memory metrics."""
        for i in range(3):
            pid = f"h{i}"
            self.metrics.record_pipeline_start(pid)
            self.metrics.record_pipeline_end(pid, "completed")

        history = self.dashboard.get_execution_history(limit=10)
        assert len(history) == 3

    def test_execution_history_from_disk(self):
        """History reads from disk when in-memory is empty."""
        import pathlib
        # Write a pipeline file directly to disk
        data = {
            "pipeline_id": "disk-only",
            "status": "completed",
            "duration_ms": 1000.0,
            "success_rate": 1.0,
        }
        filepath = pathlib.Path(self.tmpdir) / "disk-only.json"
        filepath.write_text(json.dumps(data))

        history = self.dashboard.get_execution_history(limit=10)
        ids = [h["pipeline_id"] for h in history]
        assert "disk-only" in ids

    def test_pipeline_detail(self):
        """Get detail for specific pipeline."""
        self.metrics.record_pipeline_start("det1")
        self.metrics.record_step_result("det1", 1, True, 200.0, retry_count=1)
        self.metrics.record_pipeline_end("det1", "completed")

        detail = self.dashboard.get_pipeline_detail("det1")
        assert detail is not None
        assert detail["total_retries"] == 1

    def test_pipeline_detail_not_found(self):
        """Detail for nonexistent pipeline returns None."""
        assert self.dashboard.get_pipeline_detail("nope") is None

    def test_success_rate_trend(self):
        """Success rate trend returns correct data."""
        self.metrics.record_pipeline_start("t1")
        self.metrics.record_step_result("t1", 1, True, 100.0)
        self.metrics.record_pipeline_end("t1", "completed")

        self.metrics.record_pipeline_start("t2")
        self.metrics.record_step_result("t2", 1, False, 100.0)
        self.metrics.record_pipeline_end("t2", "failed")

        trend = self.dashboard.get_success_rate_trend(limit=10)
        assert len(trend) == 2
        rates = {t["pipeline_id"]: t["success_rate"] for t in trend}
        assert rates["t1"] == 1.0
        assert rates["t2"] == 0.0


    def test_execution_history_disk_limit_reached(self):
        """Disk reading stops when limit reached (covers break at line 74)."""
        import pathlib
        # Write many disk files
        for i in range(5):
            data = {"pipeline_id": f"dlim-{i}", "status": "completed"}
            fp = pathlib.Path(self.tmpdir) / f"dlim-{i}.json"
            fp.write_text(json.dumps(data))

        # Request only 3 — should stop early
        history = self.dashboard.get_execution_history(limit=3)
        assert len(history) == 3

    def test_execution_history_bad_json_on_disk(self):
        """Malformed JSON files on disk are skipped (covers lines 81-82)."""
        import pathlib
        bad_file = pathlib.Path(self.tmpdir) / "bad-json.json"
        bad_file.write_text("NOT VALID JSON {{")
        good_data = {"pipeline_id": "good-disk", "status": "completed"}
        good_file = pathlib.Path(self.tmpdir) / "good-disk.json"
        good_file.write_text(json.dumps(good_data))

        history = self.dashboard.get_execution_history(limit=10)
        ids = [h["pipeline_id"] for h in history]
        assert "good-disk" in ids

    def test_pipeline_detail_from_disk(self):
        """get_pipeline_detail reads from disk when not in memory (covers lines 103-107)."""
        import pathlib
        data = {
            "pipeline_id": "disk-detail",
            "status": "completed",
            "duration_ms": 500.0,
        }
        filepath = pathlib.Path(self.tmpdir) / "disk-detail.json"
        filepath.write_text(json.dumps(data))

        detail = self.dashboard.get_pipeline_detail("disk-detail")
        assert detail is not None
        assert detail["pipeline_id"] == "disk-detail"
        assert detail["status"] == "completed"

    def test_pipeline_detail_disk_bad_json(self):
        """get_pipeline_detail returns None for corrupted disk file."""
        import pathlib
        bad = pathlib.Path(self.tmpdir) / "corrupt.json"
        bad.write_text("{broken")

        assert self.dashboard.get_pipeline_detail("corrupt") is None

    def test_singleton_get_dashboard_data(self):
        """get_dashboard_data returns singleton (covers lines 139-141)."""
        from src.core.pev_dashboard_data import (
            get_dashboard_data, reset_dashboard_data,
        )
        reset_dashboard_data()
        d1 = get_dashboard_data()
        d2 = get_dashboard_data()
        assert d1 is d2
        reset_dashboard_data()

    def test_reset_dashboard_data(self):
        """reset_dashboard_data clears singleton (covers line 147)."""
        from src.core.pev_dashboard_data import (
            get_dashboard_data, reset_dashboard_data,
        )
        d1 = get_dashboard_data()
        reset_dashboard_data()
        d2 = get_dashboard_data()
        assert d1 is not d2
        reset_dashboard_data()


class TestPEVHealthChecks(unittest.TestCase):
    """Tests for PEV health check functions."""

    def setUp(self):
        from src.core.pev_metrics_collector import PEVMetricsCollector, reset_pev_metrics
        # Reset singleton so health checks use fresh metrics
        reset_pev_metrics()
        # Inject test metrics
        import src.core.pev_metrics_collector as mod
        self.metrics = PEVMetricsCollector()
        mod._pev_metrics = self.metrics

    def tearDown(self):
        from src.core.pev_metrics_collector import reset_pev_metrics
        reset_pev_metrics()

    def test_healthy_engine_no_pipelines(self):
        """No pipelines = healthy (nothing wrong)."""
        from src.core.pev_health_checks import check_pev_engine
        result = check_pev_engine()
        assert result.status == "healthy"

    def test_healthy_engine_high_success(self):
        """High success rate = healthy."""
        from src.core.pev_health_checks import check_pev_engine
        for i in range(10):
            self.metrics.record_pipeline_start(f"h{i}")
            self.metrics.record_step_result(f"h{i}", 1, True, 100.0)
            self.metrics.record_pipeline_end(f"h{i}", "completed")

        result = check_pev_engine()
        assert result.status == "healthy"

    def test_degraded_engine_medium_success(self):
        """Success rate 50-80% = degraded."""
        from src.core.pev_health_checks import check_pev_engine
        for i in range(10):
            status = "completed" if i < 7 else "failed"
            self.metrics.record_pipeline_start(f"d{i}")
            self.metrics.record_pipeline_end(f"d{i}", status)

        result = check_pev_engine()
        assert result.status == "degraded"

    def test_unhealthy_engine_low_success(self):
        """Success rate < 50% = unhealthy."""
        from src.core.pev_health_checks import check_pev_engine
        for i in range(10):
            status = "completed" if i < 3 else "failed"
            self.metrics.record_pipeline_start(f"u{i}")
            self.metrics.record_pipeline_end(f"u{i}", status)

        result = check_pev_engine()
        assert result.status == "unhealthy"

    def test_pipeline_activity_healthy(self):
        """Few active pipelines = healthy."""
        from src.core.pev_health_checks import check_pipeline_activity
        self.metrics.record_pipeline_start("a1")
        result = check_pipeline_activity()
        assert result.status == "healthy"

    def test_pipeline_activity_degraded(self):
        """Many active pipelines = degraded."""
        from src.core.pev_health_checks import check_pipeline_activity
        for i in range(6):
            self.metrics.record_pipeline_start(f"act{i}")

        result = check_pipeline_activity()
        assert result.status == "degraded"

    def test_retry_rate_healthy(self):
        """Low retry rate = healthy."""
        from src.core.pev_health_checks import check_retry_rate
        self.metrics.record_pipeline_start("rr1")
        self.metrics.record_step_result("rr1", 1, True, 100.0, retry_count=0)
        self.metrics.record_pipeline_end("rr1", "completed")

        result = check_retry_rate()
        assert result.status == "healthy"

    def test_retry_rate_unhealthy(self):
        """High retry rate = unhealthy."""
        from src.core.pev_health_checks import check_retry_rate
        self.metrics.record_pipeline_start("rr2")
        self.metrics.record_step_result("rr2", 1, True, 100.0, retry_count=5)
        self.metrics.record_pipeline_end("rr2", "completed")

        result = check_retry_rate()
        assert result.status == "unhealthy"

    def test_get_pev_health_summary(self):
        """Health summary returns all three checks."""
        from src.core.pev_health_checks import get_pev_health_summary
        summary = get_pev_health_summary()
        assert "pev_engine" in summary
        assert "pipeline_activity" in summary
        assert "retry_rate" in summary
        for v in summary.values():
            assert "status" in v


if __name__ == "__main__":
    unittest.main()
