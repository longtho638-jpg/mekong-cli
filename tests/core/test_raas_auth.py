"""
Tests for RaaS Authentication Client

Tests cover:
- Credential validation (API key & JWT)
- Secure storage integration
- V2/V1 endpoint fallback
- Session management
- Migration logic
"""

import os
import json
import time
import pytest
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

from src.core.raas_auth import (
    RaaSAuthClient,
    TenantContext,
    AuthResult,
    get_auth_client,
)


class TestTenantContext:
    """Test TenantContext dataclass."""

    def test_create_tenant_context(self):
        """Test creating tenant context with required fields."""
        tenant = TenantContext(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
        )
        assert tenant.tenant_id == "test_tenant"
        assert tenant.tier == "pro"
        assert tenant.role == "owner"
        assert tenant.license_key is None
        assert tenant.features == []

    def test_tenant_context_with_expires(self):
        """Test tenant context with expiry timestamp."""
        expires = datetime.now(timezone.utc)
        tenant = TenantContext(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            expires_at=expires,
        )
        assert tenant.expires_at == expires


class TestAuthResult:
    """Test AuthResult dataclass."""

    def test_auth_result_valid(self):
        """Test valid auth result."""
        tenant = TenantContext(tenant_id="test", tier="pro", role="owner")
        result = AuthResult(valid=True, tenant=tenant)
        assert result.valid is True
        assert result.tenant == tenant
        assert result.error is None

    def test_auth_result_invalid(self):
        """Test invalid auth result with error."""
        result = AuthResult(
            valid=False,
            error="Invalid credentials",
            error_code="invalid_credentials",
        )
        assert result.valid is False
        assert result.error == "Invalid credentials"
        assert result.error_code == "invalid_credentials"


class TestRaaSAuthClientInit:
    """Test RaaSAuthClient initialization."""

    def test_default_init(self):
        """Test default initialization."""
        client = RaaSAuthClient()
        assert client.gateway_url == "https://raas.agencyos.network"
        assert client.credentials_path.suffix == ".json"
        assert client.use_secure_storage is True

    def test_custom_gateway_url(self):
        """Test initialization with custom gateway URL."""
        client = RaaSAuthClient(gateway_url="https://custom.gateway.com")
        assert client.gateway_url == "https://custom.gateway.com"

    def test_disable_secure_storage(self):
        """Test disabling secure storage."""
        client = RaaSAuthClient(use_secure_storage=False)
        assert client.use_secure_storage is False
        assert client._secure_storage is None

    @patch.dict(os.environ, {"RAAS_GATEWAY_URL": "https://env.gateway.com"})
    def test_env_gateway_url(self):
        """Test gateway URL from environment variable."""
        client = RaaSAuthClient()
        assert client.gateway_url == "https://env.gateway.com"


class TestCredentialValidation:
    """Test credential validation logic."""

    @pytest.fixture
    def client(self):
        """Create auth client with disabled secure storage for testing."""
        return RaaSAuthClient(use_secure_storage=False)

    def test_validate_no_credentials(self, client):
        """Test validation with no credentials provided."""
        result = client.validate_credentials()
        assert result.valid is False
        assert result.error_code == "missing_credentials"

    def test_validate_invalid_api_key_format(self, client):
        """Test validation with invalid API key format (too short)."""
        # mk_ key with length < 8 should fail
        # "mk_" has only 3 chars (needs at least 8)
        result = client.validate_credentials("mk_")
        assert result.valid is False
        assert result.error_code == "invalid_api_key_format"

    @patch("src.core.raas_auth.requests.post")
    def test_validate_valid_api_key_format(self, mock_post, client):
        """Test validation with valid API key format (format only, no gateway)."""
        # Mock gateway response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tenant_id": "test_tenant",
            "tier": "free",
            "role": "free",
        }
        mock_post.return_value = mock_response

        result = client.validate_credentials("mk_valid_key_12345")

        # With mocked gateway, should validate successfully
        assert result.valid is True
        assert result.tenant is not None
        assert result.tenant.tier == "free"

    def test_validate_invalid_jwt_format(self, client):
        """Test validation with invalid JWT format."""
        result = client.validate_credentials("not.a.jwt")
        # Invalid JWT payload
        assert result.valid is False
        assert result.error_code == "invalid_jwt_format"

    def test_validate_expired_jwt(self, client):
        """Test validation with expired JWT."""
        # Create expired JWT payload
        import base64
        header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b'=').decode()
        payload = base64.urlsafe_b64encode(b'{"exp":0}').rstrip(b'=').decode()
        signature = base64.urlsafe_b64encode(b'fake_signature').rstrip(b'=').decode()
        expired_jwt = f"{header}.{payload}.{signature}"

        result = client.validate_credentials(expired_jwt)
        assert result.valid is False
        assert result.error_code == "token_expired"

    def test_validate_unknown_format(self, client):
        """Test validation with unknown credential format."""
        result = client.validate_credentials("random_string")
        assert result.valid is False
        assert result.error_code == "unknown_format"


class TestGatewayValidation:
    """Test gateway validation with mocked responses."""

    @pytest.fixture
    def mock_response(self):
        """Create mock gateway response."""
        response = MagicMock()
        response.status_code = 200
        response.json.return_value = {
            "tenant_id": "mock_tenant",
            "tier": "pro",
            "role": "owner",
            "features": ["feature1", "feature2"],
            "expires_at": int(time.time()) + 86400,
        }
        return response

    @patch("src.core.raas_auth.requests.post")
    def test_validate_with_gateway_success(self, mock_post, mock_response):
        """Test validation with successful gateway response."""
        mock_post.return_value = mock_response
        client = RaaSAuthClient(use_secure_storage=False)

        result = client.validate_credentials("mk_test_key_12345")

        assert result.valid is True
        assert result.tenant is not None
        assert result.tenant.tenant_id == "mock_tenant"
        assert result.tenant.tier == "pro"
        assert "feature1" in result.tenant.features

    @patch("src.core.raas_auth.requests.post")
    def test_validate_gateway_401(self, mock_post):
        """Test validation with 401 unauthorized response."""
        response = MagicMock()
        response.status_code = 401
        mock_post.return_value = response
        client = RaaSAuthClient(use_secure_storage=False)

        result = client.validate_credentials("mk_invalid_key")

        assert result.valid is False
        assert result.error_code == "invalid_credentials"

    @patch("src.core.raas_auth.requests.post")
    def test_validate_gateway_403(self, mock_post):
        """Test validation with 403 forbidden response."""
        response = MagicMock()
        response.status_code = 403
        mock_post.return_value = response
        client = RaaSAuthClient(use_secure_storage=False)

        result = client.validate_credentials("mk_revoked_key")

        assert result.valid is False
        assert result.error_code == "credentials_revoked"

    @patch("src.core.raas_auth.requests.post")
    def test_validate_gateway_404_fallback_to_v1(self, mock_post):
        """Test V2 endpoint 404 falls back to V1."""
        # First call (V2) returns 404, second call (V1) returns 200
        response_404 = MagicMock()
        response_404.status_code = 404
        response_200 = MagicMock()
        response_200.status_code = 200
        response_200.json.return_value = {
            "tenant_id": "v1_tenant",
            "tier": "free",
            "role": "user",
        }
        mock_post.side_effect = [response_404, response_200]

        client = RaaSAuthClient(use_secure_storage=False)
        result = client.validate_credentials("mk_test_key", use_v2=True)

        assert result.valid is True
        assert result.tenant.tenant_id == "v1_tenant"
        assert mock_post.call_count == 2

    @patch("src.core.raas_auth.requests.post")
    def test_validate_gateway_network_error_fallback_local(self, mock_post):
        """Test network error falls back to local validation."""
        import requests
        mock_post.side_effect = requests.exceptions.ConnectionError("Network error")
        client = RaaSAuthClient(use_secure_storage=False)

        result = client.validate_credentials("mk_test_key")

        # Local validation should return valid for mk_ keys
        assert result.valid is True
        assert result.tenant is not None
        assert result.tenant.tier == "free"
        assert result.tenant.tenant_id == "local"


class TestSecureStorageIntegration:
    """Test secure storage integration."""

    @pytest.fixture
    def temp_credentials_file(self, tmp_path):
        """Create temporary credentials file."""
        creds_file = tmp_path / "credentials.json"
        yield creds_file

    @patch("src.core.raas_auth.get_secure_storage")
    def test_save_credentials_secure_storage(
        self, mock_get_storage, temp_credentials_file
    ):
        """Test saving credentials uses secure storage when available."""
        mock_storage = MagicMock()
        mock_get_storage.return_value = mock_storage

        client = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(temp_credentials_file),
        )
        client._save_credentials({"token": "mk_test_token"})

        # Secure storage should be called
        mock_storage.store_license.assert_called_once_with("mk_test_token")
        # File should NOT be written
        assert not temp_credentials_file.exists()

    @patch("src.core.raas_auth.get_secure_storage")
    def test_save_credentials_fallback_file(
        self, mock_get_storage, temp_credentials_file
    ):
        """Test saving credentials falls back to file when secure storage unavailable."""
        mock_get_storage.side_effect = Exception("Secure storage unavailable")

        client = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(temp_credentials_file),
        )
        client._save_credentials({"token": "mk_test_token", "updated_at": 123456})

        # File should be written
        assert temp_credentials_file.exists()
        with open(temp_credentials_file) as f:
            data = json.load(f)
        assert data["token"] == "mk_test_token"

    @patch("src.core.raas_auth.get_secure_storage")
    def test_load_credentials_from_secure_storage(
        self, mock_get_storage, temp_credentials_file
    ):
        """Test loading credentials from secure storage."""
        mock_storage = MagicMock()
        mock_storage.get_license.return_value = "mk_secure_token"
        mock_get_storage.return_value = mock_storage

        # Create plaintext file (should not be used)
        temp_credentials_file.write_text(json.dumps({"token": "old_token"}))

        client = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(temp_credentials_file),
        )
        creds = client._load_credentials()

        # Should use secure storage
        mock_storage.get_license.assert_called_once()
        assert creds["token"] == "mk_secure_token"
        assert creds["uses_secure_storage"] is True

    def test_load_credentials_from_file_fallback(self, temp_credentials_file):
        """Test loading credentials from file fallback."""
        temp_credentials_file.write_text(
            json.dumps({"token": "mk_file_token", "updated_at": 123456})
        )

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_credentials_file),
        )
        creds = client._load_credentials()

        assert creds["token"] == "mk_file_token"
        assert creds["uses_secure_storage"] is False


class TestMigrationLogic:
    """Test migration from plaintext to secure storage."""

    @pytest.fixture
    def temp_credentials_file(self, tmp_path):
        """Create temporary credentials file with test data."""
        creds_file = tmp_path / "credentials.json"
        creds_file.write_text(
            json.dumps({"token": "mk_old_token", "updated_at": 123456})
        )
        yield creds_file

    @patch("src.core.raas_auth.get_secure_storage")
    def test_migrate_to_secure_storage(self, mock_get_storage, temp_credentials_file):
        """Test migration from plaintext to secure storage."""
        mock_storage = MagicMock()
        mock_get_storage.return_value = mock_storage

        client = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(temp_credentials_file),
        )

        result = client._migrate_to_secure_storage()

        assert result is True
        mock_storage.store_license.assert_called_once_with("mk_old_token")
        # File should be deleted after migration
        assert not temp_credentials_file.exists()

    @patch("src.core.raas_auth.get_secure_storage")
    def test_migrate_no_existing_file(self, mock_get_storage, tmp_path):
        """Test migration with no existing file."""
        mock_storage = MagicMock()
        mock_get_storage.return_value = mock_storage
        creds_file = tmp_path / "nonexistent.json"

        client = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(creds_file),
        )

        result = client._migrate_to_secure_storage()

        assert result is False
        mock_storage.store_license.assert_not_called()


class TestSessionManagement:
    """Test session management."""

    @pytest.fixture
    def authenticated_client(self, tmp_path):
        """Create authenticated client for testing."""
        from src.core.raas_auth import SessionCache

        creds_file = tmp_path / "credentials.json"
        creds_file.write_text(json.dumps({"token": "mk_test_token"}))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )
        # Mock cached session with SessionCache
        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=300,
        )
        client._session_cache = cache
        return client

    @patch("src.core.raas_auth.requests.post")
    def test_get_session_authenticated(self, mock_post, authenticated_client):
        """Test get_session when authenticated."""
        # Session cache is valid, should not call gateway
        session = authenticated_client.get_session()

        assert session.authenticated is True
        assert session.tenant_id == "test_tenant"
        assert session.tier == "pro"
        # Gateway should NOT be called since cache is valid
        assert not mock_post.called

    @patch("src.core.raas_auth.requests.post")
    def test_get_session_not_authenticated(self, mock_post, tmp_path):
        """Test get_session when not authenticated."""
        creds_file = tmp_path / "credentials.json"
        # Empty file - no credentials

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )

        # Ensure no session cache
        client._session_cache = None

        session = client.get_session()

        assert session.authenticated is False
        assert session.tenant_id == "anonymous"
        assert session.tier == "free"

    def test_session_uses_secure_storage_flag(self, tmp_path):
        """Test session reports secure storage usage."""
        creds_file = tmp_path / "credentials.json"

        # With secure storage enabled
        client_secure = RaaSAuthClient(
            use_secure_storage=True,
            credentials_file=str(creds_file),
        )
        session_secure = client_secure.get_session()
        # Should report uses_secure_storage based on config
        assert session_secure.uses_secure_storage is True

        # With secure storage disabled
        client_file = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )
        session_file = client_file.get_session()
        assert session_file.uses_secure_storage is False


class TestLoginLogout:
    """Test login and logout functionality."""

    @pytest.fixture
    def temp_client(self, tmp_path):
        """Create client with temp credentials file."""
        creds_file = tmp_path / "credentials.json"
        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )
        return client, creds_file

    @patch("src.core.raas_auth.requests.post")
    def test_login_success(self, mock_post, temp_client):
        """Test successful login."""
        client, creds_file = temp_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tenant_id": "logged_in_tenant",
            "tier": "pro",
            "role": "owner",
        }
        mock_post.return_value = mock_response

        result = client.login("mk_test_token", persist=True)

        assert result.valid is True
        assert creds_file.exists()

    def test_login_no_persist(self, temp_client):
        """Test login without persisting credentials."""
        client, creds_file = temp_client

        with patch("src.core.raas_auth.requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "tenant_id": "temp_tenant",
                "tier": "pro",
                "role": "owner",
            }
            mock_post.return_value = mock_response

            result = client.login("mk_test_token", persist=False)

            assert result.valid is True
            assert not creds_file.exists()

    def test_logout_clears_credentials(self, temp_client):
        """Test logout clears stored credentials."""
        client, creds_file = temp_client

        # First, login to create credentials
        creds_file.write_text(json.dumps({"token": "mk_test_token"}))

        result = client.logout()

        assert result is True
        assert not creds_file.exists()

    def test_logout_no_credentials(self, temp_client):
        """Test logout when no credentials exist."""
        client, creds_file = temp_client

        result = client.logout()

        assert result is False


class TestSingletonPattern:
    """Test singleton pattern for auth client."""

    @patch("src.core.raas_auth._auth_client", None)
    def test_get_auth_client_creates_singleton(self):
        """Test get_auth_client creates singleton instance."""

        # Reset singleton
        import src.core.raas_auth as module
        module._auth_client = None

        client1 = get_auth_client()
        client2 = get_auth_client()

        assert client1 is client2


class TestEndpointConstants:
    """Test endpoint constants."""

    def test_v2_endpoint_constant(self):
        """Test V2 endpoint constant exists."""
        assert RaaSAuthClient.VALIDATION_ENDPOINT_V2 == "/v2/license/validate"

    def test_v1_endpoint_constant(self):
        """Test V1 endpoint constant exists."""
        assert RaaSAuthClient.VALIDATION_ENDPOINT_V1 == "/v1/auth/validate"
