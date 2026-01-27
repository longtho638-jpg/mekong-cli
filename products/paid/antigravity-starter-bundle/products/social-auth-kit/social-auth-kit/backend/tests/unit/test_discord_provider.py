import pytest
from unittest.mock import MagicMock, patch
from app.providers.discord import DiscordProvider
from app.providers.base import UnifiedUserProfile

@pytest.fixture
def discord_provider():
    return DiscordProvider(
        client_id="discord_id",
        client_secret="discord_secret",
        redirect_uri="http://localhost:3000/callback"
    )

def test_discord_auth_url(discord_provider):
    state = "discord_state"
    url = discord_provider.get_auth_url(state)
    assert "https://discord.com/api/oauth2/authorize" in url
    assert "client_id=discord_id" in url
    assert "scope=identify+email" in url
    assert "response_type=code" in url

@pytest.mark.asyncio
async def test_discord_get_user_info(discord_provider):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "id": "987654321",
        "username": "discord_user",
        "global_name": "Discord Global",
        "email": "user@discord.com",
        "avatar": "avatar_hash"
    }
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", return_value=mock_response) as mock_get:
        profile = await discord_provider.get_user_info("discord_token")

        assert profile.email == "user@discord.com"
        assert profile.provider_user_id == "987654321"
        assert profile.full_name == "Discord Global"
        assert profile.avatar_url == "https://cdn.discordapp.com/avatars/987654321/avatar_hash.png"
        assert profile.provider == "discord"
