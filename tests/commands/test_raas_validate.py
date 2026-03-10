"""
Tests for RaaS License Validation Commands.

Tests validate-license and license-status commands with certificate-based authentication.
"""

import pytest
from unittest.mock import Mock, patch
from typer.testing import CliRunner

from src.commands.raas_validate import app
from src.core.raas_auth import AuthResult, TenantContext


runner = CliRunner()


class TestValidateLicenseCommand:
    """Test validate-license command."""

    @pytest.fixture
    def mock_auth_client(self):
        """Mock RaaSAuthClient."""
        with patch("src.core.raas_auth.RaaSAuthClient") as mock:
            yield mock

    @pytest.fixture
    def mock_valid_result(self):
        """Mock valid auth result."""
        from datetime import datetime, timezone, timedelta
        return AuthResult(
            valid=True,
            tenant=TenantContext(
                tenant_id="tenant-123",
                tier="pro",
                role="pro",
                license_key="mk_test_key",
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
                features=["feature1", "feature2"],
            ),
        )

    @pytest.fixture
    def mock_invalid_result(self):
        """Mock invalid auth result."""
        return AuthResult(
            valid=False,
            error="Invalid license key",
            error_code="invalid_license",
        )

    def test_validate_license_no_key(self, mock_auth_client):
        """Test validation with no license key."""
        result = runner.invoke(app, ["validate-license"])

        assert result.exit_code == 1
        assert "No license key provided" in result.stdout
        assert "RAAS_LICENSE_KEY" in result.stdout

    def test_validate_license_with_key_option(self, mock_auth_client, mock_valid_result):
        """Test validation with --key option."""
        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_valid_result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key"])

        assert result.exit_code == 0
        assert "License validated successfully" in result.stdout
        mock_client.validate_credentials.assert_called_once_with("mk_test_key")

    def test_validate_license_from_env(self, mock_auth_client, mock_valid_result, monkeypatch):
        """Test validation from environment variable."""
        monkeypatch.setenv("RAAS_LICENSE_KEY", "mk_env_key")

        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_valid_result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license"])

        assert result.exit_code == 0
        mock_client.validate_credentials.assert_called_once_with("mk_env_key")

    def test_validate_license_failure(self, mock_auth_client, mock_invalid_result):
        """Test validation failure."""
        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_invalid_result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_invalid_key"])

        assert result.exit_code == 1
        assert "License validation failed" in result.stdout
        assert "Invalid license key" in result.stdout

    def test_validate_license_check_mode(self, mock_auth_client):
        """Test --check mode (status only, no validation)."""
        mock_client = Mock()
        mock_client._session_cache = None
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--check"])

        assert result.exit_code == 0
        assert "License Status" in result.stdout
        # validate_credentials should NOT be called in check mode
        mock_client.validate_credentials.assert_not_called()

    def test_validate_license_renew_mode(self, mock_auth_client, mock_valid_result):
        """Test --renew mode (certificate rotation)."""
        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_valid_result
        mock_client.get_certificate_status.return_value = {"has_certificate": True}
        mock_client._certificate_store = Mock()
        mock_client.rotate_certificate.return_value = {"success": True}
        mock_client._get_certificate_headers.return_value = {}  # Fix: return empty dict
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key", "--renew"])

        assert result.exit_code == 0
        # rotate_certificate should be called
        mock_client.rotate_certificate.assert_called_once()

    def test_validate_license_no_cert_mode(self, mock_auth_client, mock_valid_result):
        """Test --no-cert mode (disable certificate auth)."""
        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_valid_result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key", "--no-cert"])

        assert result.exit_code == 0
        # Client should be initialized without certificate auth
        mock_auth_client.assert_called_with(use_certificate_auth=False)

    def test_validate_license_with_certificate(self, mock_auth_client, mock_valid_result):
        """Test validation with certificate-based auth."""
        mock_client = Mock()
        mock_client.validate_credentials.return_value = mock_valid_result
        mock_client.get_certificate_status.return_value = {
            "has_certificate": True,
            "certificate_id": "CERT-test-123",
            "is_valid": True,
            "should_rotate": False,
        }
        mock_client._certificate_store = Mock()
        mock_client._get_certificate_headers.return_value = {
            "Authorization": "Bearer mk_test...",
            "X-Cert-ID": "CERT-test-123",
            "X-Cert-Sig": "3045022100abc123...",
            "X-Cert-Timestamp": "2026-03-08T19:00:00Z",
        }
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key"])

        assert result.exit_code == 0
        assert "Certificate:" in result.stdout
        assert "CERT-test-123" in result.stdout
        assert "API Headers" in result.stdout

    def test_validate_license_expiring_soon(self, mock_auth_client):
        """Test validation with expiring license."""
        from datetime import datetime, timezone, timedelta
        result = AuthResult(
            valid=True,
            tenant=TenantContext(
                tenant_id="tenant-123",
                tier="pro",
                role="pro",
                expires_at=datetime.now(timezone.utc) + timedelta(days=5),
            ),
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key"])

        assert result.exit_code == 0
        assert "Expiring soon" in result.stdout

    def test_validate_license_expired(self, mock_auth_client):
        """Test validation with expired license."""
        from datetime import datetime, timezone, timedelta
        result = AuthResult(
            valid=True,
            tenant=TenantContext(
                tenant_id="tenant-123",
                tier="pro",
                role="pro",
                expires_at=datetime.now(timezone.utc) - timedelta(days=1),
            ),
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_test_key"])

        assert result.exit_code == 0
        # Should show warning for expired/negative days
        assert "Expiring soon!" in result.stdout or "Expired" in result.stdout


class TestLicenseStatusCommand:
    """Test license-status command."""

    @pytest.fixture
    def mock_auth_client(self):
        """Mock RaaSAuthClient."""
        with patch("src.core.raas_auth.RaaSAuthClient") as mock:
            yield mock

    def test_license_status(self, mock_auth_client, monkeypatch):
        """Test license status display."""
        mock_client = Mock()
        mock_client._session_cache = None
        mock_client._certificate_store = None
        mock_client._load_credentials.return_value = {"token": None}
        mock_auth_client.return_value = mock_client

        monkeypatch.delenv("RAAS_LICENSE_KEY", raising=False)

        result = runner.invoke(app, ["license-status"])

        assert result.exit_code == 0
        assert "License Status" in result.stdout
        assert "RAAS_LICENSE_KEY env" in result.stdout
        assert "Stored credentials" in result.stdout

    def test_license_status_with_env_key(self, mock_auth_client, monkeypatch):
        """Test license status with env key set."""
        monkeypatch.setenv("RAAS_LICENSE_KEY", "mk_test_key")

        mock_client = Mock()
        mock_client._session_cache = None
        mock_client._certificate_store = None
        mock_client._load_credentials.return_value = {"token": None}
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["license-status"])

        assert result.exit_code == 0
        assert "RAAS_LICENSE_KEY env: Set" in result.stdout

    def test_license_status_with_session_cache(self, mock_auth_client):
        """Test license status with active session cache."""
        from datetime import datetime, timezone
        from src.core.raas_auth import SessionCache

        cache = SessionCache(
            tenant_id="tenant-123",
            tier="pro",
            role="pro",
            cached_at=datetime.now(timezone.utc),
        )

        mock_client = Mock()
        mock_client._session_cache = cache
        mock_client._certificate_store = None
        mock_client._load_credentials.return_value = {"token": "mk_test"}
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["license-status"])

        assert result.exit_code == 0
        assert "Session Cache" in result.stdout
        assert "tenant-123" in result.stdout

    def test_license_status_with_certificate(self, mock_auth_client):
        """Test license status with certificate."""
        mock_client = Mock()
        mock_client._session_cache = None
        mock_client._certificate_store = Mock()
        mock_client.get_certificate_status.return_value = {
            "has_certificate": True,
            "certificate_id": "CERT-test-123",
            "is_valid": True,
            "should_rotate": False,
        }
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["license-status"])

        assert result.exit_code == 0
        assert "Certificate:" in result.stdout
        assert "CERT-test-123" in result.stdout

    def test_license_status_error(self, mock_auth_client):
        """Test license status with error."""
        mock_auth_client.side_effect = Exception("Connection failed")

        result = runner.invoke(app, ["license-status"])

        assert result.exit_code == 1
        assert "Error:" in result.stdout


class TestValidateLicenseErrors:
    """Test specific error scenarios."""

    @pytest.fixture
    def mock_auth_client(self):
        """Mock RaaSAuthClient."""
        with patch("src.core.raas_auth.RaaSAuthClient") as mock:
            yield mock

    def test_missing_credentials_error(self, mock_auth_client):
        """Test missing credentials error."""
        from src.core.raas_auth import AuthResult
        result = AuthResult(
            valid=False,
            error="No credentials provided",
            error_code="missing_credentials",
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license"])

        assert result.exit_code == 1
        assert "No license key provided" in result.stdout

    def test_invalid_api_key_format_error(self, mock_auth_client):
        """Test invalid API key format error."""
        from src.core.raas_auth import AuthResult
        result = AuthResult(
            valid=False,
            error="Invalid API key format",
            error_code="invalid_api_key_format",
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "mk_short"])

        assert result.exit_code == 1
        assert "Invalid API key format" in result.stdout

    def test_token_expired_error(self, mock_auth_client):
        """Test expired token error."""
        from src.core.raas_auth import AuthResult
        result = AuthResult(
            valid=False,
            error="Token expired",
            error_code="token_expired",
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "jwt.expired.token"])

        assert result.exit_code == 1
        assert "expired" in result.stdout.lower()

    def test_unknown_format_error(self, mock_auth_client):
        """Test unknown license format error."""
        from src.core.raas_auth import AuthResult
        result = AuthResult(
            valid=False,
            error="Unrecognized credential format",
            error_code="unknown_format",
        )

        mock_client = Mock()
        mock_client.validate_credentials.return_value = result
        mock_client.get_certificate_status.return_value = {"has_certificate": False}
        mock_client._certificate_store = None
        mock_auth_client.return_value = mock_client

        result = runner.invoke(app, ["validate-license", "--key", "invalid_key_format"])

        assert result.exit_code == 1
        assert "Unrecognized" in result.stdout


__all__ = [
    "TestValidateLicenseCommand",
    "TestLicenseStatusCommand",
    "TestValidateLicenseErrors",
]
