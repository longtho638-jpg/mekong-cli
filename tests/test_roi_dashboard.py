"""
Unit Tests for ROI Dashboard

Test suite for ROIDashboard class in src/analytics/roi_dashboard.py
Tests ROI calculations, time savings, and cost analysis.
"""
import pytest
from unittest.mock import MagicMock, patch

from src.analytics.roi_dashboard import (
    ROIDashboard,
    ROIMetrics,
    TIME_ESTIMATES,
    AGENT_COSTS,
    DEVELOPER_HOURLY_RATE,
    get_dashboard,
)
from src.metering.usage_tracker import DailyUsage, UsageReport


class TestROIMetrics:
    """Tests for ROIMetrics dataclass."""

    def test_default_values(self):
        """Test ROIMetrics default initialization."""
        metrics = ROIMetrics()
        assert metrics.total_minutes_saved == 0
        assert metrics.total_hours_saved == 0.0
        assert metrics.labor_cost_saved == 0.0
        assert metrics.investment_cost == 0.0
        assert metrics.roi_multiplier == 0.0

    def test_to_dict_conversion(self):
        """Test ROIMetrics converts to dictionary correctly."""
        metrics = ROIMetrics(
            total_minutes_saved=600,
            total_hours_saved=10.0,
            labor_cost_saved=750.0,
            investment_cost=50.0,
            total_cost_avoided=750.0,
            roi_multiplier=15.0,
            avg_cost_per_command=0.05,
            avg_cost_per_agent=0.08,
            total_commands=100,
            total_agents=50,
            total_pipelines=10,
            period_days=30,
            time_saved_by_command={"cook": 300, "plan": 100},
            time_saved_by_agent={"planner": 200},
        )

        result = metrics.to_dict()
        assert result["totalMinutesSaved"] == 600
        assert result["totalHoursSaved"] == 10.0
        assert result["laborCostSaved"] == 750.0
        assert result["roiMultiplier"] == 15.0
        assert result["timeSavedByCommand"] == {"cook": 300, "plan": 100}


class TestROIDashboard:
    """Tests for ROIDashboard class."""

    @pytest.fixture
    def mock_tracker(self):
        """Create mock UsageTracker."""
        tracker = MagicMock()
        tracker._hash_license_key.return_value = "abc123def456..."
        tracker.get_usage_report.return_value = UsageReport(
            license_key_hash="abc123",
            period_days=30,
            total_commands=10,
            total_agents=5,
            total_pipelines=2,
            daily_reports=[
                DailyUsage(
                    date="2026-03-01",
                    total_commands=5,
                    total_agents=3,
                    total_pipelines=1,
                    command_breakdown={"cook": 3, "plan": 2},
                    agent_breakdown={"planner": 2, "researcher": 1},
                ),
                DailyUsage(
                    date="2026-03-02",
                    total_commands=5,
                    total_agents=2,
                    total_pipelines=1,
                    command_breakdown={"fix": 3, "test": 2},
                    agent_breakdown={"tester": 2},
                ),
            ],
        )
        return tracker

    @pytest.fixture
    def dashboard(self, mock_tracker):
        """Create ROIDashboard instance with mock tracker."""
        return ROIDashboard("test-license-key", tracker=mock_tracker)

    def test_init_with_tracker(self, mock_tracker):
        """Test initialization with provided tracker."""
        dashboard = ROIDashboard("test-key", tracker=mock_tracker)
        assert dashboard.tracker == mock_tracker
        assert dashboard.license_key == "test-key"

    def test_init_without_tracker(self):
        """Test initialization creates default tracker."""
        with patch('src.analytics.roi_dashboard.get_tracker') as mock_get:
            mock_tracker = MagicMock()
            mock_get.return_value = mock_tracker
            dashboard = ROIDashboard("test-key")
            assert dashboard.tracker == mock_tracker

    def test_calculate_metrics_time_savings(self, dashboard, mock_tracker):
        """Test calculate_metrics computes time savings correctly."""
        metrics = dashboard.calculate_metrics(days=30)

        # cook: (120-5)*3 = 345 min, plan: (60-2)*2 = 116 min
        # fix: (90-10)*3 = 240 min, test: (60-5)*2 = 110 min
        # planner: (90-3)*2 = 174 min, researcher: (180-5)*1 = 175 min
        # tester: (60-3)*2 = 114 min
        expected_minutes = 345 + 116 + 240 + 110 + 174 + 175 + 114
        assert metrics.total_minutes_saved == expected_minutes

    def test_calculate_metrics_labor_cost(self, dashboard, mock_tracker):
        """Test labor cost calculation."""
        metrics = dashboard.calculate_metrics(days=30)
        expected_hours = metrics.total_minutes_saved / 60
        expected_cost = expected_hours * DEVELOPER_HOURLY_RATE
        assert abs(metrics.labor_cost_saved - expected_cost) < 0.01

    def test_calculate_metrics_agent_costs(self, dashboard, mock_tracker):
        """Test agent cost calculation."""
        metrics = dashboard.calculate_metrics(days=30)
        # planner: 2 * $0.05 = $0.10, researcher: 1 * $0.08 = $0.08
        # tester: 2 * $0.04 = $0.08
        assert metrics.investment_cost > 0

    def test_calculate_metrics_roi_multiplier(self, dashboard, mock_tracker):
        """Test ROI multiplier calculation."""
        metrics = dashboard.calculate_metrics(days=30)
        if metrics.investment_cost > 0:
            expected_roi = metrics.total_cost_avoided / metrics.investment_cost
            assert abs(metrics.roi_multiplier - expected_roi) < 0.1

    def test_calculate_metrics_by_command_breakdown(self, dashboard, mock_tracker):
        """Test time saved breakdown by command."""
        metrics = dashboard.calculate_metrics(days=30)
        assert "cook" in metrics.time_saved_by_command
        assert "plan" in metrics.time_saved_by_command
        assert "fix" in metrics.time_saved_by_command
        assert "test" in metrics.time_saved_by_command

    def test_calculate_metrics_by_agent_breakdown(self, dashboard, mock_tracker):
        """Test time saved breakdown by agent."""
        metrics = dashboard.calculate_metrics(days=30)
        assert "planner" in metrics.time_saved_by_agent
        assert "researcher" in metrics.time_saved_by_agent
        assert "tester" in metrics.time_saved_by_agent

    def test_get_daily_roi(self, dashboard, mock_tracker):
        """Test daily ROI breakdown."""
        daily = dashboard.get_daily_roi(days=30)
        assert len(daily) == 2
        assert daily[0].date == "2026-03-01"
        assert daily[1].date == "2026-03-02"
        assert daily[0].minutes_saved > 0
        assert daily[0].cost_saved > 0

    def test_export_json_structure(self, dashboard, mock_tracker):
        """Test JSON export has correct structure."""
        import json
        json_str = dashboard.export_json(days=30)
        data = json.loads(json_str)

        assert "licenseKeyHash" in data
        assert "generatedAt" in data
        assert "period" in data
        assert "summary" in data
        assert "dailyBreakdown" in data
        assert data["period"]["days"] == 30

    def test_export_json_contains_metrics(self, dashboard, mock_tracker):
        """Test JSON export contains all metrics."""
        import json
        json_str = dashboard.export_json(days=30)
        data = json.loads(json_str)
        summary = data["summary"]

        assert "totalMinutesSaved" in summary
        assert "totalHoursSaved" in summary
        assert "laborCostSaved" in summary
        assert "roiMultiplier" in summary

    def test_generate_ascii_report(self, dashboard, mock_tracker):
        """Test ASCII report generation."""
        report = dashboard.generate_ascii_report(days=30)
        assert "ROI DASHBOARD" in report
        assert "TIME SAVINGS" in report
        assert "ROI METRICS" in report
        assert isinstance(report, str)
        assert len(report) > 100

    def test_generate_ascii_report_contains_values(self, dashboard, mock_tracker):
        """Test ASCII report contains metric values."""
        metrics = dashboard.calculate_metrics(days=30)
        report = dashboard.generate_ascii_report(days=30)
        assert str(metrics.total_commands) in report
        assert str(metrics.total_agents) in report


class TestTimeEstimates:
    """Tests for TIME_ESTIMATES configuration."""

    def test_cook_has_manual_and_cli(self):
        """Test cook command has manual and cli estimates."""
        assert "cook" in TIME_ESTIMATES
        assert "manual" in TIME_ESTIMATES["cook"]
        assert "cli" in TIME_ESTIMATES["cook"]
        assert TIME_ESTIMATES["cook"]["manual"] > TIME_ESTIMATES["cook"]["cli"]

    def test_all_commands_have_estimates(self):
        """Test all tracked commands have time estimates."""
        commands = ["cook", "plan", "fix", "code", "test", "review", "deploy", "debug"]
        for cmd in commands:
            assert cmd in TIME_ESTIMATES, f"{cmd} missing from TIME_ESTIMATES"
            assert TIME_ESTIMATES[cmd]["manual"] > TIME_ESTIMATES[cmd]["cli"]

    def test_all_agents_have_estimates(self):
        """Test all tracked agents have time estimates."""
        agents = ["planner", "researcher", "fullstack-developer", "tester",
                  "code-reviewer", "debugger", "docs-manager", "project-manager"]
        for agent in agents:
            assert agent in TIME_ESTIMATES, f"{agent} missing from TIME_ESTIMATES"
            assert TIME_ESTIMATES[agent]["manual"] > TIME_ESTIMATES[agent]["cli"]


class TestAgentCosts:
    """Tests for AGENT_COSTS configuration."""

    def test_planner_cost_defined(self):
        """Test planner agent cost is defined."""
        assert "planner" in AGENT_COSTS
        assert AGENT_COSTS["planner"] > 0

    def test_all_agents_have_costs(self):
        """Test all tracked agents have cost estimates."""
        agents = ["planner", "researcher", "fullstack-developer", "tester",
                  "code-reviewer", "debugger", "docs-manager", "project-manager"]
        for agent in agents:
            assert agent in AGENT_COSTS, f"{agent} missing from AGENT_COSTS"
            assert AGENT_COSTS[agent] > 0


class TestDeveloperHourlyRate:
    """Tests for DEVELOPER_HOURLY_RATE configuration."""

    def test_hourly_rate_is_positive(self):
        """Test developer hourly rate is positive."""
        assert DEVELOPER_HOURLY_RATE > 0

    def test_hourly_rate_is_reasonable(self):
        """Test developer hourly rate is in reasonable range."""
        assert 50 <= DEVELOPER_HOURLY_RATE <= 200


class TestGetDashboard:
    """Tests for get_dashboard convenience function."""

    def test_get_dashboard_returns_instance(self):
        """Test get_dashboard returns ROIDashboard instance."""
        with patch('src.analytics.roi_dashboard.get_tracker') as mock_get:
            mock_tracker = MagicMock()
            mock_get.return_value = mock_tracker
            dashboard = get_dashboard("test-key")
            assert isinstance(dashboard, ROIDashboard)


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_empty_usage_report(self):
        """Test metrics calculation with empty usage data."""
        mock_tracker = MagicMock()
        mock_tracker.get_usage_report.return_value = UsageReport(
            license_key_hash="abc123",
            period_days=30,
            total_commands=0,
            total_agents=0,
            total_pipelines=0,
            daily_reports=[],
        )

        dashboard = ROIDashboard("test-key", tracker=mock_tracker)
        metrics = dashboard.calculate_metrics(days=30)

        assert metrics.total_minutes_saved == 0
        assert metrics.total_commands == 0
        assert metrics.investment_cost == 0
        assert metrics.roi_multiplier == 0

    def test_zero_investment_roi(self):
        """Test ROI calculation when investment is zero."""
        mock_tracker = MagicMock()
        mock_tracker._hash_license_key.return_value = "abc123..."
        mock_tracker.get_usage_report.return_value = UsageReport(
            license_key_hash="abc123",
            period_days=30,
            total_commands=0,
            total_agents=0,
            total_pipelines=0,
            daily_reports=[],
        )
        dashboard = ROIDashboard("test-key", tracker=mock_tracker)
        metrics = dashboard.calculate_metrics(days=30)
        assert metrics.roi_multiplier == 0

    def test_unknown_command_fallback(self):
        """Test handling of unknown command types."""
        mock_tracker = MagicMock()
        mock_tracker.get_usage_report.return_value = UsageReport(
            license_key_hash="abc123",
            period_days=30,
            total_commands=1,
            total_agents=0,
            total_pipelines=0,
            daily_reports=[
                DailyUsage(
                    date="2026-03-01",
                    total_commands=1,
                    total_agents=0,
                    total_pipelines=0,
                    command_breakdown={"unknown_command": 1},
                    agent_breakdown={},
                ),
            ],
        )

        dashboard = ROIDashboard("test-key", tracker=mock_tracker)
        metrics = dashboard.calculate_metrics(days=30)

        # Should use default estimates: manual=60, cli=5
        assert metrics.total_minutes_saved == 55  # (60-5) * 1


class TestIntegration:
    """Integration tests for ROI dashboard."""

    def test_full_workflow(self):
        """Test complete ROI calculation workflow."""
        mock_tracker = MagicMock()
        mock_tracker._hash_license_key.return_value = "test123..."
        mock_tracker.get_usage_report.return_value = UsageReport(
            license_key_hash="test123",
            period_days=7,
            total_commands=20,
            total_agents=10,
            total_pipelines=5,
            daily_reports=[
                DailyUsage(
                    date="2026-03-01",
                    total_commands=10,
                    total_agents=5,
                    total_pipelines=2,
                    command_breakdown={"cook": 5, "plan": 3, "fix": 2},
                    agent_breakdown={"planner": 3, "researcher": 2},
                ),
                DailyUsage(
                    date="2026-03-02",
                    total_commands=10,
                    total_agents=5,
                    total_pipelines=3,
                    command_breakdown={"test": 5, "review": 3, "deploy": 2},
                    agent_breakdown={"tester": 3, "code-reviewer": 2},
                ),
            ],
        )

        dashboard = ROIDashboard("test-key", tracker=mock_tracker)

        # Calculate metrics
        metrics = dashboard.calculate_metrics(days=7)
        assert metrics.total_minutes_saved > 0
        assert metrics.labor_cost_saved > 0

        # Get daily breakdown
        daily = dashboard.get_daily_roi(days=7)
        assert len(daily) == 2

        # Export JSON
        import json
        json_str = dashboard.export_json(days=7)
        data = json.loads(json_str)
        assert data["summary"]["totalMinutesSaved"] == metrics.total_minutes_saved

        # Generate ASCII report
        report = dashboard.generate_ascii_report(days=7)
        assert "ROI DASHBOARD" in report


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
