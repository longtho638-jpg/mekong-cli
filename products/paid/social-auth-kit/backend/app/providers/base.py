from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, HttpUrl

class UnifiedUserProfile(BaseModel):
    email: str
    provider: str
    provider_user_id: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class BaseProvider(ABC):
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    @abstractmethod
    def get_auth_url(self, state: str) -> str:
        """Return the URL to redirect the user to for authentication."""
        pass

    @abstractmethod
    async def get_token(self, code: str) -> str:
        """Exchange the authorization code for an access token."""
        pass

    @abstractmethod
    async def get_user_info(self, token: str) -> UnifiedUserProfile:
        """Retrieve user information using the access token."""
        pass
