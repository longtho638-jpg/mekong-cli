import pytest
from unittest.mock import MagicMock, patch
from app.providers.github import GitHubProvider
from app.providers.base import UnifiedUserProfile

@pytest.fixture
def github_provider():
    return GitHubProvider(
        client_id="gh_id",
        client_secret="gh_secret",
        redirect_uri="http://localhost:3000/callback"
    )

def test_github_auth_url(github_provider):
    state = "gh_state"
    url = github_provider.get_auth_url(state)
    assert "https://github.com/login/oauth/authorize" in url
    assert "client_id=gh_id" in url
    assert "scope=user%3Aemail+read%3Auser" in url
    assert "state=gh_state" in url

@pytest.mark.asyncio
async def test_github_get_user_info_public_email(github_provider):
    mock_response_user = MagicMock()
    mock_response_user.json.return_value = {
        "id": 12345,
        "login": "ghuser",
        "name": "GitHub User",
        "email": "public@github.com",
        "avatar_url": "http://gh.com/avatar.png"
    }
    mock_response_user.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", return_value=mock_response_user) as mock_get:
        profile = await github_provider.get_user_info("gh_token")

        assert profile.email == "public@github.com"
        assert profile.provider_user_id == "12345"
        assert profile.full_name == "GitHub User"
        assert profile.provider == "github"

@pytest.mark.asyncio
async def test_github_get_user_info_private_email(github_provider):
    # Mock user response with no email
    mock_response_user = MagicMock()
    mock_response_user.json.return_value = {
        "id": 67890,
        "login": "privateuser",
        "name": None,
        "email": None,
        "avatar_url": None
    }

    # Mock emails response
    mock_response_emails = MagicMock()
    mock_response_emails.json.return_value = [
        {"email": "unverified@email.com", "primary": False, "verified": False},
        {"email": "primary@email.com", "primary": True, "verified": True}
    ]

    async def side_effect(url, headers):
        if url == "https://api.github.com/user":
            return mock_response_user
        elif url == "https://api.github.com/user/emails":
            return mock_response_emails
        raise ValueError("Unknown URL")

    with patch("httpx.AsyncClient.get", side_effect=side_effect) as mock_get:
        profile = await github_provider.get_user_info("gh_token")

        assert profile.email == "primary@email.com"
        assert profile.provider_user_id == "67890"
        assert profile.full_name == "privateuser" # Fallback to login
