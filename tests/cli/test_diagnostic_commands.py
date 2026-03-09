"""
Tests for Diagnostic Commands — Phase 6 CLI Integration

Tests cover:
- Gateway connectivity checks
- Auth validation tests
- Rate limit enforcement tests
- Full diagnostic suite

Part of Phase 6: CLI Integration with RaaS Gateway
"""

from unittest.mock import patch, MagicMock
from typer.testing import CliRunner

from src.cli.diagnostic_commands import app

runner = CliRunner()


class TestCheckGateway:
    """Tests for gateway connectivity check."""

    @patch("requests.head")
    @patch("requests.get")
    def test_gateway_success(self, mock_get, mock_head):
        """Test successful gateway connectivity."""
        # Mock head request
        mock_head_response = MagicMock()
        mock_head.return_value = mock_head_response

        # Mock health endpoint
        mock_health_response = MagicMock()
        mock_health_response.status_code = 200
        mock_health_response.json.return_value = {"status": "ok", "version": "2.0.0"}
        mock_health_response.headers = {
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "59",
        }
        mock_get.return_value = mock_health_response

        result = runner.invoke(app, ["gateway", "-u", "https://raas.test.network"])

        assert result.exit_code == 0
        assert "Gateway Connectivity Test" in result.output
        assert "✅" in result.output

    @patch("requests.head")
    def test_gateway_timeout(self, mock_head):
        """Test gateway timeout handling."""
        import requests
        mock_head.side_effect = requests.exceptions.Timeout("Connection timed out")

        result = runner.invoke(app, ["gateway", "-u", "https://raas.test.network", "-t", "1"])

        assert result.exit_code == 0
        assert "❌" in result.output
        assert "Timeout" in result.output

    @patch("requests.head")
    def test_gateway_connection_error(self, mock_head):
        """Test gateway connection error handling."""
        import requests
        mock_head.side_effect = requests.exceptions.ConnectionError("Failed to connect")

        result = runner.invoke(app, ["gateway", "-u", "https://raas.test.network"])

        assert result.exit_code == 0
        assert "❌" in result.output
        assert "Connection failed" in result.output


class TestCheckAuth:
    """Tests for credential validation check."""

    @patch("src.core.raas_auth.RaaSAuthClient")
    def test_auth_valid_credentials(self, mock_auth_client_class):
        """Test validation with valid credentials."""
        # Mock auth client
        mock_client = MagicMock()
        mock_auth_client_class.return_value = mock_client

        # Mock tenant context
        mock_tenant = MagicMock()
        mock_tenant.tenant_id = "tenant-123"
        mock_tenant.tier = "pro"
        mock_tenant.role = "owner"
        mock_tenant.features = ["feature1", "feature2"]

        # Mock validation result
        mock_result = MagicMock()
        mock_result.valid = True
        mock_result.tenant = mock_tenant
        mock_result.error = None
        mock_result.error_code = None

        mock_client.validate_credentials.return_value = mock_result

        result = runner.invoke(
            app,
            ["auth", "-t", "mk_test_key_123", "-g", "https://raas.test.network"],
        )

        assert result.exit_code == 0
        assert "✅ Valid" in result.output
        assert "tenant-123" in result.output
        assert "PRO" in result.output

    @patch("src.core.raas_auth.RaaSAuthClient")
    def test_auth_invalid_credentials(self, mock_auth_client_class):
        """Test validation with invalid credentials."""
        # Mock auth client
        mock_client = MagicMock()
        mock_auth_client_class.return_value = mock_client

        # Mock validation result
        mock_result = MagicMock()
        mock_result.valid = False
        mock_result.tenant = None
        mock_result.error = "Invalid API key"
        mock_result.error_code = "INVALID_KEY"

        mock_client.validate_credentials.return_value = mock_result

        result = runner.invoke(
            app,
            ["auth", "-t", "mk_invalid_key", "-g", "https://raas.test.network"],
        )

        assert result.exit_code == 0
        assert "❌ Invalid" in result.output
        assert "Invalid API key" in result.output

    @patch("src.core.raas_auth.RaaSAuthClient")
    @patch("os.getenv")
    def test_auth_no_credentials(self, mock_getenv, mock_auth_client_class):
        """Test when no credentials are provided."""
        mock_getenv.return_value = None

        mock_client = MagicMock()
        mock_auth_client_class.return_value = mock_client

        mock_session = MagicMock()
        mock_session.authenticated = False
        mock_client.get_session.return_value = mock_session

        result = runner.invoke(app, ["auth"])

        assert result.exit_code == 0
        assert "No credentials found" in result.output


class TestCheckRateLimit:
    """Tests for rate limit enforcement check."""

    @patch("requests.get")
    @patch("src.core.raas_auth.RaaSAuthClient")
    def test_rate_limit_success(self, mock_auth_client_class, mock_get):
        """Test successful rate limit check."""
        # Mock auth client
        mock_client = MagicMock()
        mock_auth_client_class.return_value = mock_client
        mock_session = MagicMock()
        mock_session.authenticated = False
        mock_client.get_session.return_value = mock_session

        # Mock rate limit response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "55",
            "X-RateLimit-Reset": "1709980800",
        }
        mock_get.return_value = mock_response

        result = runner.invoke(
            app,
            ["rate-limit", "-n", "3", "-g", "https://raas.test.network"],
        )

        assert result.exit_code == 0
        assert "Rate Limit" in result.output
        assert "60" in result.output
        assert "55" in result.output

    @patch("requests.get")
    @patch("src.core.raas_auth.RaaSAuthClient")
    def test_rate_limit_exhausted(self, mock_auth_client_class, mock_get):
        """Test when rate limit is exhausted (429)."""
        # Mock auth client
        mock_client = MagicMock()
        mock_auth_client_class.return_value = mock_client
        mock_session = MagicMock()
        mock_session.authenticated = False
        mock_client.get_session.return_value = mock_session

        # Mock 429 response
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "30",
        }
        mock_get.return_value = mock_response

        result = runner.invoke(
            app,
            ["rate-limit", "-n", "1", "-g", "https://raas.test.network"],
        )

        assert result.exit_code == 0
        assert "429" in result.output
        assert "Rate limit EXHAUSTED" in result.output or "⚠️" in result.output


class TestRunAllDiagnostics:
    """Tests for full diagnostic suite."""

    @patch("src.cli.diagnostic_commands.check_gateway_impl")
    @patch("src.cli.diagnostic_commands.check_auth_impl")
    @patch("src.cli.diagnostic_commands.check_rate_limit_impl")
    def test_all_diagnostics_pass(self, mock_rate_limit, mock_auth, mock_gateway):
        """Test when all diagnostics pass."""
        mock_gateway.side_effect = None
        mock_auth.side_effect = None
        mock_rate_limit.side_effect = None

        result = runner.invoke(app, ["all", "-g", "https://raas.test.network"])

        assert result.exit_code == 0
        assert "Full Diagnostic Suite" in result.output
        assert "All diagnostics passed" in result.output or "✅" in result.output

    @patch("src.cli.diagnostic_commands.check_gateway_impl")
    @patch("src.cli.diagnostic_commands.check_auth_impl")
    @patch("src.cli.diagnostic_commands.check_rate_limit_impl")
    def test_all_diagnostics_with_json_export(
        self, mock_rate_limit, mock_auth, mock_gateway, tmp_path
    ):
        """Test diagnostic suite with JSON export."""
        mock_gateway.side_effect = None
        mock_auth.side_effect = None
        mock_rate_limit.side_effect = None

        output_file = tmp_path / "diagnostic-report.json"

        result = runner.invoke(
            app,
            ["all", "-g", "https://raas.test.network", "-o", str(output_file)],
        )

        assert result.exit_code == 0
        assert output_file.exists()

        import json
        with open(output_file) as f:
            report = json.load(f)

        assert "timestamp" in report
        assert "tests" in report
        assert "overall_status" in report


class TestDiagnosticCommandsIntegration:
    """Integration tests for diagnostic commands."""

    def test_diagnostic_help(self):
        """Test diagnostic command help."""
        result = runner.invoke(app, ["--help"])

        assert result.exit_code == 0
        assert "gateway" in result.output
        assert "auth" in result.output
        assert "rate-limit" in result.output
        assert "all" in result.output

    def test_gateway_help(self):
        """Test gateway subcommand help."""
        result = runner.invoke(app, ["gateway", "--help"])

        assert result.exit_code == 0
        assert "Check RaaS Gateway connectivity" in result.output

    def test_auth_help(self):
        """Test auth subcommand help."""
        result = runner.invoke(app, ["auth", "--help"])

        assert result.exit_code == 0
        assert "Test credential validation" in result.output

    def test_rate_limit_help(self):
        """Test rate-limit subcommand help."""
        result = runner.invoke(app, ["rate-limit", "--help"])

        assert result.exit_code == 0
        assert "Test rate limit enforcement" in result.output

    def test_all_help(self):
        """Test all subcommand help."""
        result = runner.invoke(app, ["all", "--help"])

        assert result.exit_code == 0
        assert "Run full diagnostic suite" in result.output
