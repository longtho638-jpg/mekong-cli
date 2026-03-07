"""
Tier Rate Limit Middleware — ROIaaS Phase 6

Middleware to extract tier from license key and apply rate limits.
Supports tenant-specific overrides.
"""

import os
import time
from typing import Optional, Dict, Any

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.lib.rate_limiter_factory import get_factory, TierRateLimiter
from src.lib.jwt_license_generator import validate_jwt_license
from src.db.tier_config_repository import TierConfigRepository
from src.lib.tier_config import RateLimitConfig


class TierRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply tier-based rate limiting.

    Extracts license key from headers, validates tier, and applies rate limits.
    Falls back to FREE tier for missing/invalid keys.
    Bypasses rate limiting in dev environment.
    """

    # Header names for license key extraction
    LICENSE_KEY_HEADERS = ["X-License-Key", "Authorization"]

    # Rate limit header names
    HEADER_TIER = "X-RateLimit-Tier"
    HEADER_LIMIT = "X-RateLimit-Limit"
    HEADER_REMAINING = "X-RateLimit-Remaining"
    HEADER_RESET = "X-RateLimit-Reset"
    HEADER_RETRY_AFTER = "Retry-After"

    def __init__(
        self,
        app: ASGIApp,
        enable_rate_limiting: bool = True,
    ) -> None:
        super().__init__(app)
        self._enable_rate_limiting = enable_rate_limiting
        self._factory = get_factory()
        self._dev_mode = os.getenv("MEKONG_DEV_MODE", "false").lower() == "true"
        self._repo = TierConfigRepository()

        # In-memory rate limiters per tier/preset (for demo purposes)
        # Production should use Redis-backed limiting
        self._limiters: Dict[str, TierRateLimiter] = {}

    def _extract_license_key(self, request: Request) -> Optional[str]:
        """
        Extract license key from request headers.

        Checks X-License-Key first, then Authorization Bearer token.
        """
        # Check X-License-Key header
        license_key = request.headers.get("X-License-Key")
        if license_key:
            return license_key.strip()

        # Check Authorization Bearer token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            # If token looks like a license key (contains dots for JWT)
            if "." in token:
                return token

        return None

    def _validate_and_get_tier(self, license_key: str) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        Validate license key and extract tier.

        Returns:
            Tuple of (tier_name, jwt_payload)
            If invalid, returns ("free", None)
        """
        if not license_key:
            return "free", None

        try:
            # Validate JWT license key
            is_valid, payload, error = validate_jwt_license(license_key)

            if is_valid and payload:
                tier = payload.get("tier", "free")
                return tier.lower(), payload

            # Invalid key → fallback to free
            return "free", None

        except Exception:
            # Any error → fallback to free
            return "free", None

    def _get_rate_limiter(self, tier: str, preset: str = "api_default") -> TierRateLimiter:
        """
        Get or create rate limiter for tier/preset.

        Uses factory to get properly configured limiter.
        """
        cache_key = f"{tier}:{preset}"

        if cache_key not in self._limiters:
            self._limiters[cache_key] = self._factory.get_rate_limiter(tier, preset)

        return self._limiters[cache_key]

    async def _get_tenant_override(self, tenant_id: str, preset: str) -> Optional[RateLimitConfig]:
        """
        Check for tenant-specific rate limit override.

        Args:
            tenant_id: Tenant identifier (license key ID)
            preset: Rate limit preset name

        Returns:
            RateLimitConfig if override exists, None otherwise
        """
        try:
            override = await self._repo.get_tenant_override(tenant_id, preset)
            if override and not override.is_expired() and override.custom_limit is not None:
                return RateLimitConfig(
                    requests_per_minute=override.custom_limit,
                )
        except Exception:
            # DB errors → fall through to tier defaults
            pass
        return None

    def _is_dev_mode(self) -> bool:
        """Check if running in development mode."""
        return self._dev_mode or os.getenv("DISABLE_RATE_LIMITING", "false").lower() == "true"

    async def dispatch(self, request: Request, call_next):
        """
        Process request with tier-based rate limiting.

        Flow:
        1. Extract license key from headers
        2. Validate key and get tier + tenant_id
        3. Check for tenant-specific override
        4. Get rate limiter (tenant override or tier default)
        5. Check rate limit
        6. Add rate limit headers to response
        """
        # Bypass rate limiting in dev mode
        if self._is_dev_mode():
            response = await call_next(request)
            response.headers[self.HEADER_TIER] = "dev"
            response.headers[self.HEADER_LIMIT] = "unlimited"
            return response

        # Extract license key and get tier
        license_key = self._extract_license_key(request)
        tier, jwt_payload = self._validate_and_get_tier(license_key)

        # Determine preset based on endpoint path
        path = request.url.path
        preset = self._get_preset_for_path(path)

        # Check for tenant-specific override
        tenant_id = license_key or "anonymous"
        override_config = await self._get_tenant_override(tenant_id, preset)

        if override_config:
            # Use tenant override - create temp limiter
            limiter = TierRateLimiter(
                requests_per_minute=override_config.requests_per_minute,
                window_seconds=override_config.window_seconds,
            )
            config = override_config
            applied_tier = f"{tier} (custom)"
        else:
            # Use tier default
            limiter = self._get_rate_limiter(tier, preset)
            config = self._factory.get_config_for_tier(tier, preset)
            applied_tier = tier

        # Check rate limit
        if not limiter.acquire():
            # Rate limited
            wait_time = limiter.get_wait_time()
            retry_after = max(1, int(wait_time))

            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded for {applied_tier}",
                    "retry_after": retry_after,
                    "tier": applied_tier,
                    "limit": config.requests_per_minute,
                },
                headers={
                    self.HEADER_TIER: applied_tier,
                    self.HEADER_LIMIT: str(config.requests_per_minute),
                    self.HEADER_RETRY_AFTER: str(retry_after),
                    "Content-Type": "application/json",
                },
            )

        # Proceed with request
        response = await call_next(request)

        # Add rate limit headers to response
        remaining = max(0, int(limiter._tokens))
        reset_time = int(time.time() + 60)  # Reset in 60 seconds

        response.headers[self.HEADER_TIER] = applied_tier
        response.headers[self.HEADER_LIMIT] = str(config.requests_per_minute)
        response.headers[self.HEADER_REMAINING] = str(remaining)
        response.headers[self.HEADER_RESET] = str(reset_time)

        return response

    def _get_preset_for_path(self, path: str) -> str:
        """
        Map request path to rate limit preset.

        Maps auth endpoints to specific presets, defaults to api_default.
        """
        path_lower = path.lower()

        if "/auth/login" in path_lower or "/auth/dev-login" in path_lower:
            return "auth_login"
        elif "/auth/callback" in path_lower:
            return "auth_callback"
        elif "/auth/refresh" in path_lower:
            return "auth_refresh"
        elif "/auth/" in path_lower:
            return "auth_login"  # Default auth preset
        else:
            return "api_default"


def create_tier_rate_limit_middleware(enable_rate_limiting: bool = True) -> type:
    """
    Factory function to create tier rate limit middleware.

    Args:
        enable_rate_limiting: If False, bypass rate limiting

    Returns:
        Middleware class to add to FastAPI app
    """
    class ConfiguredMiddleware(TierRateLimitMiddleware):
        def __init__(self, app: ASGIApp) -> None:
            super().__init__(app, enable_rate_limiting=enable_rate_limiting)

    return ConfiguredMiddleware


__all__ = [
    "TierRateLimitMiddleware",
    "create_tier_rate_limit_middleware",
]
