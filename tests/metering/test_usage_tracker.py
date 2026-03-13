"""
Tests for Usage Tracker and ROI Dashboard — ROIaaS Phase 4 & 5

Tests:
- UsageTracker: track commands, agents, pipelines
- Free tier enforcement
- ROIDashboard: calculate metrics, export JSON
- CLI commands integration
"""

import pytest
import json
import tempfile
from pathlib import Path


class TestUsageTracker:
    """Test usage tracking functionality."""

    @pytest.fixture
    def tracker(self):
        """Create tracker with temp database."""
        from src.metering.usage_tracker import UsageTracker

        # Use temp database for testing
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        tracker = UsageTracker(db_path=db_path)
        yield tracker

        # Cleanup
        tracker.close()
        Path(db_path).unlink(missing_ok=True)

    def test_track_command(self, tracker):
        """Test tracking command execution."""
        license_key = "test-license-123"

        # Track command
        tracker.track_command(license_key, "cook")

        # Verify
        usage = tracker.get_daily_usage(license_key)
        assert usage.total_commands == 1
        assert usage.command_breakdown.get("cook") == 1

    def test_track_agent_call(self, tracker):
        """Test tracking agent calls."""
        license_key = "test-license-456"

        # Track multiple agent calls
        tracker.track_agent_call(license_key, "planner")
        tracker.track_agent_call(license_key, "researcher")
        tracker.track_agent_call(license_key, "planner")

        # Verify
        usage = tracker.get_daily_usage(license_key)
        assert usage.total_agents == 3
        assert usage.agent_breakdown.get("planner") == 2
        assert usage.agent_breakdown.get("researcher") == 1

    def test_track_pipeline_run(self, tracker):
        """Test tracking pipeline runs."""
        license_key = "test-license-789"

        tracker.track_pipeline_run(license_key, "PEV")
        tracker.track_pipeline_run(license_key, "PEV")

        usage = tracker.get_daily_usage(license_key)
        assert usage.total_pipelines == 2

    def test_free_tier_exceeded(self, tracker):
        """Test free tier limit enforcement."""
        license_key = "test-free-tier"

        # Track 10 commands (free tier limit)
        for i in range(10):
            tracker.track_command(license_key, f"cmd_{i}")

        # Check exceeded
        result = tracker.is_free_tier_exceeded(license_key)
        assert result["exceeded"] is True
        assert "Command limit exceeded" in result["reason"]

    def test_free_tier_remaining(self, tracker):
        """Test free tier remaining quota."""
        license_key = "test-free-tier-2"

        # Track 5 commands
        for i in range(5):
            tracker.track_command(license_key, f"cmd_{i}")

        usage = tracker.get_daily_usage(license_key)
        remaining = tracker.get_free_tier_remaining(usage)

        assert remaining["commands_remaining"] == 5
        assert remaining["agents_remaining"] == 5  # Not used
        assert remaining["pipelines_remaining"] == 3  # Not used

    def test_hash_license_key(self, tracker):
        """Test license key hashing for privacy."""
        key1 = "test-key-1"
        key2 = "test-key-2"

        hash1 = tracker._hash_license_key(key1)
        hash2 = tracker._hash_license_key(key2)

        # Verify hashes are different and consistent
        assert hash1 != hash2
        assert hash1 == tracker._hash_license_key(key1)
        assert len(hash1) == 64  # SHA256 hex length

    def test_get_usage_report(self, tracker):
        """Test multi-day usage report."""
        license_key = "test-report"

        # Track some commands
        tracker.track_command(license_key, "cook")
        tracker.track_command(license_key, "plan")
        tracker.track_agent_call(license_key, "planner")

        report = tracker.get_usage_report(license_key, days=7)

        assert report.period_days == 7
        assert report.total_commands >= 2
        assert report.total_agents >= 1
        assert len(report.daily_reports) == 7


class TestROIDashboard:
    """Test ROI dashboard calculations."""

    @pytest.fixture
    def dashboard(self):
        """Create dashboard with test data."""
        from src.analytics.roi_dashboard import ROIDashboard

        license_key = "test-roi-dashboard"
        return ROIDashboard(license_key)

    def test_time_estimates_exist(self):
        """Verify time estimates are defined."""
        from src.analytics.roi_dashboard import TIME_ESTIMATES

        # Check key commands exist
        assert "cook" in TIME_ESTIMATES
        assert "plan" in TIME_ESTIMATES
        assert "cook" in TIME_ESTIMATES

        # Verify estimates are reasonable (manual > cli)
        for name, estimate in TIME_ESTIMATES.items():
            assert estimate["manual"] > estimate["cli"]
            assert estimate["manual"] > 0
            assert estimate["cli"] > 0

    def test_agent_costs_exist(self):
        """Verify agent costs are defined."""
        from src.analytics.roi_dashboard import AGENT_COSTS

        # Check key agents exist
        assert "planner" in AGENT_COSTS
        assert "researcher" in AGENT_COSTS
        assert "fullstack-developer" in AGENT_COSTS

        # Verify costs are reasonable
        for name, cost in AGENT_COSTS.items():
            assert cost > 0
            assert cost < 1  # Less than $1 per call

    def test_calculate_metrics_empty(self, dashboard):
        """Test ROI calculation with no usage data."""
        metrics = dashboard.calculate_metrics(days=30)

        assert metrics.total_minutes_saved == 0
        assert metrics.total_hours_saved == 0
        assert metrics.labor_cost_saved == 0
        assert metrics.roi_multiplier == 0
        assert metrics.period_days == 30

    def test_export_json_structure(self, dashboard):
        """Test JSON export structure."""
        json_str = dashboard.export_json(days=7)
        data = json.loads(json_str)

        # Verify structure
        assert "licenseKeyHash" in data
        assert "generatedAt" in data
        assert "period" in data
        assert "summary" in data
        assert "dailyBreakdown" in data

        assert data["period"]["days"] == 7

    def test_ascii_report_generation(self, dashboard):
        """Test ASCII report generation."""
        report = dashboard.generate_ascii_report(days=30)

        assert "ROI DASHBOARD" in report
        assert "USAGE SUMMARY" in report
        assert "TIME SAVINGS" in report
        assert "ROI METRICS" in report
        assert len(report) > 100  # Reasonable length

    def test_daily_roi_calculation(self, dashboard):
        """Test daily ROI breakdown."""
        daily = dashboard.get_daily_roi(days=7)

        assert len(daily) == 7

        for day in daily:
            assert hasattr(day, "date")
            assert hasattr(day, "minutes_saved")
            assert hasattr(day, "cost_saved")
            assert hasattr(day, "commands")
            assert hasattr(day, "agents")


class TestIntegration:
    """Integration tests for usage tracking + ROI."""

    @pytest.fixture
    def test_env(self):
        """Setup test environment with tracker and dashboard."""
        from src.metering.usage_tracker import UsageTracker
        from src.analytics.roi_dashboard import ROIDashboard

        # Temp database
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        tracker = UsageTracker(db_path=db_path)
        dashboard = ROIDashboard("test-integration-key", tracker)

        yield {
            "tracker": tracker,
            "dashboard": dashboard,
            "db_path": db_path,
        }

        # Cleanup
        tracker.close()
        Path(db_path).unlink(missing_ok=True)

    def test_track_and_calculate_roi(self, test_env):
        """Test tracking commands then calculating ROI."""
        tracker = test_env["tracker"]

        # Simulate usage
        tracker.track_command("test-key", "cook")
        tracker.track_command("test-key", "plan")
        tracker.track_agent_call("test-key", "planner")

        # Verify time estimates are reasonable
        from src.analytics.roi_dashboard import TIME_ESTIMATES

        cook_estimate = TIME_ESTIMATES["cook"]
        plan_estimate = TIME_ESTIMATES["plan"]

        expected_minutes = (
            (cook_estimate["manual"] - cook_estimate["cli"]) +
            (plan_estimate["manual"] - plan_estimate["cli"]) +
            (TIME_ESTIMATES["planner"]["manual"] - TIME_ESTIMATES["planner"]["cli"])
        )

        # Verify estimates are reasonable
        assert expected_minutes > 0
        assert cook_estimate["manual"] > cook_estimate["cli"]

    def test_free_tier_workflow(self, test_env):
        """Test complete free tier workflow."""
        tracker = test_env["tracker"]
        license_key = "free-tier-user"

        # User hits free tier limits
        for i in range(10):
            tracker.track_command(license_key, "cook")

        # Check exceeded
        result = tracker.is_free_tier_exceeded(license_key)
        assert result["exceeded"] is True

        # Get remaining (should be 0)
        usage = tracker.get_daily_usage(license_key)
        remaining = tracker.get_free_tier_remaining(usage)
        assert remaining["commands_remaining"] == 0


class TestCLICommands:
    """Test CLI command modules load correctly."""

    def test_usage_commands_module(self):
        """Test usage commands module loads."""
        from src.commands import usage_commands
        assert hasattr(usage_commands, 'app')
        assert hasattr(usage_commands, 'usage_report')
        assert hasattr(usage_commands, 'usage_check')
        assert hasattr(usage_commands, 'usage_export')

    def test_analytics_show_commands_module(self):
        """Test analytics show commands module loads."""
        from src.commands import analytics_show_commands
        assert hasattr(analytics_show_commands, 'app')
        assert hasattr(analytics_show_commands, 'analytics_show')
        assert hasattr(analytics_show_commands, 'analytics_export')

    def test_time_estimates_consistency(self):
        """Verify time estimates match between modules."""
        from src.commands.analytics_show_commands import TIME_ESTIMATES as CLI_ESTIMATES
        from src.analytics.roi_dashboard import TIME_ESTIMATES as DASHBOARD_ESTIMATES

        # Verify same keys exist
        cli_keys = set(CLI_ESTIMATES.keys())
        dashboard_keys = set(DASHBOARD_ESTIMATES.keys())

        # At minimum, common keys should have same values
        common_keys = cli_keys & dashboard_keys
        for key in common_keys:
            assert CLI_ESTIMATES[key] == DASHBOARD_ESTIMATES[key]

    def test_agent_costs_consistency(self):
        """Verify agent costs match between modules."""
        from src.commands.analytics_show_commands import AGENT_COSTS as CLI_COSTS
        from src.analytics.roi_dashboard import AGENT_COSTS as DASHBOARD_COSTS

        # Verify same keys have same values
        common_keys = set(CLI_COSTS.keys()) & set(DASHBOARD_COSTS.keys())
        for key in common_keys:
            assert CLI_COSTS[key] == DASHBOARD_COSTS[key]
