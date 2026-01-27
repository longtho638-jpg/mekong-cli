import httpx
from urllib.parse import urlencode
from .base import BaseProvider, UnifiedUserProfile

class GoogleProvider(BaseProvider):
    AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def get_auth_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
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

            return UnifiedUserProfile(
                email=data["email"],
                provider="google",
                provider_user_id=data["sub"],
                full_name=data.get("name"),
                avatar_url=data.get("picture"),
            )
