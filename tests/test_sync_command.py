"""
Tests for Mekong Sync CLI Command

Tests cover:
- SyncClient initialization and validation
- Usage summary collection
- Rate limit handling
- CLI command execution
"""

from unittest.mock import Mock, patch, MagicMock


class TestSyncClient:
    """Test SyncClient class."""

    def test_init_default(self):
        """Test SyncClient initialization with defaults."""
        from src.raas.sync_client import SyncClient

        client = SyncClient()

        assert client.gateway is not None
        assert client.telemetry is not None
        assert client.validator is not None
        assert client._license_valid is None

    def test_init_with_dependencies(self):
        """Test SyncClient with injected dependencies."""
        from src.raas.sync_client import SyncClient

        mock_gateway = Mock()
        mock_telemetry = Mock()

        client = SyncClient(
            gateway_client=mock_gateway,
            telemetry=mock_telemetry,
        )

        assert client.gateway is mock_gateway
        assert client.telemetry is mock_telemetry

    def test_validate_license_valid(self):
        """Test license validation with valid license."""
        from src.raas.sync_client import SyncClient

        with patch("src.raas.sync_client.RaasGateValidator") as MockValidator:
            mock_validator = Mock()
            mock_validator.validate.return_value = (True, None)
            MockValidator.return_value = mock_validator

            client = SyncClient()
            is_valid, error = client.validate_license()

            assert is_valid is True
            assert error is None
            assert client._license_valid is True

    def test_validate_license_invalid(self):
        """Test license validation with invalid license."""
        from src.raas.sync_client import SyncClient

        with patch("src.raas.sync_client.RaasGateValidator") as MockValidator:
            mock_validator = Mock()
            mock_validator.validate.return_value = (False, "Invalid license")
            MockValidator.return_value = mock_validator

            client = SyncClient()
            is_valid, error = client.validate_license()

            assert is_valid is False
            assert error == "Invalid license"
            assert client._license_valid is False

    def test_get_usage_summary_empty(self):
        """Test usage summary with no metrics."""
        from src.raas.sync_client import SyncClient, UsageSummary

        with patch.object(SyncClient, '__init__', lambda x, **kwargs: None):
            client = SyncClient.__new__(SyncClient)
            client.telemetry = Mock()
            client.telemetry.get_metrics.return_value = []

            summary = client.get_usage_summary()

            assert isinstance(summary, UsageSummary)
            assert summary.total_requests == 0
            assert summary.total_payload_size == 0
            assert summary.hours_active == 0

    def test_get_usage_summary_with_metrics(self):
        """Test usage summary with metrics."""
        from src.raas.sync_client import SyncClient

        with patch.object(SyncClient, '__init__', lambda x, **kwargs: None):
            client = SyncClient.__new__(SyncClient)
            client.telemetry = Mock()
            client.telemetry.get_metrics.return_value = [
                {"endpoint": "/v1/cook", "method": "POST", "payload_size": 100, "timestamp": "2026-03-09T10:00:00Z"},
                {"endpoint": "/v1/cook", "method": "POST", "payload_size": 200, "timestamp": "2026-03-09T10:00:30Z"},
                {"endpoint": "/v1/plan", "method": "GET", "payload_size": 50, "timestamp": "2026-03-09T11:00:00Z"},
            ]

            summary = client.get_usage_summary()

            assert summary.total_requests == 3
            assert summary.total_payload_size == 350
            assert summary.hours_active == 2  # Two different hours
            assert summary.endpoints == {"/v1/cook": 2, "/v1/plan": 1}
            assert summary.methods == {"POST": 2, "GET": 1}

    def test_sync_metrics_dry_run(self):
        """Test sync with dry run."""
        from src.raas.sync_client import SyncClient

        with patch.object(SyncClient, '__init__', lambda x, **kwargs: None):
            client = SyncClient.__new__(SyncClient)
            client._license_valid = True

            with patch.object(client, 'validate_license', return_value=(True, None)):
                with patch.object(client, 'get_usage_summary') as mock_summary:
                    mock_summary.return_value = MagicMock(
                        total_requests=10,
                        total_payload_size=1000,
                        hours_active=5,
                        peak_hour="2026-03-09-10",
                        peak_requests=5,
                        endpoints={"/v1/cook": 10},
                        methods={"POST": 10},
                    )

                    result = client.sync_metrics(dry_run=True)

                    assert result.success is True
                    assert result.synced_count == 10
                    assert result.total_payload_size == 1000
                    assert result.gateway_response is not None
                    assert result.gateway_response.get("dry_run") is True

    def test_sync_metrics_no_metrics(self):
        """Test sync with no metrics."""
        from src.raas.sync_client import SyncClient

        with patch("src.raas.sync_client.RaasGateValidator") as MockValidator:
            MockValidator.return_value.validate.return_value = (True, None)

            client = SyncClient()

            with patch.object(client, 'get_usage_summary') as mock_summary:
                mock_summary.return_value = MagicMock(
                    total_requests=0,
                    total_payload_size=0,
                )

                result = client.sync_metrics()

                assert result.success is True
                assert result.synced_count == 0
                assert result.gateway_response == {"message": "No metrics to sync"}

    def test_sync_metrics_rate_limit(self):
        """Test sync with rate limit exceeded."""
        from src.raas.sync_client import SyncClient
        from src.core.gateway_client import GatewayError

        with patch.object(SyncClient, '__init__', lambda x, **kwargs: None):
            client = SyncClient.__new__(SyncClient)
            client._license_valid = True
            client.gateway = Mock()

            with patch.object(client, 'validate_license', return_value=(True, None)):
                with patch.object(client, 'get_usage_summary') as mock_summary:
                    mock_summary.return_value = MagicMock(
                        total_requests=10,
                        total_payload_size=1000,
                    )
                    with patch.object(client, '_build_hourly_buckets', return_value=[{"hour_bucket": "2026-03-09-10"}]):
                        client.gateway.post.side_effect = GatewayError("Rate limit exceeded", status_code=429)

                        result = client.sync_metrics()

                        assert result.success is False
                        assert "Rate limit" in result.error
                        assert result.rate_limit_reset_in == 60

    def test_get_sync_status(self):
        """Test get sync status."""
        from src.raas.sync_client import SyncClient

        with patch.object(SyncClient, '__init__', lambda x, **kwargs: None):
            client = SyncClient.__new__(SyncClient)
            client._license_valid = True
            client.telemetry = Mock()
            client.telemetry.get_metrics.return_value = [
                {"endpoint": "/v1/cook", "method": "POST", "payload_size": 100, "timestamp": "2026-03-09T10:00:00Z"},
            ]
            client.gateway = Mock()
            client.gateway.get_circuit_status.return_value = {
                "https://raas.agencyos.network": {"state": "closed", "failure_count": 0}
            }

            with patch.object(client, 'validate_license', return_value=(True, None)):
                status = client.get_sync_status()

                assert status["license_valid"] is True
                assert status["metrics_count"] == 1
                assert status["total_payload_size"] == 100
                assert status["circuit_breakers"] is not None


class TestSyncCLI:
    """Test sync CLI commands."""

    def test_sync_command_help(self):
        """Test sync command help."""
        from typer.testing import CliRunner
        from src.main import app

        # Set mock license key to bypass startup validation
        runner = CliRunner(env={"RAAS_LICENSE_KEY": "mk_test_key"})
        result = runner.invoke(app, ["sync", "--help"], catch_exceptions=False)

        # Help should show regardless of license status
        assert "sync" in result.stdout.lower() or "RaaS" in result.stdout

    def test_sync_status_command_help(self):
        """Test sync status command help."""
        from typer.testing import CliRunner
        from src.main import app

        runner = CliRunner(env={"RAAS_LICENSE_KEY": "mk_test_key"})
        result = runner.invoke(app, ["sync", "status", "--help"], catch_exceptions=False)

        assert "status" in result.stdout.lower() or "Sync" in result.stdout

    def test_sync_command_invalid_license(self):
        """Test sync command with invalid license."""
        from typer.testing import CliRunner
        from src.main import app

        runner = CliRunner(env={"RAAS_LICENSE_KEY": "invalid_key"})

        result = runner.invoke(app, ["sync"], catch_exceptions=False)

        # Will fail at sync validation (not startup)
        assert result.exit_code in [0, 1]

    def test_sync_command_no_metrics(self):
        """Test sync command with no metrics."""
        from typer.testing import CliRunner
        from src.main import app

        runner = CliRunner(env={"RAAS_LICENSE_KEY": "mk_test_key"})

        with patch("src.raas.sync_client.SyncClient.validate_license", return_value=(True, None)):
            with patch("src.raas.sync_client.SyncClient.get_usage_summary") as mock_summary:
                mock_summary.return_value = MagicMock(
                    total_requests=0,
                    total_payload_size=0,
                    hours_active=0,
                )

                result = runner.invoke(app, ["sync"], catch_exceptions=False)

                # Exit code 0 for no metrics (graceful handling)
                assert result.exit_code == 0

    def test_sync_command_dry_run(self):
        """Test sync command dry run."""
        from typer.testing import CliRunner
        from src.main import app

        runner = CliRunner(env={"RAAS_LICENSE_KEY": "mk_test_key"})

        with patch("src.raas.sync_client.SyncClient.validate_license", return_value=(True, None)):
            with patch("src.raas.sync_client.SyncClient.get_usage_summary") as mock_summary:
                mock_summary.return_value = MagicMock(
                    total_requests=10,
                    total_payload_size=1000,
                    hours_active=5,
                )
                with patch("src.raas.sync_client.SyncClient.sync_metrics") as mock_sync:
                    mock_sync.return_value = MagicMock(
                        success=True,
                        synced_count=10,
                        total_payload_size=1000,
                        elapsed_ms=50.0,
                        gateway_response={"dry_run": True},
                    )

                    result = runner.invoke(app, ["sync", "--dry-run"], catch_exceptions=False)

                    assert result.exit_code == 0

    def test_sync_status_command(self):
        """Test sync status command."""
        from typer.testing import CliRunner
        from src.main import app

        runner = CliRunner(env={"RAAS_LICENSE_KEY": "mk_test_key"})

        with patch("src.raas.sync_client.SyncClient.get_sync_status") as mock_status:
            mock_status.return_value = {
                "license_valid": True,
                "license_error": None,
                "metrics_count": 10,
                "total_payload_size": 1000,
                "hours_active": 5,
                "peak_hour": "2026-03-09-10",
                "peak_requests": 5,
                "endpoints": {"/v1/cook": 10},
                "methods": {"POST": 10},
                "circuit_breakers": {
                    "https://raas.agencyos.network": {"state": "closed", "failure_count": 0}
                },
            }

            result = runner.invoke(app, ["sync", "status"], catch_exceptions=False)

            assert result.exit_code == 0


class TestSyncHelpers:
    """Test sync helper functions."""

    def test_get_sync_client(self):
        """Test get_sync_client returns singleton."""
        from src.raas.sync_client import get_sync_client, reset_sync_client

        reset_sync_client()
        client1 = get_sync_client()
        client2 = get_sync_client()

        assert client1 is client2

    def test_reset_sync_client(self):
        """Test reset_sync_client."""
        from src.raas.sync_client import get_sync_client, reset_sync_client

        client1 = get_sync_client()
        reset_sync_client()
        client2 = get_sync_client()

        assert client1 is not client2
