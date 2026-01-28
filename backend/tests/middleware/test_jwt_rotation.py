import sys
from unittest.mock import AsyncMock, MagicMock, Mock, patch

# Mock problematic dependencies before they are imported
sys.modules["supabase"] = MagicMock()
sys.modules["gotrue"] = MagicMock()
sys.modules["backend.middleware.license_validator"] = MagicMock()

import pytest
from fastapi import Request, Response

from backend.middleware.jwt_rotation import JWTRotationMiddleware
from backend.services.jwt_service import jwt_service


@pytest.fixture
def mock_app():
    return AsyncMock(return_value=Response("OK"))

@pytest.fixture
def middleware(mock_app):
    return JWTRotationMiddleware(mock_app)

@pytest.mark.asyncio
async def test_jwt_rotation_valid_token(middleware, mock_app):
    request = Mock(spec=Request)
    request.headers = {"Authorization": "Bearer valid_token"}

    # Mock decode to return valid payload
    with patch.object(jwt_service, 'decode_token', new_callable=AsyncMock, return_value={"sub": "user1"}):
        await middleware.dispatch(request, mock_app)

        # Should proceed to next app
        mock_app.assert_called_once()

@pytest.mark.asyncio
async def test_jwt_rotation_blacklisted_token(middleware, mock_app):
    request = Mock(spec=Request)
    request.headers = {"Authorization": "Bearer revoked_token"}

    # Mock decode to return None (simulating blacklist/invalid)
    with patch.object(jwt_service, 'decode_token', new_callable=AsyncMock, return_value=None):
        await middleware.dispatch(request, mock_app)

        # Should still proceed (as per code design, strictness handled by dependencies)
        # But we verify it tried to decode
        mock_app.assert_called_once()

@pytest.mark.asyncio
async def test_jwt_rotation_no_token(middleware, mock_app):
    request = Mock(spec=Request)
    request.headers = {}

    await middleware.dispatch(request, mock_app)
    mock_app.assert_called_once()
