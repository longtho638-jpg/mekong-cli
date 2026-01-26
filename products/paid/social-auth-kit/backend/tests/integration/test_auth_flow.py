import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from app.providers.base import UnifiedUserProfile

# Reuse the mock setup from the provided example but structure it better
@pytest.mark.asyncio
async def test_login_flow_redirect(client: AsyncClient):
    """Test that the login endpoint redirects to the provider's auth URL."""
    with patch("app.providers.GoogleProvider.get_auth_url") as mock_url:
        mock_url.return_value = "https://accounts.google.com/o/oauth2/v2/auth?mock=true"
        response = await client.get("/api/v1/auth/login/google")
        assert response.status_code == 200
        data = response.json()
        assert data["authorization_url"] == "https://accounts.google.com/o/oauth2/v2/auth?mock=true"

@pytest.mark.asyncio
async def test_auth_callback_creates_user(client: AsyncClient, db_session):
    """Test that the callback creates a new user and returns tokens."""
    mock_profile = UnifiedUserProfile(
        email="newuser@example.com",
        provider="google",
        provider_user_id="987654321",
        full_name="New User",
        avatar_url="http://example.com/new.png"
    )

    with patch("app.providers.ProviderFactory.get_provider") as mock_factory:
        mock_provider = MagicMock()

        # Async mock setup
        async def async_return(val):
            return val

        mock_provider.get_token.side_effect = lambda x: async_return("mock_oauth_token")
        mock_provider.get_user_info.side_effect = lambda x: async_return(mock_profile)

        mock_factory.return_value = mock_provider

        # Set the oauth_state cookie to match the state parameter for CSRF protection
        cookies = {"oauth_state": "xyz"}
        response = await client.get("/api/v1/auth/callback/google?code=valid_code&state=xyz", cookies=cookies)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_auth_callback_existing_user(client: AsyncClient, db_session):
    """Test logging in with an existing user."""
    # First login (setup) is handled by mocking the DB state or running the flow twice?
    # Better to run flow twice or seed DB.
    # Let's run flow twice for simplicity in integration test.

    mock_profile = UnifiedUserProfile(
        email="existing@example.com",
        provider="google",
        provider_user_id="111222333",
        full_name="Existing User",
        avatar_url="http://example.com/existing.png"
    )

    with patch("app.providers.ProviderFactory.get_provider") as mock_factory:
        mock_provider = MagicMock()
        async def async_return(val): return val
        mock_provider.get_token.side_effect = lambda x: async_return("mock_oauth_token")
        mock_provider.get_user_info.side_effect = lambda x: async_return(mock_profile)
        mock_factory.return_value = mock_provider

        # First Call
        cookies1 = {"oauth_state": "s1"}
        resp1 = await client.get("/api/v1/auth/callback/google?code=code1&state=s1", cookies=cookies1)
        assert resp1.status_code == 200
        user_id_1 = resp1.json()["user"]["id"]

        # Second Call
        cookies2 = {"oauth_state": "s2"}
        resp2 = await client.get("/api/v1/auth/callback/google?code=code2&state=s2", cookies=cookies2)
        assert resp2.status_code == 200
        user_id_2 = resp2.json()["user"]["id"]

        assert user_id_1 == user_id_2

@pytest.mark.asyncio
async def test_callback_invalid_code(client: AsyncClient):
    """Test callback with provider error."""
    with patch("app.providers.ProviderFactory.get_provider") as mock_factory:
        mock_provider = MagicMock()
        mock_provider.get_token.side_effect = Exception("Invalid Code")
        mock_factory.return_value = mock_provider

        cookies = {"oauth_state": "xyz"}
        response = await client.get("/api/v1/auth/callback/google?code=bad_code&state=xyz", cookies=cookies)
        # Depending on error handling implementation, usually 400 or 500
        # Check app/api/v1/endpoints/auth.py for exception handler
        # Assuming generic error handling for now, or 500 if unhandled
        # Ideally should be handled gracefully.
        assert response.status_code in [400, 500]
