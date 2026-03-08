"""
OAuth2 Providers - Google and GitHub authentication

Handles OAuth2 authorization code flow with both providers.
"""

import os
import hashlib
import secrets
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlencode

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


# OAuth2 Configuration from environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8080/auth/callback")

# OAuth2 endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"
GITHUB_EMAIL_URL = "https://api.github.com/user/emails"


def generate_state() -> str:
    """Generate cryptographically secure state parameter for CSRF protection."""
    return secrets.token_urlsafe(32)


def generate_pkce_verifier() -> str:
    """Generate PKCE code verifier."""
    return secrets.token_urlsafe(64)


def generate_pkce_challenge(verifier: str) -> str:
    """Generate PKCE code challenge from verifier (SHA256)."""
    sha256_hash = hashlib.sha256(verifier.encode()).digest()
    # Base64URL encode
    import base64
    return base64.urlsafe_b64encode(sha256_hash).rstrip(b"=").decode()


class OAuth2Client:
    """OAuth2 client for Google and GitHub authentication."""

    def __init__(self):
        self._client = None
        # Defer httpx check to actual HTTP calls

    def _get_http_client(self):
        """Get or create the HTTP client (lazy init, requires httpx)."""
        if self._client is None:
            if not HTTPX_AVAILABLE:
                raise ImportError("httpx not installed. Run: pip install httpx")
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self):
        """Close the HTTP client if it was created."""
        import inspect
        if self._client is not None:
            result = self._client.aclose()
            if inspect.isawaitable(result):
                await result

    # === Google OAuth2 ===

    def get_google_oauth_url(
        self,
        state: Optional[str] = None,
        pkce_verifier: Optional[str] = None,
    ) -> str:
        """Generate Google OAuth2 authorization URL.

        Args:
            state: CSRF protection state parameter (generated if not provided)
            pkce_verifier: PKCE code verifier for public clients

        Returns:
            Authorization URL to redirect user to
        """
        if state is None:
            state = generate_state()

        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }

        # Add PKCE if verifier provided
        if pkce_verifier:
            params["code_challenge"] = generate_pkce_challenge(pkce_verifier)
            params["code_challenge_method"] = "S256"

        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    async def handle_google_callback(
        self,
        code: str,
        state: Optional[str] = None,
        pkce_verifier: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], str]:
        """Handle Google OAuth2 callback.

        Args:
            code: Authorization code from callback
            state: State parameter to verify (optional)
            pkce_verifier: PKCE code verifier if used

        Returns:
            Tuple of (user_info, access_token)

        Raises:
            ValueError: If token exchange fails
        """
        # Exchange code for token
        token_data = await self._exchange_google_token(code, pkce_verifier)
        access_token = token_data["access_token"]

        # Fetch user info
        user_info = await self._get_google_userinfo(access_token)
        return user_info, access_token

    async def _exchange_google_token(
        self,
        code: str,
        pkce_verifier: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI,
        }

        if pkce_verifier:
            data["code_verifier"] = pkce_verifier

        response = await self._get_http_client().post(GOOGLE_TOKEN_URL, data=data)
        response.raise_for_status()
        return response.json()

    async def _get_google_userinfo(self, access_token: str) -> Dict[str, Any]:
        """Fetch user info from Google."""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await self._get_http_client().get(GOOGLE_USERINFO_URL, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Normalize to common format
        return {
            "email": data.get("email"),
            "email_verified": data.get("email_verified", False),
            "name": data.get("name"),
            "picture": data.get("picture"),
            "oauth_id": data.get("id") or data.get("sub"),
            "provider": "google",
        }

    # === GitHub OAuth2 ===

    def get_github_oauth_url(
        self,
        state: Optional[str] = None,
    ) -> str:
        """Generate GitHub OAuth2 authorization URL.

        Args:
            state: CSRF protection state parameter (generated if not provided)

        Returns:
            Authorization URL to redirect user to
        """
        if state is None:
            state = generate_state()

        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "scope": "user:email",
            "state": state,
        }

        return f"{GITHUB_AUTH_URL}?{urlencode(params)}"

    async def handle_github_callback(
        self,
        code: str,
        state: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], str]:
        """Handle GitHub OAuth2 callback.

        Args:
            code: Authorization code from callback
            state: State parameter to verify (optional)

        Returns:
            Tuple of (user_info, access_token)

        Raises:
            ValueError: If token exchange fails
        """
        # Exchange code for token
        token_data = await self._exchange_github_token(code)
        access_token = token_data["access_token"]

        # Fetch user info
        user_info = await self._get_github_userinfo(access_token)
        return user_info, access_token

    async def _exchange_github_token(
        self,
        code: str,
    ) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        headers = {"Accept": "application/json"}
        data = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI,
        }

        response = await self._get_http_client().post(
            GITHUB_TOKEN_URL,
            headers=headers,
            data=data,
        )
        response.raise_for_status()
        return response.json()

    async def _get_github_userinfo(self, access_token: str) -> Dict[str, Any]:
        """Fetch user info from GitHub."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        # Get basic user info
        response = await self._get_http_client().get(GITHUB_USERINFO_URL, headers=headers)
        response.raise_for_status()
        data = response.json()

        # GitHub may return null email if user has no public email
        # Need to fetch emails separately
        email = data.get("email")
        if not email:
            email = await self._get_github_primary_email(access_token)

        # Normalize to common format
        return {
            "email": email,
            "email_verified": True,  # GitHub verifies emails
            "name": data.get("name") or data.get("login"),
            "picture": data.get("avatar_url"),
            "oauth_id": str(data.get("id")),
            "provider": "github",
            "login": data.get("login"),
        }

    async def _get_github_primary_email(self, access_token: str) -> str:
        """Get primary email from GitHub emails endpoint."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        response = await self._get_http_client().get(GITHUB_EMAIL_URL, headers=headers)
        response.raise_for_status()
        emails = response.json()

        # Find primary or first verified email
        for email_data in emails:
            if email_data.get("primary"):
                return email_data["email"]
            if email_data.get("verified"):
                return email_data["email"]

        # Fallback to first email
        if emails:
            return emails[0]["email"]

        raise ValueError("No email found for GitHub user")


# Convenience functions for simple usage

async def get_google_oauth_url() -> str:
    """Get Google OAuth2 URL."""
    client = OAuth2Client()
    try:
        return client.get_google_oauth_url()
    finally:
        await client.close()


async def get_github_oauth_url() -> str:
    """Get GitHub OAuth2 URL."""
    client = OAuth2Client()
    try:
        return client.get_github_oauth_url()
    finally:
        await client.close()


async def handle_google_callback(code: str) -> Tuple[Dict[str, Any], str]:
    """Handle Google OAuth2 callback."""
    client = OAuth2Client()
    try:
        return await client.handle_google_callback(code)
    finally:
        await client.close()


async def handle_github_callback(code: str) -> Tuple[Dict[str, Any], str]:
    """Handle GitHub OAuth2 callback."""
    client = OAuth2Client()
    try:
        return await client.handle_github_callback(code)
    finally:
        await client.close()


async def get_user_info(provider: str, token: str) -> Dict[str, Any]:
    """Fetch user info from provider using access token.

    Args:
        provider: 'google' or 'github'
        token: Access token

    Returns:
        User info dict with email, name, oauth_id, provider
    """
    client = OAuth2Client()
    try:
        if provider == "google":
            return await client._get_google_userinfo(token)
        elif provider == "github":
            return await client._get_github_userinfo(token)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    finally:
        await client.close()
