from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient

from backend.middleware.rate_limiter import RateLimitMiddleware

# Mock Config
MOCK_CONFIG = {
    'rate_limits': {
        'global': {
            'ip_limit': 50,
            'ip_window': 60,
            'user_limit': 100,
            'user_window': 3600
        },
        'endpoints': {
            '/api/auth/login': {
                'enabled': True,
                'limit': 5,
                'window_seconds': 60,
                'algorithm': 'sliding_window'
            },
            '/api/test': {
                'enabled': True,
                'limit': 10,
                'window_seconds': 60
            }
        }
    }
}

@pytest.fixture
def mock_rate_limiter_service():
    with patch('backend.middleware.rate_limiter.RateLimiterService') as MockService:
        service_instance = MockService.return_value
        # Default: Allow everything
        service_instance.check_sliding_window = AsyncMock(return_value=(True, 10))
        service_instance.check_token_bucket = AsyncMock(return_value=(True, 10))
        service_instance.check_fixed_window = AsyncMock(return_value=(True, 10))
        service_instance.get_reset_time = AsyncMock(return_value=1700000000)
        yield service_instance

@pytest.fixture
def mock_rate_limit_monitor():
    with patch('backend.middleware.rate_limiter.rate_limit_monitor') as mock:
        mock.log_violation = AsyncMock()
        yield mock

@pytest.fixture
def mock_ip_blocker():
    with patch('backend.middleware.rate_limiter.ip_blocker') as mock:
        mock.is_blocked = AsyncMock(return_value=False)
        yield mock

@pytest.fixture
def client(mock_rate_limiter_service, mock_rate_limit_monitor, mock_ip_blocker):
    app = FastAPI()

    # Patch the config load to return our mock config AND enable rate limiting in settings
    from backend.api.config.settings import settings

    with patch('backend.middleware.rate_limiter.RateLimitMiddleware._load_config', return_value=MOCK_CONFIG['rate_limits']), \
         patch.object(settings, 'enable_rate_limiting', True):

        app.add_middleware(RateLimitMiddleware)

        @app.get("/api/test")
        async def test_route():
            return {"message": "success"}

        @app.get("/health")
        async def health_route():
            return {"status": "ok"}

        @app.get("/api/unknown")
        async def unknown_route():
            return {"message": "unknown"}

        yield TestClient(app)

def test_integration_health_check_bypass(client, mock_rate_limiter_service):
    response = client.get("/health")
    assert response.status_code == 200
    # Should not call rate limiter
    mock_rate_limiter_service.check_sliding_window.assert_not_called()

def test_integration_global_ip_check(client, mock_rate_limiter_service):
    response = client.get("/api/unknown")
    assert response.status_code == 200

    # Verify calls
    # Should verify IP global
    calls = mock_rate_limiter_service.check_sliding_window.call_args_list
    # The key format in middleware is f"global:ip:{client_ip}"
    assert any("global:ip" in call[0][0] for call in calls)

def test_integration_endpoint_check(client, mock_rate_limiter_service):
    response = client.get("/api/test")
    assert response.status_code == 200

    # Verify calls
    calls = mock_rate_limiter_service.check_sliding_window.call_args_list
    keys = [call[0][0] for call in calls]

    # Should verify IP global AND Endpoint
    assert any("global:ip" in k for k in keys)
    assert any("ep:ip" in k and "/api/test" in k for k in keys)

def test_integration_rate_limit_exceeded(client, mock_rate_limiter_service):
    # Simulate blocking on global IP
    mock_rate_limiter_service.check_sliding_window.return_value = (False, 0)

    response = client.get("/api/test")

    assert response.status_code == 429
    assert "Retry-After" in response.headers
    assert response.headers["X-RateLimit-Type"] == "global_ip"

def test_integration_specific_endpoint_failure(client, mock_rate_limiter_service):
    # Side effect: Global IP pass, Endpoint fail
    async def side_effect(key, limit, window):
        if "global:ip" in key:
            return True, 49
        if "ep:ip" in key:
            return False, 0
        return True, 10

    mock_rate_limiter_service.check_sliding_window.side_effect = side_effect

    response = client.get("/api/test")

    assert response.status_code == 429
    assert response.headers["X-RateLimit-Type"] == "endpoint"
