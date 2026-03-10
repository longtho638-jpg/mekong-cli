"""Tests for API Key Manager (Condition C3 - API Bridge)."""

import pytest
import tempfile
from pathlib import Path
from datetime import datetime, timezone, timedelta

from src.core.api_key_manager import (
    ApiKey,
    ApiKeyManager,
    KeyStatus,
    ValidationResult,
    generate_api_key,
    validate_api_key,
    revoke_api_key,
)


@pytest.fixture
def temp_config_dir():
    """Create temporary config directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def key_manager(temp_config_dir):
    """Create ApiKeyManager with temp directory."""
    return ApiKeyManager(config_dir=temp_config_dir)


class TestApiKeyDataclass:
    """Test ApiKey dataclass methods."""

    def test_is_expired_false_when_no_expiry(self):
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
        )
        assert key.is_expired is False

    def test_is_expired_true_when_past_expiry(self):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
            expires_at=past,
        )
        assert key.is_expired is True

    def test_is_expired_false_when_future_expiry(self):
        future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
            expires_at=future,
        )
        assert key.is_expired is False

    def test_is_active_when_status_active_and_not_expired(self):
        future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
            status=KeyStatus.ACTIVE,
            expires_at=future,
        )
        assert key.is_active is True

    def test_is_active_false_when_revoked(self):
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
            status=KeyStatus.REVOKED,
        )
        assert key.is_active is False

    def test_days_until_expiry(self):
        future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret",
            tenant_id="tenant_1",
            tier="free",
            expires_at=future,
        )
        # Allow 1 day variance due to timing
        assert key.days_until_expiry in (29, 30, 31)

    def test_to_public_dict_excludes_secret(self):
        key = ApiKey(
            key_id="mk_test",
            key_secret="secret123",
            tenant_id="tenant_1",
            tier="pro",
        )
        public = key.to_public_dict()
        assert "key_secret" not in public
        assert public["key_id"] == "mk_test"
        assert public["tenant_id"] == "tenant_1"


class TestApiKeyManagerGenerate:
    """Test API key generation."""

    def test_generate_key_returns_api_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        assert isinstance(key, ApiKey)
        assert key.key_id.startswith("mk_")
        assert key.tenant_id == "tenant_1"
        assert key.tier == "free"
        assert key.status == KeyStatus.ACTIVE

    def test_generate_key_with_custom_tier(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1", tier="pro")
        assert key.tier == "pro"
        assert key.rate_limit == 100

    def test_generate_key_with_expiry(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1", expires_in_days=30)
        assert key.expires_at is not None
        # Allow 1 day variance due to timing
        assert key.days_until_expiry in (29, 30, 31)

    def test_generate_key_with_custom_rate_limit(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1", rate_limit=500)
        assert key.rate_limit == 500

    def test_generate_key_persists_to_file(self, key_manager, temp_config_dir):
        key = key_manager.generate_key(tenant_id="tenant_1")
        keys_file = temp_config_dir / "api_keys.json"
        assert keys_file.exists()


class TestApiKeyManagerValidate:
    """Test API key validation."""

    def test_validate_valid_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        result = key_manager.validate_key(key.key_id)
        assert result.valid is True
        assert result.tenant_id == "tenant_1"

    def test_validate_with_secret(self, key_manager, monkeypatch):
        # Disable encryption for this test to avoid secure_storage dependency
        def mock_encrypt(data):
            return data  # No-op for testing

        def mock_decrypt(data):
            return data  # No-op for testing

        monkeypatch.setattr(key_manager, "_encrypt", mock_encrypt)
        monkeypatch.setattr(key_manager, "_decrypt", mock_decrypt)

        key = key_manager.generate_key(tenant_id="tenant_1")
        secret = key.key_secret
        result = key_manager.validate_key(key.key_id, key_secret=secret)
        assert result.valid is True

    def test_validate_invalid_secret(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        result = key_manager.validate_key(key.key_id, key_secret="wrong_secret")
        assert result.valid is False
        assert result.error_code == "INVALID_SECRET"

    def test_validate_not_found(self, key_manager):
        result = key_manager.validate_key("mk_nonexistent")
        assert result.valid is False
        assert result.error_code == "KEY_NOT_FOUND"

    def test_validate_revoked_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        key_manager.revoke_key(key.key_id)
        result = key_manager.validate_key(key.key_id)
        assert result.valid is False
        assert result.error_code == "KEY_REVOKED"

    def test_validate_expired_key(self, key_manager):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        key = key_manager.generate_key(tenant_id="tenant_1", expires_in_days=-1)
        result = key_manager.validate_key(key.key_id)
        assert result.valid is False
        assert result.error_code == "KEY_EXPIRED"


class TestApiKeyManagerRevoke:
    """Test API key revocation."""

    def test_revoke_key_successfully(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        result = key_manager.revoke_key(key.key_id)
        assert result is True

    def test_revoke_key_marks_as_revoked(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        key_manager.revoke_key(key.key_id)
        loaded = key_manager.get_key(key.key_id)
        assert loaded.status == KeyStatus.REVOKED

    def test_revoke_nonexistent_key(self, key_manager):
        result = key_manager.revoke_key("mk_nonexistent")
        assert result is False


class TestApiKeyManagerSuspend:
    """Test API key suspension."""

    def test_suspend_key_successfully(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        result = key_manager.suspend_key(key.key_id)
        assert result is True

    def test_suspend_key_marks_as_suspended(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        key_manager.suspend_key(key.key_id)
        loaded = key_manager.get_key(key.key_id)
        assert loaded.status == KeyStatus.SUSPENDED

    def test_validate_suspended_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        key_manager.suspend_key(key.key_id)
        result = key_manager.validate_key(key.key_id)
        assert result.valid is False
        assert result.error_code == "KEY_SUSPENDED"


class TestApiKeyManagerReactivate:
    """Test API key reactivation."""

    def test_reactivate_suspended_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        key_manager.suspend_key(key.key_id)
        result = key_manager.reactivate_key(key.key_id)
        assert result is True

        loaded = key_manager.get_key(key.key_id)
        assert loaded.status == KeyStatus.ACTIVE


class TestApiKeyManagerGetKeys:
    """Test getting API keys."""

    def test_get_keys_for_tenant(self, key_manager):
        key1 = key_manager.generate_key(tenant_id="tenant_1")
        key2 = key_manager.generate_key(tenant_id="tenant_1")
        key3 = key_manager.generate_key(tenant_id="tenant_2")

        tenant1_keys = key_manager.get_keys_for_tenant("tenant_1")
        assert len(tenant1_keys) == 2
        assert all(k.tenant_id == "tenant_1" for k in tenant1_keys)

    def test_get_single_key(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        loaded = key_manager.get_key(key.key_id)
        assert loaded.key_id == key.key_id
        assert loaded.key_secret == "***REDACTED***"

    def test_get_nonexistent_key(self, key_manager):
        result = key_manager.get_key("mk_nonexistent")
        assert result is None


class TestApiKeyManagerDelete:
    """Test API key deletion."""

    def test_delete_key_successfully(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1")
        result = key_manager.delete_key(key.key_id)
        assert result is True
        assert key_manager.get_key(key.key_id) is None

    def test_delete_nonexistent_key(self, key_manager):
        result = key_manager.delete_key("mk_nonexistent")
        assert result is False


class TestApiKeyManagerRateLimit:
    """Test rate limiting."""

    def test_rate_limit_tracking(self, key_manager):
        key = key_manager.generate_key(tenant_id="tenant_1", rate_limit=5)

        # Make requests within limit
        for i in range(5):
            result = key_manager.validate_key(key.key_id)
            assert result.valid is True

        # Next request should exceed limit
        result = key_manager.validate_key(key.key_id)
        assert result.valid is False
        assert result.error_code == "RATE_LIMIT_EXCEEDED"


class TestApiKeyManagerClearAll:
    """Test clearing all keys."""

    def test_clear_all_keys(self, key_manager):
        key_manager.generate_key(tenant_id="tenant_1")
        key_manager.generate_key(tenant_id="tenant_2")

        result = key_manager.clear_all_keys()
        assert result is True
        assert len(key_manager.get_keys_for_tenant("tenant_1")) == 0


class TestGlobalFunctions:
    """Test global convenience functions."""

    def test_generate_api_key_function(self, temp_config_dir, monkeypatch):
        from src.core import api_key_manager
        monkeypatch.setattr(api_key_manager, "_api_key_manager", None)
        api_key_manager._api_key_manager = ApiKeyManager(config_dir=temp_config_dir)

        key = api_key_manager.generate_api_key(tenant_id="tenant_1")
        assert key.key_id.startswith("mk_")

    def test_validate_api_key_function(self, temp_config_dir, monkeypatch):
        from src.core import api_key_manager
        manager = ApiKeyManager(config_dir=temp_config_dir)
        monkeypatch.setattr(api_key_manager, "_api_key_manager", manager)

        key = manager.generate_key(tenant_id="tenant_1")
        result = api_key_manager.validate_api_key(key.key_id)
        assert result.valid is True

    def test_revoke_api_key_function(self, temp_config_dir, monkeypatch):
        from src.core import api_key_manager
        manager = ApiKeyManager(config_dir=temp_config_dir)
        monkeypatch.setattr(api_key_manager, "_api_key_manager", manager)

        key = manager.generate_key(tenant_id="tenant_1")
        result = api_key_manager.revoke_api_key(key.key_id)
        assert result is True


class TestGatewayIntegration:
    """Test integration with gateway_api.py."""

    def test_validate_api_key_for_mission_valid(self, temp_config_dir, monkeypatch):
        from src.core import gateway_api
        from src.core.api_key_manager import ApiKeyManager, get_api_key_manager

        manager = ApiKeyManager(config_dir=temp_config_dir)
        key = manager.generate_key(tenant_id="tenant_1")

        # Monkeypatch the global instance to use our test manager
        import src.core.api_key_manager as api_key_mgr
        original_manager = api_key_mgr._api_key_manager
        api_key_mgr._api_key_manager = manager

        try:
            valid, error = gateway_api.validate_api_key_for_mission(key.key_id, "tenant_1")
            assert valid is True
            assert error is None
        finally:
            api_key_mgr._api_key_manager = original_manager

    def test_validate_api_key_for_mission_missing_key(self):
        from src.core import gateway_api

        valid, error = gateway_api.validate_api_key_for_mission("", "tenant_1")
        assert valid is False
        assert "Missing API key" in error

    def test_validate_api_key_for_mission_tenant_mismatch(self, temp_config_dir, monkeypatch):
        from src.core import gateway_api
        from src.core.api_key_manager import ApiKeyManager
        import src.core.api_key_manager as api_key_mgr

        manager = ApiKeyManager(config_dir=temp_config_dir)
        key = manager.generate_key(tenant_id="tenant_1")

        # Monkeypatch the global instance
        original_manager = api_key_mgr._api_key_manager
        api_key_mgr._api_key_manager = manager

        try:
            valid, error = gateway_api.validate_api_key_for_mission(key.key_id, "tenant_2")
            assert valid is False
            assert "tenant mismatch" in error or "Invalid API key" in error
        finally:
            api_key_mgr._api_key_manager = original_manager
