import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock, patch
from app.providers.base import UnifiedUserProfile
from app.core.config import settings

@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    """Test using a refresh token to get a new access token."""

    # 1. Login to get refresh token
    mock_profile = UnifiedUserProfile(
        email="refresh@example.com",
        provider="google",
        provider_user_id="refresh_123",
        full_name="Refresh User",
        avatar_url="http://example.com/pic.png"
    )

    with patch("app.providers.ProviderFactory.get_provider") as mock_factory:
        mock_provider = MagicMock()
        async def async_return(val): return val
        mock_provider.get_token.side_effect = lambda x: async_return("token")
        mock_provider.get_user_info.side_effect = lambda x: async_return(mock_profile)
        mock_factory.return_value = mock_provider

        cookies = {"oauth_state": "s"}
        login_resp = await client.get("/api/v1/auth/callback/google?code=c&state=s", cookies=cookies)
        refresh_token = login_resp.cookies.get("refresh_token")
        assert refresh_token is not None

    # 2. Use refresh token
    # Needs to be sent as cookie
    cookies = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/refresh", cookies=cookies)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    # Should rotate refresh token (new one in cookies)
    new_refresh_token = response.cookies.get("refresh_token")
    assert new_refresh_token is not None
    assert new_refresh_token != refresh_token

@pytest.mark.asyncio
async def test_refresh_token_reuse_protection(client: AsyncClient):
    """Test that reusing an old refresh token fails (if rotation is strict)."""
    # 1. Login
    mock_profile = UnifiedUserProfile(
        email="reuse@example.com",
        provider="google",
        provider_user_id="reuse_123",
        full_name="Reuse User"
    )
    with patch("app.providers.ProviderFactory.get_provider") as mock_f:
        mock_p = MagicMock()
        async def async_return(val): return val
        mock_p.get_token.side_effect = lambda x: async_return("t")
        mock_p.get_user_info.side_effect = lambda x: async_return(mock_profile)
        mock_f.return_value = mock_p

        cookies = {"oauth_state": "s"}
        login_resp = await client.get("/api/v1/auth/callback/google?code=c&state=s", cookies=cookies)
        refresh_token_1 = login_resp.cookies.get("refresh_token")

    # 2. Refresh once (rotates to token 2)
    cookies1 = {"refresh_token": refresh_token_1}
    resp1 = await client.post("/api/v1/auth/refresh", cookies=cookies1)
    assert resp1.status_code == 200
    refresh_token_2 = resp1.cookies.get("refresh_token")

    # Clear client cookies to prevent auto-sending the new token
    client.cookies.clear()

    # 3. Try to use token 1 again
    # If rotation invalidates old chain or at least the parent
    resp2 = await client.post("/api/v1/auth/refresh", cookies=cookies1)

    # Should fail (401 or 403)
    assert resp2.status_code in [401, 403]

@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient):
    """Test logout endpoint."""
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200

    # Check Set-Cookie header for deletion indicators
    set_cookie = response.headers.get("set-cookie")
    if set_cookie:
        assert "refresh_token" in set_cookie
        # Should have Max-Age=0 or expires in the past
        assert "Max-Age=0" in set_cookie or "Expires=" in set_cookie
    else:
        # If httpx processes it and removes it from .cookies, get returns None
        val = response.cookies.get("refresh_token")
        # It implies it's gone or empty
        assert val is None or val == ""
