"""
Tests for RaaS Sync Client (Phase 5 Enhanced)

Tests sync client with encryption, entitlements, and webhook integration.
"""

from unittest.mock import Mock, patch

from src.raas.sync_client import (
    SyncClient,
    get_sync_client,
    reset_sync_client,
)


class TestSyncClient:
    """Test SyncClient class."""

    def setup_method(self):
        """Reset client before each test."""
        reset_sync_client()

    def test_init_default(self):
        """Test initialization with defaults."""
        client = SyncClient()

        assert client.gateway is not None
        assert client.telemetry is not None
        assert client.validator is not None
        assert client.encryptor is not None
        assert client.webhook_bridge is not None

    def test_init_with_mocks(self):
        """Test initialization with mocked dependencies."""
        mock_gateway = Mock()
        mock_telemetry = Mock()
        mock_encryptor = Mock()
        mock_bridge = Mock()

        client = SyncClient(
            gateway_client=mock_gateway,
            telemetry=mock_telemetry,
            encryptor=mock_encryptor,
            webhook_bridge=mock_bridge,
        )

        assert client.gateway is mock_gateway
        assert client.telemetry is mock_telemetry
        assert client.encryptor is mock_encryptor
        assert client.webhook_bridge is mock_bridge


class TestSyncClientValidateLicense:
    """Test license validation."""

    def setup_method(self):
        reset_sync_client()

    @patch("src.raas.sync_client.RaasGateValidator")
    def test_validate_license_success(self, mock_validator_class):
        """Test successful license validation."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_validator_class.return_value = mock_validator

        client = SyncClient()
        is_valid, error = client.validate_license()

        assert is_valid is True
        assert error is None
        assert client._license_valid is True

    @patch("src.raas.sync_client.RaasGateValidator")
    def test_validate_license_invalid(self, mock_validator_class):
        """Test invalid license."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (False, "Invalid key")
        mock_validator_class.return_value = mock_validator

        client = SyncClient()
        is_valid, error = client.validate_license()

        assert is_valid is False
        assert error == "Invalid key"


class TestSyncClientGetUsageSummary:
    """Test usage summary retrieval."""

    def setup_method(self):
        reset_sync_client()

    def test_get_usage_summary_empty(self):
        """Test getting empty summary."""
        client = SyncClient()

        # Mock telemetry to return empty metrics
        client.telemetry.get_metrics = Mock(return_value=[])

        summary = client.get_usage_summary()

        assert summary.total_requests == 0
        assert summary.total_payload_size == 0

    def test_get_usage_summary_with_metrics(self):
        """Test getting summary with metrics."""
        client = SyncClient()

        # Mock telemetry to return metrics
        client.telemetry.get_metrics = Mock(return_value=[
            {"endpoint": "/api/test", "method": "POST", "payload_size": 100, "timestamp": "2024-01-01T10:00:00Z"},
            {"endpoint": "/api/test", "method": "GET", "payload_size": 200, "timestamp": "2024-01-01T10:30:00Z"},
        ])

        summary = client.get_usage_summary()

        assert summary.total_requests == 2
        assert summary.total_payload_size == 300
        assert summary.endpoints["/api/test"] == 2


class TestSyncClientFetchEntitlements:
    """Test entitlement fetching."""

    def setup_method(self):
        reset_sync_client()

    @patch("src.raas.sync_client.GatewayClient")
    def test_fetch_entitlements_success(self, mock_gateway_class):
        """Test successful entitlement fetch."""
        mock_gateway = Mock()
        mock_gateway.get.return_value = Mock(
            data={
                "tenant_id": "tenant_123",
                "tier": "pro",
                "features": ["feature1", "feature2"],
                "rateLimit": 120,
                "maxPayloadSize": 2097152,
                "retentionDays": 60,
            }
        )
        mock_gateway_class.return_value = mock_gateway

        client = SyncClient()
        entitlements = client.fetch_entitlements("mk_test_key")

        assert entitlements["tenant_id"] == "tenant_123"
        assert entitlements["tier"] == "pro"
        assert len(entitlements["features"]) == 2
        assert entitlements["rate_limit"] == 120

    @patch("src.raas.sync_client.GatewayClient")
    def test_fetch_entitlements_gateway_error(self, mock_gateway_class):
        """Test entitlement fetch with gateway error."""
        mock_gateway = Mock()
        mock_gateway.get.side_effect = Exception("Gateway unreachable")
        mock_gateway_class.return_value = mock_gateway

        client = SyncClient()
        entitlements = client.fetch_entitlements()

        assert "error" in entitlements
        assert entitlements["tier"] == "free"


class TestSyncClientSyncMetricsEncrypted:
    """Test encrypted sync metrics."""

    def setup_method(self):
        reset_sync_client()

    @patch("src.raas.sync_client.GatewayClient")
    @patch("src.raas.sync_client.RaasGateValidator")
    def test_sync_metrics_encrypted_dry_run(
        self, mock_validator_class, mock_gateway_class
    ):
        """Test encrypted sync in dry run mode."""
        # Mock validator
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_validator.get_last_result.return_value = {"tenant_id": "tenant_123"}
        mock_validator_class.return_value = mock_validator

        # Mock gateway
        mock_gateway = Mock()
        mock_gateway_class.return_value = mock_gateway

        # Mock telemetry
        client = SyncClient()
        client.telemetry.get_metrics = Mock(return_value=[
            {"endpoint": "/api/test", "method": "POST", "payload_size": 100, "timestamp": "2024-01-01T10:00:00Z"},
        ])

        result = client.sync_metrics_encrypted(dry_run=True)

        assert result.success is True
        assert result.synced_count > 0
        assert result.gateway_response["dry_run"] is True

    @patch("src.raas.sync_client.GatewayClient")
    @patch("src.raas.sync_client.RaasGateValidator")
    def test_sync_metrics_encrypted_invalid_license(
        self, mock_validator_class, mock_gateway_class
    ):
        """Test encrypted sync with invalid license."""
        # Mock validator
        mock_validator = Mock()
        mock_validator.validate.return_value = (False, "Invalid license")
        mock_validator_class.return_value = mock_validator

        client = SyncClient()

        result = client.sync_metrics_encrypted()

        assert result.success is False
        assert result.error == "Invalid license"

    @patch("src.raas.sync_client.GatewayClient")
    @patch("src.raas.sync_client.RaasGateValidator")
    def test_sync_metrics_encrypted_no_tenant(
        self, mock_validator_class, mock_gateway_class
    ):
        """Test encrypted sync without tenant ID."""
        # Mock validator
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_validator.get_last_result.return_value = None
        mock_validator_class.return_value = mock_validator

        client = SyncClient()

        result = client.sync_metrics_encrypted()

        assert result.success is False
        assert "Cannot determine tenant ID" in result.error


class TestSyncClientSyncMetrics:
    """Test original sync metrics (backward compatibility)."""

    def setup_method(self):
        reset_sync_client()

    @patch("src.raas.sync_client.GatewayClient")
    @patch("src.raas.sync_client.RaasGateValidator")
    def test_sync_metrics_dry_run(self, mock_validator_class, mock_gateway_class):
        """Test sync metrics in dry run mode."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_validator_class.return_value = mock_validator

        mock_gateway = Mock()
        mock_gateway_class.return_value = mock_gateway

        client = SyncClient()
        client.telemetry.get_metrics = Mock(return_value=[])

        result = client.sync_metrics(dry_run=True)

        assert result.success is True


class TestSyncClientGetSyncStatus:
    """Test sync status retrieval."""

    def setup_method(self):
        reset_sync_client()

    @patch("src.raas.sync_client.GatewayClient")
    @patch("src.raas.sync_client.RaasGateValidator")
    def test_get_sync_status(self, mock_validator_class, mock_gateway_class):
        """Test getting sync status."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_validator.get_last_result.return_value = None
        mock_validator_class.return_value = mock_validator

        mock_gateway = Mock()
        mock_gateway.get_circuit_status.return_value = {}
        mock_gateway_class.return_value = mock_gateway

        client = SyncClient()
        client.telemetry.get_metrics = Mock(return_value=[])

        status = client.get_sync_status()

        assert status["license_valid"] is True
        assert status["license_error"] is None
        assert "metrics_count" in status


class TestSyncClientPhase5Summary:
    """Test Phase 5 summary building."""

    def setup_method(self):
        reset_sync_client()

    def test_get_phase5_summary_empty(self):
        """Test getting Phase 5 summary with no metrics."""
        client = SyncClient()
        client.telemetry.get_metrics = Mock(return_value=[])

        summary = client._get_phase5_summary()

        assert summary.total_requests == 0
        assert summary.total_payload_size == 0

    def test_get_phase5_summary_with_metrics(self):
        """Test getting Phase 5 summary with metrics."""
        client = SyncClient()
        client.telemetry.get_metrics = Mock(return_value=[
            {
                "endpoint": "/api/test",
                "method": "POST",
                "payload_size": 100,
                "timestamp": "2024-01-01T10:00:00Z",
                "input_tokens": 50,
                "output_tokens": 25,
            },
        ])

        summary = client._get_phase5_summary()

        assert summary.total_requests == 1
        assert summary.total_payload_size == 100


class TestGetSyncClient:
    """Test global sync client functions."""

    def setup_method(self):
        reset_sync_client()

    def test_get_sync_client_creates_instance(self):
        """Test that get_sync_client creates instance."""
        client = get_sync_client()

        assert client is not None
        assert isinstance(client, SyncClient)

    def test_get_sync_client_singleton(self):
        """Test that get_sync_client returns same instance."""
        client1 = get_sync_client()
        client2 = get_sync_client()

        assert client1 is client2

    def test_reset_sync_client(self):
        """Test reset_sync_client clears instance."""
        client1 = get_sync_client()
        reset_sync_client()
        client2 = get_sync_client()

        assert client1 is not client2
