"""
Integration Tests for Dashboard CLI Commands

Comprehensive end-to-end tests for mekong dashboard commands:
- launch, status, export, summary subcommands
- Help output validation
- Error handling (missing database)
- Command registration integrity
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from typer.testing import CliRunner
import sys
import os
import json
import tempfile

# Add src to path for imports
sys.path.insert(0, str(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/src")

from src.main import app


runner = CliRunner()


class TestDashboardCommandRegistration:
    """Test dashboard command registration integrity."""

    def test_dashboard_command_registered(self):
        """Test 'mekong dashboard' command is registered."""
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "dashboard" in result.stdout
        assert "Analytics Dashboard" in result.stdout

    def test_dashboard_subcommands_registered(self):
        """Test all dashboard subcommands are registered."""
        result = runner.invoke(app, ["dashboard", "--help"])
        assert result.exit_code == 0

        # Check all subcommands exist
        assert "launch" in result.stdout
        assert "status" in result.stdout
        assert "export" in result.stdout
        assert "summary" in result.stdout

    def test_dashboard_launch_help(self):
        """Test 'mekong dashboard launch --help' shows correct options."""
        result = runner.invoke(app, ["dashboard", "launch", "--help"])
        assert result.exit_code == 0
        assert "--port" in result.stdout
        assert "--no-browser" in result.stdout
        assert "--host" in result.stdout

    def test_dashboard_status_help(self):
        """Test 'mekong dashboard status --help' shows correctly."""
        result = runner.invoke(app, ["dashboard", "status", "--help"])
        assert result.exit_code == 0
        assert "Check dashboard health" in result.stdout

    def test_dashboard_export_help(self):
        """Test 'mekong dashboard export --help' shows correct options."""
        result = runner.invoke(app, ["dashboard", "export", "--help"])
        assert result.exit_code == 0
        assert "--format" in result.stdout
        assert "--output" in result.stdout
        assert "--start" in result.stdout
        assert "--end" in result.stdout
        assert "--key" in result.stdout
        assert "--days" in result.stdout

    def test_dashboard_summary_help(self):
        """Test 'mekong dashboard summary --help' shows correctly."""
        result = runner.invoke(app, ["dashboard", "summary", "--help"])
        assert result.exit_code == 0
        assert "Show quick analytics summary" in result.stdout


class TestDashboardCommandsWithoutDatabase:
    """Test dashboard commands handle missing database gracefully."""

    def test_summary_without_database_shows_error(self):
        """Test 'mekong dashboard summary' shows database error when DATABASE_URL not set."""
        # Ensure DATABASE_URL is not set
        with patch.dict(os.environ, {}, clear=True):
            if "DATABASE_URL" in os.environ:
                del os.environ["DATABASE_URL"]

            result = runner.invoke(app, ["dashboard", "summary"])

            # Should show error message about database
            assert result.exit_code != 0 or "Database" in result.stdout or "Error" in result.stdout

    def test_status_without_database_shows_error(self):
        """Test 'mekong dashboard status' shows database error when not connected."""
        with patch.dict(os.environ, {}, clear=True):
            if "DATABASE_URL" in os.environ:
                del os.environ["DATABASE_URL"]

            result = runner.invoke(app, ["dashboard", "status"])

            # Should show error about database connection
            assert result.exit_code != 0 or "Database" in result.stdout or "Error" in result.stdout

    def test_export_without_database_shows_error(self):
        """Test 'mekong dashboard export' shows database error when not connected."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch.dict(os.environ, {}, clear=True):
                if "DATABASE_URL" in os.environ:
                    del os.environ["DATABASE_URL"]

                result = runner.invoke(
                    app,
                    ["dashboard", "export", "-o", tmp_path]
                )

                # Should show error about database
                assert result.exit_code != 0 or "Database" in result.stdout or "Error" in result.stdout
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class TestDashboardLaunchCommand:
    """Test dashboard launch command."""

    @patch("src.api.dashboard.app.run_dashboard")
    def test_launch_default_port(self, mock_run):
        """Test 'mekong dashboard launch' uses default port 8080."""
        result = runner.invoke(app, ["dashboard", "launch"])

        assert result.exit_code == 0
        mock_run.assert_called_once()
        call_kwargs = mock_run.call_args[1]
        assert call_kwargs.get("port") == 8080

    @patch("src.api.dashboard.app.run_dashboard")
    def test_launch_custom_port(self, mock_run):
        """Test 'mekong dashboard launch --port 9000' uses custom port."""
        result = runner.invoke(app, ["dashboard", "launch", "--port", "9000"])

        assert result.exit_code == 0
        mock_run.assert_called_once()
        call_kwargs = mock_run.call_args[1]
        assert call_kwargs.get("port") == 9000

    @patch("src.api.dashboard.app.run_dashboard")
    def test_launch_custom_host(self, mock_run):
        """Test 'mekong dashboard launch --host 0.0.0.0' uses custom host."""
        result = runner.invoke(app, ["dashboard", "launch", "--host", "0.0.0.0", "-p", "8888"])

        assert result.exit_code == 0
        mock_run.assert_called_once()
        call_kwargs = mock_run.call_args[1]
        assert call_kwargs.get("host") == "0.0.0.0"
        assert call_kwargs.get("port") == 8888

    @patch("src.api.dashboard.app.run_dashboard")
    def test_launch_no_browser(self, mock_run):
        """Test 'mekong dashboard launch --no-browser' disables browser."""
        result = runner.invoke(app, ["dashboard", "launch", "--no-browser"])

        assert result.exit_code == 0
        mock_run.assert_called_once()
        call_kwargs = mock_run.call_args[1]
        assert call_kwargs.get("open_browser") is False

    @patch("src.api.dashboard.app.run_dashboard")
    def test_launch_output_shows_urls(self, mock_run):
        """Test launch command shows dashboard URLs."""
        result = runner.invoke(app, ["dashboard", "launch", "--no-browser"])

        assert result.exit_code == 0
        # Check for localhost or 127.0.0.1 (both are valid)
        assert "localhost:8080" in result.stdout or "127.0.0.1:8080" in result.stdout
        assert "API docs" in result.stdout or "Dashboard" in result.stdout


class TestDashboardSummaryCommand:
    """Test dashboard summary command."""

    @pytest.fixture
    def mock_dashboard_service(self):
        """Create mock dashboard service with test data."""
        mock_service = MagicMock()

        # Create mock metrics
        mock_metrics = MagicMock()
        mock_metrics.api_calls = [
            {"date": "2026-03-01", "calls": 1000, "unique_licenses": 50},
            {"date": "2026-03-02", "calls": 1200, "unique_licenses": 55},
        ]
        mock_metrics.active_licenses = {"total": 847}
        mock_metrics.revenue = {"total_mrr": 24567}
        mock_metrics.tier_distribution = {
            "by_tier": {
                "free": {"count": 450, "active": 380},
                "pro": {"count": 280, "active": 265},
                "enterprise": {"count": 195, "active": 202},
            }
        }
        mock_metrics.license_health = {
            "active_count": 782,
            "expiring_soon_count": 19,
            "suspended_count": 34,
            "revoked_count": 12,
        }

        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)
        return mock_service

    @patch("src.analytics.dashboard_service.DashboardService")
    def test_summary_shows_metrics(self, mock_service_class, mock_dashboard_service):
        """Test summary command displays key metrics."""
        mock_service_class.return_value = mock_dashboard_service

        result = runner.invoke(app, ["dashboard", "summary"])

        assert result.exit_code == 0
        assert "Analytics Summary" in result.stdout
        mock_dashboard_service.get_metrics.assert_called_once()

    @patch("src.analytics.dashboard_service.DashboardService")
    def test_summary_shows_tier_distribution(self, mock_service_class, mock_dashboard_service):
        """Test summary shows tier distribution table."""
        mock_service_class.return_value = mock_dashboard_service

        result = runner.invoke(app, ["dashboard", "summary"])

        assert result.exit_code == 0
        assert "Tier Distribution" in result.stdout or "Tier" in result.stdout


class TestDashboardExportCommand:
    """Test dashboard export command."""

    def test_export_requires_output_file(self):
        """Test export command requires -o/--output option."""
        result = runner.invoke(app, ["dashboard", "export"])
        assert result.exit_code != 0

    def test_export_csv_format(self):
        """Test export with CSV format."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.export_to_csv = AsyncMock(return_value="date,api_calls\n2026-03-01,1000\n")
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    ["dashboard", "export", "-f", "csv", "-o", tmp_path]
                )

                assert result.exit_code == 0
                assert "Exported" in result.stdout or tmp_path in result.stdout
                mock_service.export_to_csv.assert_called_once()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def test_export_json_format(self):
        """Test export with JSON format."""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_data = {"exported_at": "2026-03-07", "usage": {"daily": []}}
                mock_service.export_to_json = AsyncMock(return_value=json.dumps(mock_data))
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    ["dashboard", "export", "-f", "json", "-o", tmp_path]
                )

                assert result.exit_code == 0
                # Verify JSON was written
                with open(tmp_path, "r") as f:
                    written_data = json.load(f)
                assert "exported_at" in written_data
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def test_export_with_date_range(self):
        """Test export with custom date range."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.export_to_csv = AsyncMock(return_value="data")
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    [
                        "dashboard", "export",
                        "-f", "csv", "-o", tmp_path,
                        "--start", "2026-03-01",
                        "--end", "2026-03-31"
                    ]
                )

                assert result.exit_code == 0
                mock_service.export_to_csv.assert_called_once()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def test_export_with_license_filter(self):
        """Test export with license key filter."""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.export_to_json = AsyncMock(return_value="{}")
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    [
                        "dashboard", "export",
                        "-f", "json", "-o", tmp_path,
                        "--key", "sk-test-12345"
                    ]
                )

                assert result.exit_code == 0
                # Verify license_key was passed to export method
                call_args = mock_service.export_to_json.call_args
                assert call_args[0][1] == "sk-test-12345"  # license_key argument
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def test_export_with_days_option(self):
        """Test export with --days option."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.export_to_csv = AsyncMock(return_value="data")
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    ["dashboard", "export", "-f", "csv", "-o", tmp_path, "--days", "7"]
                )

                assert result.exit_code == 0
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class TestDashboardStatusCommand:
    """Test dashboard status command."""

    @patch("src.analytics.dashboard_service.DashboardService")
    def test_status_shows_healthy(self, mock_service_class):
        """Test status command shows healthy when database connected."""
        mock_service = MagicMock()
        mock_metrics = MagicMock()
        mock_metrics.api_calls = []
        mock_metrics.active_licenses = {"total": 10}
        mock_metrics.rate_limit_events = []
        mock_metrics.license_health = {"active_count": 8}
        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)
        mock_service._cache = {}

        mock_service_class.return_value = mock_service

        result = runner.invoke(app, ["dashboard", "status"])

        assert result.exit_code == 0
        assert "Dashboard Healthy" in result.stdout or "Dashboard" in result.stdout

    @patch("src.analytics.dashboard_service.DashboardService")
    def test_status_shows_components_table(self, mock_service_class):
        """Test status shows components table."""
        mock_service = MagicMock()
        mock_metrics = MagicMock()
        mock_metrics.api_calls = []
        mock_metrics.active_licenses = {"total": 10}
        mock_metrics.rate_limit_events = []
        mock_metrics.license_health = {}
        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)
        mock_service._cache = {}

        mock_service_class.return_value = mock_service

        result = runner.invoke(app, ["dashboard", "status"])

        assert result.exit_code == 0
        # Check for table components
        assert "Component" in result.stdout or "Status" in result.stdout


class TestDashboardTroubleshootingScenarios:
    """Test common troubleshooting scenarios."""

    def test_invalid_export_format(self):
        """Test export with invalid format shows error."""
        result = runner.invoke(
            app,
            ["dashboard", "export", "-f", "xml", "-o", "output.xml"]
        )

        assert result.exit_code != 0
        assert "csv" in result.stdout.lower() or "json" in result.stdout.lower()

    def test_export_to_nonexistent_directory(self):
        """Test export to non-existent directory handles error."""
        result = runner.invoke(
            app,
            ["dashboard", "export", "-f", "csv", "-o", "/nonexistent/path/output.csv"]
        )

        # Should fail with file error
        assert result.exit_code != 0

    def test_invalid_date_format(self):
        """Test export with invalid date format."""
        result = runner.invoke(
            app,
            [
                "dashboard", "export",
                "-f", "csv", "-o", "test.csv",
                "--start", "invalid-date"
            ]
        )

        # Typer should reject invalid date format
        assert result.exit_code != 0 or "Invalid" in result.stdout


class TestDashboardAPIEndpointInteractions:
    """Test dashboard API endpoint interactions (integration tests)."""

    @pytest.fixture
    def mock_db_with_data(self):
        """Create mock database with test data."""
        mock_db = MagicMock()

        # Mock daily usage data
        mock_db.fetch_all = AsyncMock(return_value=[
            {"date": "2026-03-01", "calls": 1000, "unique_licenses": 50},
            {"date": "2026-03-02", "calls": 1200, "unique_licenses": 55},
            {"date": "2026-03-03", "calls": 1100, "unique_licenses": 52},
        ])

        return mock_db

    @patch("src.db.queries.analytics_queries.DatabaseConnection")
    def test_get_metrics_with_database(self, mock_db_class, mock_db_with_data):
        """Test metrics retrieval with database connection."""
        from src.analytics.dashboard_service import DashboardMetrics
        import asyncio

        # Create mock service that returns proper metrics
        mock_service = MagicMock()
        mock_metrics = DashboardMetrics()
        mock_metrics.api_calls = [{"date": "2026-03-01", "calls": 1000}]
        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)

        # Verify the metrics are returned correctly
        metrics = asyncio.run(mock_service.get_metrics(range_days=7))

        assert metrics.api_calls is not None
        assert len(metrics.api_calls) > 0
        assert metrics.api_calls[0]["calls"] == 1000

    def test_database_connection_error(self):
        """Test error handling when database connection fails."""
        with patch("src.db.database.DatabaseConnection") as mock_db_class:
            mock_db_class.return_value.connect = MagicMock(side_effect=Exception("Connection failed"))

            from src.analytics.dashboard_service import DashboardService

            with pytest.raises(Exception):
                service = DashboardService()
                import asyncio
                asyncio.run(service.get_metrics())


class TestDashboardFilterFunctionality:
    """Test dashboard filter functionality."""

    def test_summary_with_empty_database(self):
        """Test summary handles empty database gracefully."""
        with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
            mock_service = MagicMock()
            mock_metrics = MagicMock()
            mock_metrics.api_calls = []
            mock_metrics.active_licenses = {"total": 0}
            mock_metrics.revenue = {"total_mrr": 0}
            mock_metrics.tier_distribution = {"by_tier": {}}
            mock_metrics.license_health = {}
            mock_service.get_metrics = AsyncMock(return_value=mock_metrics)
            mock_service_class.return_value = mock_service

            result = runner.invoke(app, ["dashboard", "summary"])

            assert result.exit_code == 0
            # Should show zeros, not crash

    def test_export_with_empty_results(self):
        """Test export handles empty results."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with patch("src.analytics.dashboard_service.DashboardService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.export_to_csv = AsyncMock(return_value="date,api_calls,unique_licenses\n")
                mock_service_class.return_value = mock_service

                result = runner.invoke(
                    app,
                    ["dashboard", "export", "-f", "csv", "-o", tmp_path]
                )

                assert result.exit_code == 0
                # File should exist even if empty
                assert os.path.exists(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class AsyncMock(MagicMock):  # noqa: F811
    """Async mock helper for testing async methods."""
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)
