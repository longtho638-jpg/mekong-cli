"""
Tests for Usage Commands — Phase 6 CLI Integration

Tests cover:
- Usage show command
- Usage sync command
- Usage overage command
- Usage export command

Part of Phase 6: CLI Integration with RaaS Gateway
"""

from unittest.mock import patch, MagicMock
from typer.testing import CliRunner
import json
import csv

from src.cli.usage_commands import app

runner = CliRunner()


class TestShowUsage:
    """Tests for usage show command."""

    @patch("src.core.gateway_client.GatewayClient")
    @patch("src.core.raas_auth.get_auth_client")
    @patch("os.getenv")
    def test_show_usage_success(self, mock_getenv, mock_auth, mock_gateway):
        """Test successful usage display."""
        # Mock env
        mock_getenv.return_value = "mk_test_key_123"

        # Mock auth
        mock_auth_client = MagicMock()
        mock_auth.return_value = mock_auth_client
        mock_session = MagicMock()
        mock_session.authenticated = False
        mock_auth_client.get_session.return_value = mock_session

        # Mock gateway response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "metrics": [
                {"event_type": "cli:command", "input_tokens": 100, "output_tokens": 50, "duration_ms": 100},
                {"event_type": "llm:call", "input_tokens": 200, "output_tokens": 100, "duration_ms": 200},
            ],
            "summary": {
                "total_requests": 500,
                "total_tokens": 150000,
                "total_duration_ms": 50000,
                "unique_endpoints": 5,
            },
        }

        # Mock requests
        with patch("requests.get", return_value=mock_response):
            result = runner.invoke(app, ["show", "-k", "mk_test_key_123"])

            assert result.exit_code == 0
            assert "Usage Report" in result.output
            assert "Total Requests" in result.output

    @patch("os.getenv")
    def test_show_usage_no_key(self, mock_getenv):
        """Test when no license key is provided."""
        mock_getenv.return_value = None

        with patch("src.core.raas_auth.RaaSAuthClient") as mock_client:
            mock_instance = MagicMock()
            mock_client.return_value = mock_instance
            mock_instance.get_session.return_value = MagicMock(authenticated=False)

            result = runner.invoke(app, ["show"])

            assert result.exit_code == 0
            assert "No license key provided" in result.output

    def test_show_usage_verbose(self):
        """Test verbose output."""
        with patch("src.cli.usage_commands._display_local_usage") as mock_display:
            result = runner.invoke(app, ["show", "-k", "mk_test", "-v"])

            assert result.exit_code == 0
            mock_display.assert_called_once()


class TestSyncUsage:
    """Tests for usage sync command."""

    def test_sync_no_data(self, tmp_path):
        """Test sync when no usage data exists."""
        with patch("pathlib.Path.home") as mock_home:
            mock_home.return_value = tmp_path
            result = runner.invoke(app, ["sync"])

            assert result.exit_code == 0
            assert "No local usage data found" in result.output

    def test_sync_dry_run(self, tmp_path):
        """Test sync in dry-run mode."""
        usage_dir = tmp_path / ".mekong" / "usage"
        usage_dir.mkdir(parents=True)
        (usage_dir / "usage_1.json").write_text('{"events": []}')
        (usage_dir / "usage_2.json").write_text('{"events": []}')

        with patch("pathlib.Path.home", return_value=tmp_path):
            result = runner.invoke(app, ["sync", "--dry-run"])

            assert result.exit_code == 0
            assert "Dry Run Mode" in result.output
            assert "Would sync" in result.output

    @patch("src.raas.sync_client.get_sync_client")
    def test_sync_success(self, mock_sync_client, tmp_path):
        """Test successful sync."""
        usage_dir = tmp_path / ".mekong" / "usage"
        usage_dir.mkdir(parents=True)

        usage_file = usage_dir / "usage_test.json"
        usage_file.write_text('{"events": [{"event_id": "evt_1"}]}')

        mock_client = MagicMock()
        mock_client.sync_usage_batch.return_value = {"success": True}
        mock_sync_client.return_value = mock_client

        with patch("pathlib.Path.home", return_value=tmp_path):
            result = runner.invoke(app, ["sync"])

            assert result.exit_code == 0
            assert "Synced" in result.output


class TestCalculateOverage:
    """Tests for overage calculation command."""

    @patch("src.core.gateway_client.GatewayClient")
    @patch("src.core.raas_auth.get_auth_client")
    @patch("os.getenv")
    def test_overage_from_gateway(self, mock_getenv, mock_auth, mock_gateway):
        """Test overage calculation from gateway."""
        mock_getenv.return_value = "mk_test_key"

        mock_auth_client = MagicMock()
        mock_auth.return_value = mock_auth_client
        mock_session = MagicMock()
        mock_session.authenticated = False
        mock_auth_client.get_session.return_value = mock_session

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "usage_summary": {
                "total_requests": 15000,
                "included_quota": 10000,
                "overage_requests": 5000,
            },
            "overage_status": {
                "overage_rate": 0.001,
                "status": "pending",
            },
        }

        with patch("requests.get", return_value=mock_response):
            result = runner.invoke(app, ["overage", "-k", "mk_test_key"])

            assert result.exit_code == 0
            assert "Overage" in result.output

    @patch("requests.get")
    def test_overage_estimate(self, mock_get):
        """Test overage estimate when gateway unavailable."""
        mock_get.side_effect = Exception("Gateway unavailable")

        result = runner.invoke(app, ["overage", "-k", "mk_test"])

        assert result.exit_code == 0
        assert "Estimate" in result.output or "Overage" in result.output


class TestExportUsage:
    """Tests for usage export command."""

    def test_export_json(self, tmp_path):
        """Test JSON export."""
        output_file = tmp_path / "usage_export.json"

        with patch("src.cli.usage_commands._generate_export_data") as mock_gen:
            mock_gen.return_value = {
                "exported_at": "2026-03-09T00:00:00Z",
                "period": "current",
                "total_events": 2,
                "events": [
                    {"event_id": "evt_001", "event_type": "cli:command", "timestamp": "2026-03-09T00:00:00Z"},
                    {"event_id": "evt_002", "event_type": "llm:call", "timestamp": "2026-03-09T01:00:00Z"},
                ],
            }
            result = runner.invoke(
                app,
                ["export", "-f", "json", "-o", str(output_file)],
            )

            assert result.exit_code == 0
            assert output_file.exists()

            with open(output_file) as f:
                data = json.load(f)

            assert "events" in data
            assert len(data["events"]) == 2

    def test_export_csv(self, tmp_path):
        """Test CSV export."""
        output_file = tmp_path / "usage_export.csv"

        with patch("src.cli.usage_commands._generate_export_data") as mock_gen:
            mock_gen.return_value = {
                "exported_at": "2026-03-09T00:00:00Z",
                "period": "current",
                "total_events": 2,
                "events": [
                    {
                        "event_id": "evt_001",
                        "event_type": "cli:command",
                        "timestamp": "2026-03-09T00:00:00Z",
                        "input_tokens": 100,
                        "output_tokens": 50,
                        "duration_ms": 100,
                        "endpoint": "/v1/cook",
                    },
                    {
                        "event_id": "evt_002",
                        "event_type": "llm:call",
                        "timestamp": "2026-03-09T01:00:00Z",
                        "input_tokens": 200,
                        "output_tokens": 100,
                        "duration_ms": 200,
                        "endpoint": "/v1/plan",
                    },
                ],
            }
            result = runner.invoke(
                app,
                ["export", "-f", "csv", "-o", str(output_file)],
            )

            assert result.exit_code == 0
            assert output_file.exists()

            with open(output_file) as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            assert len(rows) == 2
            assert rows[0]["event_id"] == "evt_001"
            assert rows[1]["event_id"] == "evt_002"

    def test_export_default_filename(self):
        """Test default filename generation."""
        with patch("src.cli.usage_commands._generate_export_data") as mock_gen:
            mock_gen.return_value = {"events": []}
            with patch("src.cli.usage_commands.datetime") as mock_dt:
                mock_dt.utcnow.return_value.strftime.return_value = "2026-03-09"
                result = runner.invoke(app, ["export", "-f", "json"])

        assert result.exit_code == 0
        assert "usage_2026-03-09.json" in result.output or "Export" in result.output


class TestUsageCommandsIntegration:
    """Integration tests for usage commands."""

    def test_usage_help(self):
        """Test usage command help."""
        result = runner.invoke(app, ["--help"])

        assert result.exit_code == 0
        assert "show" in result.output
        assert "sync" in result.output
        assert "overage" in result.output
        assert "export" in result.output

    def test_show_help(self):
        """Test show subcommand help."""
        result = runner.invoke(app, ["show", "--help"])

        assert result.exit_code == 0
        assert "Show current period usage" in result.output

    def test_sync_help(self):
        """Test sync subcommand help."""
        result = runner.invoke(app, ["sync", "--help"])

        assert result.exit_code == 0
        assert "Manually sync local metrics" in result.output

    def test_overage_help(self):
        """Test overage subcommand help."""
        result = runner.invoke(app, ["overage", "--help"])

        assert result.exit_code == 0
        assert "Calculate overage charges" in result.output

    def test_export_help(self):
        """Test export subcommand help."""
        result = runner.invoke(app, ["export", "--help"])

        assert result.exit_code == 0
        assert "Export usage data" in result.output
