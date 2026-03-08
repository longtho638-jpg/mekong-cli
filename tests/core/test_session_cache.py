"""
Tests for Session Cache & Auto-refresh (Phase 4-5)

Tests cover:
- SessionCache dataclass (TTL, expiry, refresh boundary)
- Session cache persistence (~/.mekong/session.json)
- Auto-refresh logic (1-minute buffer)
- Cache invalidation on logout
"""

import json
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from src.core.raas_auth import (
    RaaSAuthClient,
    SessionCache,
)


class TestSessionCacheDataclass:
    """Test SessionCache dataclass functionality."""

    def test_create_session_cache(self):
        """Test creating SessionCache with required fields."""
        now = datetime.now(timezone.utc)
        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            cached_at=now,
        )
        assert cache.tenant_id == "test_tenant"
        assert cache.tier == "pro"
        assert cache.ttl_seconds == 300  # Default 5 minutes
        assert cache.cached_at == now

    def test_session_expires_at_property(self):
        """Test session_expires_at calculation."""
        now = datetime.now(timezone.utc)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=now,
            ttl_seconds=300,
        )
        expected = now + timedelta(seconds=300)
        # Compare with small tolerance for execution time
        assert abs((cache.session_expires_at - expected).total_seconds()) < 1

    def test_refresh_boundary_property(self):
        """Test refresh_boundary calculation (1 minute before expiry)."""
        now = datetime.now(timezone.utc)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=now,
            ttl_seconds=300,
        )
        # Refresh boundary = cached_at + 300s - 60s = cached_at + 240s
        expected = now + timedelta(seconds=240)
        assert abs((cache.refresh_boundary - expected).total_seconds()) < 1

    def test_is_valid_true(self):
        """Test is_valid returns True for fresh cache."""
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=300,
        )
        assert cache.is_valid() is True

    def test_is_valid_false_expired(self):
        """Test is_valid returns False for expired cache."""
        past = datetime.now(timezone.utc) - timedelta(seconds=400)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )
        assert cache.is_valid() is False

    def test_should_refresh_true(self):
        """Test should_refresh returns True when within 1 minute of expiry."""
        # Cache created 4 minutes ago (240 seconds)
        past = datetime.now(timezone.utc) - timedelta(seconds=245)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )
        # Now we're at 245s, expiry at 300s, refresh boundary at 240s
        # So we're past refresh boundary but not expired yet
        assert cache.is_valid()  # Still valid
        assert cache.should_refresh()  # Should refresh

    def test_should_refresh_false_fresh(self):
        """Test should_refresh returns False for fresh cache."""
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=300,
        )
        assert cache.should_refresh() is False

    def test_should_refresh_false_expired(self):
        """Test should_refresh returns False for expired cache."""
        past = datetime.now(timezone.utc) - timedelta(seconds=400)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )
        assert cache.should_refresh() is False  # Already expired

    def test_is_expired_true(self):
        """Test is_expired returns True for expired cache."""
        past = datetime.now(timezone.utc) - timedelta(seconds=400)
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )
        assert cache.is_expired() is True

    def test_is_expired_false(self):
        """Test is_expired returns False for valid cache."""
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=300,
        )
        assert cache.is_expired() is False

    def test_to_dict(self):
        """Test serialization to dictionary."""
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=24)
        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            license_key="mk_test_key",
            features=["feature1", "feature2"],
            expires_at=expires,
            cached_at=now,
            ttl_seconds=300,
            refresh_token="refresh_abc",
        )

        data = cache.to_dict()

        assert data["tenant_id"] == "test_tenant"
        assert data["tier"] == "pro"
        assert data["role"] == "owner"
        assert data["license_key"] == "mk_test_key"
        assert data["features"] == ["feature1", "feature2"]
        assert data["expires_at"] == expires.isoformat()
        assert data["cached_at"] == now.isoformat()
        assert data["ttl_seconds"] == 300
        assert data["refresh_token"] == "refresh_abc"

    def test_from_dict(self):
        """Test deserialization from dictionary."""
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=24)

        data = {
            "tenant_id": "test_tenant",
            "tier": "pro",
            "role": "owner",
            "license_key": "mk_test_key",
            "features": ["feature1", "feature2"],
            "expires_at": expires.isoformat(),
            "cached_at": now.isoformat(),
            "ttl_seconds": 300,
            "refresh_token": "refresh_abc",
        }

        cache = SessionCache.from_dict(data)

        assert cache.tenant_id == "test_tenant"
        assert cache.tier == "pro"
        assert cache.role == "owner"
        assert cache.license_key == "mk_test_key"
        assert cache.features == ["feature1", "feature2"]
        assert cache.ttl_seconds == 300
        assert cache.refresh_token == "refresh_abc"

    def test_from_dict_missing_optional_fields(self):
        """Test from_dict with missing optional fields."""
        now = datetime.now(timezone.utc)

        data = {
            "tenant_id": "test_tenant",
            "tier": "free",
            "role": "user",
            "cached_at": now.isoformat(),
        }

        cache = SessionCache.from_dict(data)

        assert cache.license_key is None
        assert cache.features == []
        assert cache.expires_at is None
        assert cache.refresh_token is None


class TestSessionCachePersistence:
    """Test session cache file persistence."""

    @pytest.fixture
    def temp_session_file(self, tmp_path):
        """Create temporary session file path."""
        session_file = tmp_path / "session.json"
        yield session_file

    @pytest.fixture
    def temp_creds_file(self, tmp_path):
        """Create temporary credentials file path."""
        creds_file = tmp_path / "credentials.json"
        yield creds_file

    @patch("src.core.raas_auth.get_secure_storage")
    def test_save_session_cache(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test saving session cache to file."""
        mock_get_storage.return_value = None

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
        )

        client._save_session_cache(cache)

        assert temp_session_file.exists()

        with open(temp_session_file) as f:
            data = json.load(f)

        assert data["tenant_id"] == "test_tenant"
        assert data["ttl_seconds"] == 300

    @patch("src.core.raas_auth.get_secure_storage")
    def test_load_session_cache_valid(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test loading valid session cache from file."""
        mock_get_storage.return_value = None

        # Create cache file
        now = datetime.now(timezone.utc)
        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            cached_at=now,
            ttl_seconds=300,
        )

        temp_session_file.write_text(json.dumps(cache.to_dict()))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        loaded = client._load_session_cache()

        assert loaded is not None
        assert loaded.tenant_id == "test_tenant"
        assert loaded.tier == "pro"
        assert loaded.is_valid()

    @patch("src.core.raas_auth.get_secure_storage")
    def test_load_session_cache_expired(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test loading expired session cache returns None."""
        mock_get_storage.return_value = None

        # Create expired cache (10 minutes old)
        past = datetime.now(timezone.utc) - timedelta(minutes=10)
        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )

        temp_session_file.write_text(json.dumps(cache.to_dict()))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        loaded = client._load_session_cache()

        # Should return None and clear expired cache
        assert loaded is None
        assert not temp_session_file.exists()

    @patch("src.core.raas_auth.get_secure_storage")
    def test_load_session_cache_corrupted(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test loading corrupted cache returns None."""
        mock_get_storage.return_value = None

        # Write invalid JSON
        temp_session_file.write_text("invalid json {")

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        loaded = client._load_session_cache()

        assert loaded is None

    @patch("src.core.raas_auth.get_secure_storage")
    def test_clear_session_cache(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test clearing session cache."""
        mock_get_storage.return_value = None

        # Create cache file
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
        )
        temp_session_file.write_text(json.dumps(cache.to_dict()))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        result = client._clear_session_cache()

        assert result is True
        assert not temp_session_file.exists()

    @patch("src.core.raas_auth.get_secure_storage")
    def test_clear_session_cache_nonexistent(self, mock_get_storage, temp_session_file, temp_creds_file):
        """Test clearing non-existent cache returns False."""
        mock_get_storage.return_value = None

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(temp_creds_file),
        )
        client.session_cache_path = temp_session_file

        result = client._clear_session_cache()

        assert result is False


class TestAutoRefresh:
    """Test auto-refresh logic."""

    @pytest.fixture
    def mock_gateway_response(self):
        """Create mock gateway validation response."""
        response = MagicMock()
        response.status_code = 200
        response.json.return_value = {
            "tenant_id": "refreshed_tenant",
            "tier": "enterprise",
            "role": "admin",
            "features": ["feature1", "feature2"],
            "expires_at": int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp()),
        }
        return response

    @patch("src.core.raas_auth.requests.post")
    @patch("src.core.raas_auth.get_secure_storage")
    def test_refresh_session(
        self, mock_get_storage, mock_post, mock_gateway_response, tmp_path
    ):
        """Test _refresh_session method."""
        mock_get_storage.return_value = None
        mock_post.return_value = mock_gateway_response

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(tmp_path / "credentials.json"),
        )

        # Create old token
        test_token = "mk_test_refresh_token"

        client._refresh_session(test_token)

        # Gateway should be called
        assert mock_post.called

    @patch("src.core.raas_auth.requests.post")
    @patch("src.core.raas_auth.get_secure_storage")
    def test_get_session_uses_cache(
        self, mock_get_storage, mock_post, tmp_path
    ):
        """Test get_session uses valid cache."""
        mock_get_storage.return_value = None

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(tmp_path / "credentials.json"),
        )

        # Manually set valid session cache
        cache = SessionCache(
            tenant_id="cached_tenant",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=300,
        )
        client._session_cache = cache

        session = client.get_session()

        # Should use cache, not call gateway
        assert session.tenant_id == "cached_tenant"
        assert session.authenticated is True
        assert not mock_post.called

    @patch("src.core.raas_auth.requests.post")
    @patch("src.core.raas_auth.get_secure_storage")
    def test_get_session_refresh_when_near_expiry(
        self, mock_get_storage, mock_post, mock_gateway_response, tmp_path
    ):
        """Test get_session triggers refresh when near expiry."""
        mock_get_storage.return_value = None
        mock_post.return_value = mock_gateway_response

        # Create credentials file
        creds_file = tmp_path / "credentials.json"
        creds_file.write_text(json.dumps({"token": "mk_test_token"}))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )

        # Set cache that should refresh (5 minutes ago)
        past = datetime.now(timezone.utc) - timedelta(minutes=4, seconds=30)
        cache = SessionCache(
            tenant_id="old_tenant",
            tier="pro",
            role="owner",
            cached_at=past,
            ttl_seconds=300,
        )
        client._session_cache = cache

        session = client.get_session()

        # Gateway should be called for refresh
        assert mock_post.called


class TestLogoutClearsCache:
    """Test logout clears session cache."""

    @patch("src.core.raas_auth.get_secure_storage")
    def test_logout_clears_session_cache(self, mock_get_storage, tmp_path):
        """Test logout clears both in-memory and file cache."""
        mock_get_storage.return_value = None

        creds_file = tmp_path / "credentials.json"
        session_file = tmp_path / "session.json"

        # Create credentials
        creds_file.write_text(json.dumps({"token": "mk_test_token"}))

        # Create session cache
        cache = SessionCache(
            tenant_id="test",
            tier="pro",
            role="owner",
            cached_at=datetime.now(timezone.utc),
        )
        session_file.write_text(json.dumps(cache.to_dict()))

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(creds_file),
        )
        client.session_cache_path = session_file

        # Set in-memory cache
        client._session_cache = cache

        # Logout
        result = client.logout()

        assert result is True
        assert not creds_file.exists()
        assert not session_file.exists()
        assert client._session_cache is None


class TestSessionCacheToTenantContext:
    """Test _session_cache_to_tenant_context conversion."""

    @patch("src.core.raas_auth.get_secure_storage")
    def test_cache_to_tenant(self, mock_get_storage, tmp_path):
        """Test converting SessionCache to TenantContext."""
        mock_get_storage.return_value = None

        client = RaaSAuthClient(
            use_secure_storage=False,
            credentials_file=str(tmp_path / "credentials.json"),
        )

        cache = SessionCache(
            tenant_id="test_tenant",
            tier="pro",
            role="owner",
            license_key="mk_test_key",
            features=["feature1"],
            cached_at=datetime.now(timezone.utc),
        )

        tenant = client._session_cache_to_tenant_context(cache)

        assert tenant.tenant_id == "test_tenant"
        assert tenant.tier == "pro"
        assert tenant.role == "owner"
        assert tenant.license_key == "mk_test_key"
        assert tenant.features == ["feature1"]
