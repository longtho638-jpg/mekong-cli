import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock, patch
from app.providers.base import UnifiedUserProfile

# Mock User Profile
mock_profile = UnifiedUserProfile(
    email="test@example.com",
    provider="google",
    provider_user_id="12345",
    full_name="Test User",
    avatar_url="http://example.com/avatar.png"
)

@pytest.mark.asyncio
async def test_login_redirect(client: AsyncClient):
    # Test that login endpoint returns a URL
    with patch("app.providers.GoogleProvider.get_auth_url") as mock_url:
        mock_url.return_value = "https://accounts.google.com/o/oauth2/v2/auth?mock=true"
        response = await client.get("/api/v1/auth/login/google")
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert "https://accounts.google.com" in data["authorization_url"]

@pytest.mark.asyncio
async def test_auth_callback_success(client: AsyncClient):
    # Mock Provider
    with patch("app.providers.ProviderFactory.get_provider") as mock_factory:
        mock_provider = MagicMock()
        mock_provider.get_token = MagicMock(return_value="mock_token")
        mock_provider.get_user_info = MagicMock(return_value=mock_profile)

        # Async mocks need to be awaitable
        async def async_return(val):
            return val

        mock_provider.get_token.side_effect = lambda x: async_return("mock_token")
        mock_provider.get_user_info.side_effect = lambda x: async_return(mock_profile)

        mock_factory.return_value = mock_provider

        cookies = {"oauth_state": "abc"}
        response = await client.get("/api/v1/auth/callback/google?code=123&state=abc", cookies=cookies)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"

        # Check Cookies
        assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    # Test logout
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    # Cookie should be cleared (max-age=0 or empty)
    assert "refresh_token" not in response.cookies or response.cookies["refresh_token"] == ""

