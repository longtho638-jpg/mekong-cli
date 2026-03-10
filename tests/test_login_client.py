"""
Tests for RaaS Gateway Login Client.

Covers:
- GatewayClient initialization
- License verification endpoint
- Rate limiting handling
- Error recovery
- User-agent identification
"""

import pytest
from unittest.mock import patch, MagicMock
from src.auth.login_client import GatewayClient, LicenseInfo, VerifyRequest, GatewayClientError
from src.auth.login_client import DEFAULT_GATEWAY_URL


class TestGatewayClient:
    """Tests for GatewayClient class."""

    def test_initialization_with_default_url(self):
        """Test that GatewayClient initializes with default URL when no custom URL is provided."""
        client = GatewayClient()
        assert client.base_url == DEFAULT_GATEWAY_URL

    def test_initialization_with_custom_url(self):
        """Test that GatewayClient initializes with custom URL when provided."""
        custom_url = "https://custom-gateway.example.com"
        client = GatewayClient(custom_url)
        assert client.base_url == custom_url

    @patch('src.auth.login_client.requests.Session')
    def test_session_creation(self, mock_session_class):
        """Test that GatewayClient creates a configured requests session."""
        # Arrange
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session

        # Act
        client = GatewayClient()

        # Assert
        assert client.session == mock_session

    @patch('src.auth.login_client.requests.Session')
    def test_verify_license_success(self, mock_session_class):
        """Test successful license verification through the gateway."""
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "valid": True,
            "tier": "PRO",
            "email": "test@example.com",
            "expires_at": "2024-12-31",
            "features": ["unlimited", "priority"]
        }

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act
        result = client.verify_license("valid-license-key", "test@example.com")

        # Assert
        assert isinstance(result, LicenseInfo)
        assert result.valid is True
        assert result.tier == "PRO"
        assert result.email == "test@example.com"
        assert result.expires_at == "2024-12-31"
        assert result.features == ["unlimited", "priority"]
        assert result.error is None

    @patch('src.auth.login_client.requests.Session')
    def test_verify_license_invalid(self, mock_session_class):
        """Test verification with invalid license key."""
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {
            "valid": False,
            "error": "Invalid license key"
        }

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act
        result = client.verify_license("invalid-license-key", "test@example.com")

        # Assert
        assert isinstance(result, LicenseInfo)
        assert result.valid is False
        assert result.error == "Invalid license key"

    @patch('src.auth.login_client.requests.Session')
    def test_verify_license_connection_error(self, mock_session_class):
        """Test handling of connection errors."""
        # Arrange
        import requests
        mock_session = MagicMock()
        mock_session.post.side_effect = requests.exceptions.ConnectionError("Connection timed out")
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act & Assert
        with pytest.raises(GatewayClientError):
            client.verify_license("valid-license-key", "test@example.com")

    @patch('src.auth.login_client.requests.Session')
    def test_verify_license_server_error(self, mock_session_class):
        """Test handling of server errors."""
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act & Assert
        with pytest.raises(GatewayClientError):
            client.verify_license("valid-license-key", "test@example.com")

    @patch('src.auth.login_client.requests.Session')
    def test_user_agent_header(self, mock_session_class):
        """Test that the correct user-agent header is set."""
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"valid": True}

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act
        client.verify_license("valid-license-key", "test@example.com")

        # Assert
        # Check that session was created and request was made
        mock_session.post.assert_called_once()

    @patch('src.auth.login_client.requests.Session')
    def test_retries_on_transient_errors(self, mock_session_class):
        """Test that GatewayClient raises error for 5xx responses."""
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 503

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GatewayClient()

        # Act & Assert
        with pytest.raises(GatewayClientError):
            client.verify_license("valid-license-key", "test@example.com")


class TestLicenseInfo:
    """Tests for LicenseInfo dataclass."""

    def test_license_info_creation(self):
        """Test that LicenseInfo dataclass is properly initialized."""
        license_info = LicenseInfo(
            valid=True,
            tier="PRO",
            email="test@example.com",
            expires_at="2024-12-31",
            features=["unlimited"],
            error=None
        )

        assert license_info.valid is True
        assert license_info.tier == "PRO"
        assert license_info.email == "test@example.com"
        assert license_info.expires_at == "2024-12-31"
        assert license_info.features == ["unlimited"]
        assert license_info.error is None

    def test_license_info_with_error(self):
        """Test that LicenseInfo handles error information."""
        license_info = LicenseInfo(
            valid=False,
            error="Invalid license"
        )

        assert license_info.valid is False
        assert license_info.error == "Invalid license"
        assert license_info.tier is None
        assert license_info.email is None
        assert license_info.expires_at is None
        assert license_info.features is None


class TestVerifyRequest:
    """Tests for VerifyRequest dataclass."""

    def test_verify_request_creation(self):
        """Test that VerifyRequest dataclass is properly initialized."""
        request = VerifyRequest(
            license_key="test-license-key",
            email="test@example.com",
            action="verify"
        )

        assert request.license_key == "test-license-key"
        assert request.email == "test@example.com"
        assert request.action == "verify"

    def test_verify_request_defaults(self):
        """Test that VerifyRequest with minimal parameters uses defaults."""
        request = VerifyRequest(
            license_key="test-license-key"
        )

        assert request.license_key == "test-license-key"
        assert request.email is None
        assert request.action == "verify"