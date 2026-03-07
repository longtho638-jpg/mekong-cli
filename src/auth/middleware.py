"""
Session Middleware - JWT authentication middleware for FastAPI

Handles session validation, user context injection, and environment-aware auth bypass.
Includes rate limiting for auth endpoints.
"""

from typing import Optional
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.auth.session_manager import SessionManager
from src.auth.config import AuthConfig
from src.auth.user_repository import UserRepository
from src.auth.rate_limiter import (
    RateLimiter,
    RateLimitPreset,
    get_rate_limiter,
)
from src.models.user import User


# Map endpoint paths to rate limit presets
AUTH_RATE_LIMITS = {
    "/auth/login": RateLimitPreset.AUTH_LOGIN,
    "/auth/callback": RateLimitPreset.AUTH_CALLBACK,
    "/auth/refresh": RateLimitPreset.AUTH_REFRESH,
    "/auth/dev-login": RateLimitPreset.AUTH_DEV_LOGIN,
}


class SessionMiddleware(BaseHTTPMiddleware):
    """Middleware to authenticate requests via JWT session tokens.

    Includes rate limiting for auth endpoints to prevent brute-force attacks.
    """

    def __init__(
        self,
        app: ASGIApp,
        session_manager: Optional[SessionManager] = None,
        rate_limiter: Optional[RateLimiter] = None,
    ):
        super().__init__(app)
        self._session_manager = session_manager or SessionManager()
        self._user_repo = UserRepository()
        self._rate_limiter = rate_limiter or get_rate_limiter()

    async def _authenticate_user(
        self,
        token: str,
    ) -> Optional[tuple[User, dict]]:
        """Authenticate user from JWT token.

        Args:
            token: JWT session token

        Returns:
            Tuple of (user, token_payload) if valid, None otherwise
        """
        # Decode and validate token
        is_valid, payload, error = self._session_manager.decode_token(token)
        if not is_valid:
            return None

        # Get user from database
        user_id = payload.get("sub")
        if not user_id:
            return None

        try:
            from uuid import UUID
            user = await self._user_repo.find_by_id(UUID(user_id))
            if not user:
                return None

            return user, payload
        except (ValueError, Exception):
            return None

    async def _check_rate_limit(
        self,
        request: Request,
    ) -> tuple[bool, dict[str, str]]:
        """Check rate limit for auth endpoints.

        Args:
            request: FastAPI Request object

        Returns:
            Tuple of (allowed: bool, headers: dict)
        """
        # Get client IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.headers.get("X-Real-IP"):
            client_ip = request.headers.get("X-Real-IP").strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        # Determine endpoint preset based on path
        path = request.url.path
        preset = None

        for endpoint, endpoint_preset in AUTH_RATE_LIMITS.items():
            if path.startswith(endpoint):
                preset = endpoint_preset
                break

        if preset is None:
            # No rate limit for non-auth endpoints
            return True, {}

        # Check rate limit
        key = f"{client_ip}:{path}"
        allowed, headers = await self._rate_limiter.check_limit(key, preset=preset)

        return allowed, headers

    async def dispatch(self, request: Request, call_next):
        """Process request and inject user context."""
        config = AuthConfig()

        # Check rate limit for auth endpoints (even in dev mode for safety)
        allowed, rate_headers = await self._check_rate_limit(request)

        if not allowed:
            # Return 429 Too Many Requests
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": int(rate_headers.get("Retry-After", 60)),
                },
                headers=rate_headers,
            )

        # Store rate limit headers in request state for response
        request.state.rate_limit_headers = rate_headers

        # DEV MODE: Auto-authenticate as test user
        if config.is_dev_mode():
            request.state.authenticated = True
            request.state.user = type(
                "TestUser",
                (),
                {
                    "id": "test-user-id",
                    "email": "test@dev.local",
                    "role": "owner",
                },
            )()
            request.state.user_id = "test-user-id"
            request.state.user_email = "test@dev.local"
            request.state.user_role = "owner"
            request.state.is_dev_mode = True

            response = await call_next(request)

            # Add rate limit headers to response
            for header_name, header_value in rate_headers.items():
                response.headers[header_name] = header_value

            return response

        # PRODUCTION/STAGING: Normal authentication flow
        token = self._session_manager.get_session_cookie(request)

        if token:
            result = await self._authenticate_user(token)
            if result:
                user, payload = result
                request.state.authenticated = True
                request.state.user = user
                request.state.user_id = payload.get("sub")
                request.state.user_email = payload.get("email")
                request.state.user_role = payload.get("role", "member")
                request.state.is_dev_mode = False
            else:
                request.state.authenticated = False
                request.state.user = None
                request.state.user_id = None
                request.state.user_email = None
                request.state.user_role = None
                request.state.is_dev_mode = False
        else:
            request.state.authenticated = False
            request.state.user = None
            request.state.user_id = None
            request.state.user_email = None
            request.state.user_role = None
            request.state.is_dev_mode = False

        response = await call_next(request)

        # Add rate limit headers to response
        for header_name, header_value in rate_headers.items():
            response.headers[header_name] = header_value

        return response


class OptionalAuthMiddleware(BaseHTTPMiddleware):
    """Middleware that makes authentication optional.

    Unlike SessionMiddleware, this doesn't reject unauthenticated requests.
    Routes must use @require_role or @require_permission decorators to enforce auth.
    Includes rate limiting for auth endpoints.
    """

    def __init__(
        self,
        app: ASGIApp,
        session_manager: Optional[SessionManager] = None,
        rate_limiter: Optional[RateLimiter] = None,
    ):
        super().__init__(app)
        self._session_manager = session_manager or SessionManager()
        self._user_repo = UserRepository()
        self._rate_limiter = rate_limiter or get_rate_limiter()

    async def _check_rate_limit(
        self,
        request: Request,
    ) -> tuple[bool, dict[str, str]]:
        """Check rate limit for auth endpoints.

        Args:
            request: FastAPI Request object

        Returns:
            Tuple of (allowed: bool, headers: dict)
        """
        # Get client IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.headers.get("X-Real-IP"):
            client_ip = request.headers.get("X-Real-IP").strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        # Determine endpoint preset based on path
        path = request.url.path
        preset = None

        for endpoint, endpoint_preset in AUTH_RATE_LIMITS.items():
            if path.startswith(endpoint):
                preset = endpoint_preset
                break

        if preset is None:
            # No rate limit for non-auth endpoints
            return True, {}

        # Check rate limit
        key = f"{client_ip}:{path}"
        allowed, headers = await self._rate_limiter.check_limit(key, preset=preset)

        return allowed, headers

    async def _authenticate_user(self, token: str) -> Optional[tuple[User, dict]]:
        """Authenticate user from JWT token."""
        is_valid, payload, error = self._session_manager.decode_token(token)
        if not is_valid:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        try:
            from uuid import UUID
            user = await self._user_repo.find_by_id(UUID(user_id))
            if not user:
                return None
            return user, payload
        except (ValueError, Exception):
            return None

    async def dispatch(self, request: Request, call_next):
        """Process request and attach user context if authenticated."""
        # Check rate limit for auth endpoints
        allowed, rate_headers = await self._check_rate_limit(request)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": int(rate_headers.get("Retry-After", 60)),
                },
                headers=rate_headers,
            )

        token = self._session_manager.get_session_cookie(request)

        if token:
            result = await self._authenticate_user(token)
            if result:
                user, payload = result
                request.state.authenticated = True
                request.state.user = user
                request.state.user_id = payload.get("sub")
                request.state.user_email = payload.get("email")
                request.state.user_role = payload.get("role", "member")
            else:
                request.state.authenticated = False
                request.state.user = None
                request.state.user_role = None
        else:
            request.state.authenticated = False
            request.state.user = None
            request.state.user_role = None

        response = await call_next(request)

        # Add rate limit headers to response
        for header_name, header_value in rate_headers.items():
            response.headers[header_name] = header_value

        return response


def create_auth_middleware(dev_mode: bool = False):
    """Factory function to create appropriate auth middleware.

    Args:
        dev_mode: If True, bypass authentication (for local development)
        If False, use environment-aware middleware

    Returns:
        Middleware class to add to FastAPI app
    """
    if dev_mode:
        # Return a bypass middleware for development
        class DevBypassMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                request.state.authenticated = True
                request.state.user = type(
                    "DevUser",
                    (),
                    {"id": "dev-user", "email": "dev@local", "role": "owner"},
                )()
                request.state.user_role = "owner"
                return await call_next(request)

        return DevBypassMiddleware
    else:
        return SessionMiddleware
