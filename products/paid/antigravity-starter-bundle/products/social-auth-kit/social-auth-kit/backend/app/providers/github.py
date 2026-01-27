import httpx
from urllib.parse import urlencode
from .base import BaseProvider, UnifiedUserProfile

class GitHubProvider(BaseProvider):
    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_INFO_URL = "https://api.github.com/user"
    EMAILS_URL = "https://api.github.com/user/emails"

    def get_auth_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "user:email read:user",
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
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()["access_token"]

    async def get_user_info(self, token: str) -> UnifiedUserProfile:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            }
            response = await client.get(self.USER_INFO_URL, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Logic to handle private emails
            email = data.get("email")
            if not email:
                emails_resp = await client.get(self.EMAILS_URL, headers=headers)
                emails_resp.raise_for_status()
                emails = emails_resp.json()
                # Find primary verified email
                for e in emails:
                    if e.get("primary") and e.get("verified"):
                        email = e["email"]
                        break

            return UnifiedUserProfile(
                email=email,
                provider="github",
                provider_user_id=str(data["id"]),
                full_name=data.get("name") or data.get("login"),
                avatar_url=data.get("avatar_url"),
            )
