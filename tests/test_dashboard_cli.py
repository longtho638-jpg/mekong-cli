"""
CLI Tests for Dashboard/API Commands

Test suite for dashboard-related CLI commands.
"""
import pytest
from unittest.mock import patch, MagicMock
from typer.testing import CliRunner
import sys

# Add src to path for imports
sys.path.insert(0, "/Users/macbookprom1/mekong-cli/src")

from src.main import app


runner = CliRunner()


class TestDashboardCLI:
    """Tests for Dashboard CLI commands."""

    def test_analytics_command_shows_help(self):
        """Test mekong analytics --help shows help."""
        # Act
        result = runner.invoke(app, ["analytics", "--help"])

        # Assert
        assert result.exit_code == 0
        assert "Launch analytics dashboard" in result.stdout
        assert "--port" in result.stdout
        assert "--no-browser" in result.stdout

    def test_analytics_command_with_custom_port(self):
        """Test mekong analytics --port 9000 accepts port arg."""
        # Arrange
        with patch("src.api.dashboard.app.run_dashboard") as mock_run:
            mock_run.return_value = None

            # Act
            result = runner.invoke(app, ["analytics", "--port", "9000"])

            # Assert
            assert result.exit_code == 0
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            assert call_args[1]["port"] == 9000

    def test_analytics_command_default_port(self):
        """Test mekong analytics uses default port 8080."""
        # Arrange
        with patch("src.api.dashboard.app.run_dashboard") as mock_run:
            mock_run.return_value = None

            # Act
            result = runner.invoke(app, ["analytics"])

            # Assert
            assert result.exit_code == 0
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            assert call_args[1]["port"] == 8080

    def test_analytics_command_no_browser_flag(self):
        """Test mekong analytics --no-browser sets open_browser=False."""
        # Arrange
        with patch("src.api.dashboard.app.run_dashboard") as mock_run:
            mock_run.return_value = None

            # Act
            result = runner.invoke(app, ["analytics", "--no-browser"])

            # Assert
            assert result.exit_code == 0
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            assert call_args[1]["open_browser"] is False

    def test_main_menu_shows_analytics_command(self):
        """Test main menu shows analytics command."""
        # Act
        result = runner.invoke(app, [])

        # Assert
        assert result.exit_code == 0
        assert "analytics" in result.stdout.lower() or "📊" in result.stdout


class TestAnalyticsCLIErrorHandling:
    """Tests for Analytics CLI error handling."""

    def test_analytics_with_invalid_port(self):
        """Test mekong analytics with invalid port."""
        # Act
        result = runner.invoke(app, ["analytics", "--port", "not-a-number"])

        # Assert
        assert result.exit_code == 2  # Typer validation error

    def test_analytics_with_port_zero(self):
        """Test mekong analytics with port 0 (valid)."""
        # Arrange
        with patch("src.api.dashboard.app.run_dashboard") as mock_run:
            mock_run.return_value = None

            # Act
            result = runner.invoke(app, ["analytics", "--port", "0"])

            # Assert
            assert result.exit_code == 0
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            assert call_args[1]["port"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
