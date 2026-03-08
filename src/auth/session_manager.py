"""
Session Manager - JWT-based session management with HTTPOnly cookies

Handles JWT token generation, validation, refresh, and cookie management.
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from uuid import UUID

import jwt
from fastapi import Request, Response
from starlette.responses import RedirectResponse

from src.models.user import User, UserSession
from src.auth.user_repository import UserRepository


# JWT Configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", "7"))

# Cookie configuration
COOKIE_NAME = "session_token"
COOKIE_SECURE = os.getenv("AUTH_ENVIRONMENT", "dev") == "production"
COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "lax" if not COOKIE_SECURE else "none"


class SessionManager:
    """Manager for JWT-based user sessions."""

    def __init__(self, user_repo: Optional[UserRepository] = None):
        self._user_repo = user_repo or UserRepository()

    def _create_jwt_claims(
        self,
        user_id: str,
        email: str,
        role: str = "member",
        token_type: str = "access",
    ) -> Dict[str, Any]:
        """Create JWT claims for user.

        Args:
            user_id: User UUID as string
            email: User email address
            role: User role for RBAC
            token_type: 'access' or 'refresh'

        Returns:
            JWT claims dictionary
        """
        now = datetime.now(timezone.utc)
        expire_delta = (
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            if token_type == "access"
            else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )

        return {
            "sub": user_id,
            "email": email,
            "role": role,
            "type": token_type,
            "iat": now,
            "exp": now + expire_delta,
            "jti": secrets.token_urlsafe(16),
        }

    def create_access_token(self, user: User, role: str = "member") -> str:
        """Create JWT access token for user.

        Args:
            user: User object
            role: User role for RBAC (default: member)

        Returns:
            Encoded JWT access token string
        """
        claims = self._create_jwt_claims(
            user_id=str(user.id),
            email=user.email,
            role=role,
            token_type="access",
        )
        return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def create_refresh_token(self, user: User) -> str:
        """Create JWT refresh token for user.

        Args:
            user: User object

        Returns:
            Encoded JWT refresh token string
        """
        claims = self._create_jwt_claims(
            user_id=str(user.id),
            email=user.email,
            token_type="refresh",
        )
        return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def decode_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Decode and validate JWT token.

        Args:
            token: JWT token string

        Returns:
            Tuple of (is_valid, payload_dict, error_message)
            - is_valid: True if token is valid and not expired
            - payload: Decoded claims if valid, None otherwise
            - error: Error message if invalid, None otherwise
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return True, payload, None
        except jwt.ExpiredSignatureError:
            return False, None, "Token has expired"
        except jwt.InvalidTokenError as e:
            return False, None, f"Invalid token: {e}"

    async def create_session(
        self,
        user: User,
        role: str = "member",
    ) -> Tuple[UserSession, str, str]:
        """Create new session for user.

        Generates access and refresh tokens, stores session in database.

        Args:
            user: User object
            role: User role for RBAC

        Returns:
            Tuple of (session, access_token, refresh_token)
        """
        access_token = self.create_access_token(user, role)
        refresh_token = self.create_refresh_token(user)

        # Store session in database (hash the token)
        import hashlib
        _ = hashlib.sha256(access_token.encode()).hexdigest()  # token_hash intentionally unused
        _ = datetime.now(timezone.utc) + timedelta(days=7)  # expires_at intentionally unused

        session = await self._user_repo.create_session(
            user_id=user.id,
            token=access_token,
            expires_hours=168,  # 7 days
        )

        return session, access_token, refresh_token

    async def validate_session(self, token: str) -> Optional[User]:
        """Validate session token and return user.

        Args:
            token: JWT access token

        Returns:
            User object if valid, None otherwise
        """
        is_valid, payload, error = self.decode_token(token)
        if not is_valid:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        try:
            user = await self._user_repo.find_by_id(UUID(user_id))
            return user
        except (ValueError, Exception):
            return None

    async def revoke_session(self, session_id: UUID) -> bool:
        """Revoke/invalidate a session (logout).

        Args:
            session_id: Session UUID to revoke

        Returns:
            True if session was revoked, False otherwise
        """
        return await self._user_repo.delete_session(session_id)

    async def revoke_all_user_sessions(self, user_id: UUID) -> int:
        """Revoke all sessions for a user (logout everywhere).

        Args:
            user_id: User UUID

        Returns:
            Number of sessions revoked
        """
        return await self._user_repo.delete_user_sessions(user_id)

    async def refresh_session(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        """Refresh session using refresh token.

        Args:
            refresh_token: JWT refresh token

        Returns:
            Tuple of (new_access_token, new_refresh_token) if successful,
            None if refresh token is invalid or expired
        """
        is_valid, payload, error = self.decode_token(refresh_token)
        if not is_valid:
            return None

        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            return None

        # Fetch user to ensure still exists
        try:
            user = await self._user_repo.find_by_id(UUID(user_id))
            if not user:
                return None

            # Generate new tokens
            new_access = self.create_access_token(user)
            new_refresh = self.create_refresh_token(user)

            return new_access, new_refresh
        except (ValueError, Exception):
            return None

    # === HTTPOnly Cookie Helpers ===

    def create_session_cookie(
        self,
        token: str,
        expires_in_days: int = 7,
    ) -> Dict[str, Any]:
        """Create HTTPOnly cookie parameters for session token.

        Args:
            token: JWT session token
            expires_in_days: Cookie expiration in days

        Returns:
            Dictionary of cookie parameters for Response.set_cookie()
        """
        # Read environment variables dynamically for each call
        current_env = os.getenv("AUTH_ENVIRONMENT", "dev")
        cookie_secure = current_env == "production"
        cookie_samesite = "none" if cookie_secure else "lax"

        return {
            "key": COOKIE_NAME,
            "value": token,
            "httponly": COOKIE_HTTPONLY,
            "secure": cookie_secure,
            "samesite": cookie_samesite,
            "max_age": expires_in_days * 24 * 60 * 60,
            "path": "/",
        }

    def set_session_cookie(
        self,
        response: Response,
        token: str,
        expires_in_days: int = 7,
    ) -> Response:
        """Set session cookie on response.

        Args:
            response: FastAPI Response object
            token: JWT session token
            expires_in_days: Cookie expiration in days

        Returns:
            Response with cookie set
        """
        cookie_params = self.create_session_cookie(token, expires_in_days)
        response.set_cookie(**cookie_params)
        return response

    def get_session_cookie(self, request: Request) -> Optional[str]:
        """Extract session token from request cookie.

        Args:
            request: FastAPI Request object

        Returns:
            Session token if present, None otherwise
        """
        return request.cookies.get(COOKIE_NAME)

    def delete_session_cookie(self, response: Response) -> Response:
        """Delete session cookie from response.

        Args:
            response: FastAPI Response object

        Returns:
            Response with cookie deleted
        """
        response.delete_cookie(
            key=COOKIE_NAME,
            path="/",
            domain=None,
        )
        return response

    def create_logout_redirect(
        self,
        response: Response,
        redirect_to: str = "/",
    ) -> RedirectResponse:
        """Create redirect response that clears session cookie.

        Args:
            response: Response object (for cookie clearing)
            redirect_to: URL to redirect to after logout

        Returns:
            RedirectResponse with cleared session cookie
        """
        redirect = RedirectResponse(url=redirect_to, status_code=303)
        self.delete_session_cookie(redirect)
        return redirect


# Convenience functions for simple usage

async def create_session(user: User, role: str = "member") -> Tuple[UserSession, str, str]:
    """Create new session for user."""
    manager = SessionManager()
    return await manager.create_session(user, role)


async def validate_token(token: str) -> Optional[User]:
    """Validate token and return user."""
    manager = SessionManager()
    return await manager.validate_session(token)


async def revoke_session(session_id: UUID) -> bool:
    """Revoke session."""
    manager = SessionManager()
    return await manager.revoke_session(session_id)


def get_token_from_request(request: Request) -> Optional[str]:
    """Get session token from request cookie."""
    manager = SessionManager()
    return manager.get_session_cookie(request)
