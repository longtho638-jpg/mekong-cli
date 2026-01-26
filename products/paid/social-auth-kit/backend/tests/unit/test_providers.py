import pytest
from unittest.mock import MagicMock, patch
from app.providers.google import GoogleProvider
from app.providers.base import UnifiedUserProfile

@pytest.fixture
def google_provider():
    return GoogleProvider(
        client_id="mock_id",
        client_secret="mock_secret",
        redirect_uri="http://localhost:3000/callback"
    )

def test_google_auth_url(google_provider):
    state = "random_state_string"
    url = google_provider.get_auth_url(state)
    assert "https://accounts.google.com/o/oauth2/v2/auth" in url
    assert "client_id=mock_id" in url
    assert "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback" in url
    assert "state=random_state_string" in url
    assert "scope=openid+email+profile" in url

@pytest.mark.asyncio
async def test_google_get_token(google_provider):
    mock_response = MagicMock()
    mock_response.json.return_value = {"access_token": "mock_access_token"}
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
        token = await google_provider.get_token("mock_code")
        assert token == "mock_access_token"
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["data"]["code"] == "mock_code"

@pytest.mark.asyncio
async def test_google_get_user_info(google_provider):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "email": "test@example.com",
        "sub": "123456789",
        "name": "Test User",
        "picture": "http://example.com/avatar.jpg"
    }
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", return_value=mock_response) as mock_get:
        profile = await google_provider.get_user_info("mock_token")
        assert isinstance(profile, UnifiedUserProfile)
        assert profile.email == "test@example.com"
        assert profile.provider == "google"
        assert profile.provider_user_id == "123456789"
        assert profile.full_name == "Test User"

        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer mock_token"
