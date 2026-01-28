"""
Tests for CDN Router
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from backend.api.main import app
from backend.api.config.settings import settings
from backend.api.auth.dependencies import get_current_active_superuser

client = TestClient(app)

# Mock superuser dependency override
async def override_get_current_active_superuser():
    return {"id": 1, "is_superuser": True}

app.dependency_overrides[get_current_active_superuser] = override_get_current_active_superuser

# Patch cache factory to avoid Redis connection from CacheControlMiddleware
@pytest.fixture(autouse=True)
def mock_cache():
    with patch("backend.services.cache.cache_factory.get_response_cache", new_callable=AsyncMock) as mock:
        mock.return_value = None
        yield mock

# Patch RateLimiterService methods to avoid Redis connection
@pytest.fixture(autouse=True)
def mock_rate_limiter_service():
    with patch("backend.services.rate_limiter_service.RateLimiterService.check_sliding_window", new_callable=AsyncMock) as mock_sliding:
        with patch("backend.services.rate_limiter_service.RateLimiterService.check_token_bucket", new_callable=AsyncMock) as mock_token:
            with patch("backend.services.rate_limiter_service.RateLimiterService.check_fixed_window", new_callable=AsyncMock) as mock_fixed:
                with patch("backend.services.rate_limiter_service.RateLimiterService.get_reset_time", new_callable=AsyncMock) as mock_reset:
                    mock_sliding.return_value = (True, 100)
                    mock_token.return_value = (True, 100)
                    mock_fixed.return_value = (True, 100)
                    mock_reset.return_value = 0
                    yield

# Patch IpBlocker to avoid Redis connection
@pytest.fixture(autouse=True)
def mock_ip_blocker():
    with patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock) as mock:
        mock.return_value = False
        yield mock

def test_get_config():
    # Force settings for test
    original_provider = settings.cdn_provider
    settings.cdn_provider = "cloudflare"
    settings.cloudflare_api_token = "test_token"

    try:
        response = client.get("/cdn/config")
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "cloudflare"
        assert data["enabled"] is True
    finally:
        settings.cdn_provider = original_provider

def test_purge_invalid_request():
    response = client.post("/cdn/purge", json={})
    assert response.status_code == 400

