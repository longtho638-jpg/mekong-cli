from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import Request, Response

from backend.middleware.rate_limiter import RateLimitMiddleware


@pytest.fixture
def mock_app():
    return AsyncMock()

@pytest.fixture
def middleware(mock_app):
    # We patch the module where RateLimitMiddleware is defined to intercept imports
    # AND we must patch settings.enable_rate_limiting to True, otherwise dispatch returns early
    from backend.api.config.settings import settings

    with patch('backend.middleware.rate_limiter.RateLimiterService') as MockService, \
         patch('backend.middleware.rate_limiter.ip_blocker') as mock_ip_blocker, \
         patch('backend.middleware.rate_limiter.rate_limit_monitor') as mock_monitor, \
         patch.object(settings, 'enable_rate_limiting', True):

        # Ensure mocks are AsyncMock where appropriate
        mock_ip_blocker.is_blocked = AsyncMock(return_value=False)
        mock_monitor.log_violation = AsyncMock()

        mw = RateLimitMiddleware(mock_app)

        # Ensure the instance uses the mock service
        mw.rate_limiter = MockService.return_value

        # Configure the mock service
        mw.rate_limiter.check_sliding_window = AsyncMock(return_value=(True, 10))
        mw.rate_limiter.check_token_bucket = AsyncMock(return_value=(True, 10))
        mw.rate_limiter.check_fixed_window = AsyncMock(return_value=(True, 10))
        mw.rate_limiter.get_reset_time = AsyncMock(return_value=1000)

        # Mock config to control tests
        mw.config = {
            'global': {'ip_limit': 100, 'ip_window': 60},
            'endpoints': {
                '/api/test': {'limit': 10, 'window_seconds': 60}
            }
        }

        # Make mocks available on instance for test access
        mw.mock_ip_blocker = mock_ip_blocker
        mw.mock_monitor = mock_monitor

        yield mw


@pytest.mark.asyncio
async def test_dispatch_health_check_bypass(middleware):
    request = MagicMock(spec=Request)
    request.url.path = "/health"
    request.method = "GET"
    call_next = AsyncMock(return_value=Response("OK"))

    response = await middleware.dispatch(request, call_next)

    assert response.body == b"OK"
    middleware.rate_limiter.check_sliding_window.assert_not_called()

@pytest.mark.asyncio
async def test_dispatch_blocked_ip(middleware):
    request = MagicMock(spec=Request)
    request.url.path = "/api/test"
    request.client.host = "1.2.3.4"
    request.method = "GET"
    call_next = AsyncMock()

    # Mock IP blocker returning True
    middleware.mock_ip_blocker.is_blocked = AsyncMock(return_value=True)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 403
    assert b"Access denied" in response.body
    call_next.assert_not_called()

@pytest.mark.asyncio
async def test_dispatch_rate_limit_exceeded(middleware):
    request = MagicMock(spec=Request)
    request.url.path = "/api/test"
    request.client.host = "1.2.3.4"
    request.method = "GET"
    # No user
    request.state = MagicMock()
    del request.state.user_id

    # Ensure IP is NOT blocked
    middleware.mock_ip_blocker.is_blocked = AsyncMock(return_value=False)

    # Simulate limit exceeded
    middleware.rate_limiter.check_sliding_window = AsyncMock(return_value=(False, 0))

    response = await middleware.dispatch(request, call_next=AsyncMock())

    assert response.status_code == 429
    assert b"Rate limit exceeded" in response.body
    # Verify monitor called
    middleware.mock_monitor.log_violation.assert_called_once()

@pytest.mark.asyncio
async def test_dispatch_success_headers(middleware):
    request = MagicMock(spec=Request)
    request.url.path = "/api/test"
    request.client.host = "1.2.3.4"
    request.method = "GET"
    request.state = MagicMock()
    del request.state.user_id

    middleware.mock_ip_blocker.is_blocked = AsyncMock(return_value=False)
    middleware.rate_limiter.check_sliding_window = AsyncMock(return_value=(True, 5))
    middleware.rate_limiter.get_reset_time = AsyncMock(return_value=1234567890)

    call_next = AsyncMock(return_value=Response("Success"))

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert response.headers["X-RateLimit-Limit"] == "10" # Endpoint limit
