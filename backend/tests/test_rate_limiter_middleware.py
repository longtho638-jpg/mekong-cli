import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI, Request, Response
from backend.middleware.rate_limiter import RateLimitMiddleware
from backend.services.rate_limiter_service import RateLimiterService

# Mock settings
@pytest.fixture
def mock_settings():
    with patch("backend.middleware.rate_limiter.settings") as mock:
        mock.enable_rate_limiting = True
        yield mock

# Mock RateLimiterService
@pytest.fixture
def mock_rate_limiter_service():
    with patch("backend.middleware.rate_limiter.RateLimiterService") as MockService:
        service_instance = MockService.return_value
        # Default behavior: allow everything
        service_instance.check_sliding_window = AsyncMock(return_value=(True, 10))
        service_instance.check_token_bucket = AsyncMock(return_value=(True, 10))
        service_instance.check_fixed_window = AsyncMock(return_value=(True, 10))
        service_instance.get_reset_time = AsyncMock(return_value=1234567890)
        yield service_instance

# Mock Config
@pytest.fixture
def mock_config():
    return {
        'rate_limits': {
            'global': {
                'ip_limit': 100,
                'ip_window': 60,
                'user_limit': 1000,
                'user_window': 3600
            },
            'endpoints': {
                '/api/strict': {
                    'enabled': True,
                    'limit': 5,
                    'window_seconds': 60
                },
                '/api/disabled': {
                    'enabled': False
                }
            }
        }
    }

@pytest.mark.asyncio
async def test_middleware_health_check_skipped(mock_rate_limiter_service):
    app = FastAPI()
    middleware = RateLimitMiddleware(app)

    # Mock call_next
    async def call_next(request):
        return Response(content="OK", status_code=200)

    # Test health check path
    request = Request(scope={"type": "http", "path": "/health", "method": "GET", "headers": []})
    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200
    # Should not call rate limiter
    mock_rate_limiter_service.check_sliding_window.assert_not_called()

@pytest.mark.asyncio
async def test_middleware_global_ip_limit(mock_rate_limiter_service, mock_config):
    app = FastAPI()
    with patch.object(RateLimitMiddleware, '_load_config', return_value=mock_config['rate_limits']):
        middleware = RateLimitMiddleware(app)

        async def call_next(request):
            return Response(content="OK", status_code=200)

        # Request from unknown IP
        request = Request(scope={
            "type": "http",
            "path": "/api/general",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.1", 12345)
        })

        await middleware.dispatch(request, call_next)

        # Should call check_sliding_window for global IP
        args = mock_rate_limiter_service.check_sliding_window.call_args_list[0]
        assert args[0][0] == "global:ip:192.168.1.1" # key
        assert args[0][1] == 100 # limit
        assert args[0][2] == 60 # window

@pytest.mark.asyncio
async def test_middleware_authenticated_user(mock_rate_limiter_service, mock_config):
    app = FastAPI()
    with patch.object(RateLimitMiddleware, '_load_config', return_value=mock_config['rate_limits']):
        middleware = RateLimitMiddleware(app)

        async def call_next(request):
            return Response(content="OK", status_code=200)

        # Authenticated request
        request = Request(scope={
            "type": "http",
            "path": "/api/general",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.1", 12345)
        })
        # Simulate auth middleware adding user_id
        request.state.user_id = "user_123"

        await middleware.dispatch(request, call_next)

        # Should verify both IP and User
        calls = mock_rate_limiter_service.check_sliding_window.call_args_list
        keys = [call[0][0] for call in calls]

        assert "global:ip:192.168.1.1" in keys
        assert "global:user:user_123" in keys

@pytest.mark.asyncio
async def test_middleware_endpoint_limit(mock_rate_limiter_service, mock_config):
    app = FastAPI()
    with patch.object(RateLimitMiddleware, '_load_config', return_value=mock_config['rate_limits']):
        middleware = RateLimitMiddleware(app)

        async def call_next(request):
            return Response(content="OK", status_code=200)

        request = Request(scope={
            "type": "http",
            "path": "/api/strict",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.1", 12345)
        })

        await middleware.dispatch(request, call_next)

        # Should verify IP and Endpoint specific limit
        calls = mock_rate_limiter_service.check_sliding_window.call_args_list
        keys = [call[0][0] for call in calls]

        assert "global:ip:192.168.1.1" in keys
        assert "ep:ip:192.168.1.1:/api/strict" in keys

        # Check limits for endpoint
        endpoint_call = next(call for call in calls if "ep:ip" in call[0][0])
        assert endpoint_call[0][1] == 5 # limit

@pytest.mark.asyncio
async def test_middleware_rate_limit_exceeded(mock_rate_limiter_service, mock_config):
    app = FastAPI()

    # Mock rate limit exceeded
    mock_rate_limiter_service.check_sliding_window = AsyncMock(return_value=(False, 0))

    with patch.object(RateLimitMiddleware, '_load_config', return_value=mock_config['rate_limits']):
        middleware = RateLimitMiddleware(app)

        async def call_next(request):
            return Response(content="OK", status_code=200)

        request = Request(scope={
            "type": "http",
            "path": "/api/general",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.1", 12345)
        })

        response = await middleware.dispatch(request, call_next)

        assert response.status_code == 429
        assert "Retry-After" in response.headers

@pytest.mark.asyncio
async def test_middleware_endpoint_disabled(mock_rate_limiter_service, mock_config):
    app = FastAPI()
    with patch.object(RateLimitMiddleware, '_load_config', return_value=mock_config['rate_limits']):
        middleware = RateLimitMiddleware(app)

        async def call_next(request):
            return Response(content="OK", status_code=200)

        request = Request(scope={
            "type": "http",
            "path": "/api/disabled",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.1", 12345)
        })

        await middleware.dispatch(request, call_next)

        # Should NOT call rate limiter
        mock_rate_limiter_service.check_sliding_window.assert_not_called()
