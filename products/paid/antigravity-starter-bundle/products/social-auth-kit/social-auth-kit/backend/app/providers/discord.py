import httpx
from urllib.parse import urlencode
from .base import BaseProvider, UnifiedUserProfile

class DiscordProvider(BaseProvider):
    AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize"
    TOKEN_URL = "https://discord.com/api/oauth2/token"
    USER_INFO_URL = "https://discord.com/api/users/@me"

    def get_auth_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "identify email",
            "state": state,
        }
        return f"{self.AUTHORIZE_URL}?{urlencode(params)}"

    async def get_token(self, code: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()["access_token"]

    async def get_user_info(self, token: str) -> UnifiedUserProfile:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            data = response.json()

            # Construct avatar URL
            avatar_url = None
            if data.get("avatar"):
                avatar_url = f"https://cdn.discordapp.com/avatars/{data['id']}/{data['avatar']}.png"

            return UnifiedUserProfile(
                email=data["email"],
                provider="discord",
                provider_user_id=data["id"],
                full_name=data.get("global_name") or data.get("username"),
                avatar_url=avatar_url,
            )
