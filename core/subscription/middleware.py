"""
☁️ Subscription Middleware - FastAPI Integration
================================================

FastAPI middleware for subscription validation and enforcement.
Integrates with subscription services for request validation.
"""

import logging
from datetime import datetime, timedelta
from typing import Callable, Dict, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from .models.subscription import Subscription, SubscriptionTier
from .services.rate_limiter import RateLimiter
from .services.tier_service import TierService
from .services.usage_tracker import UsageEvent, UsageTracker
from .validators.local_validator import LocalValidator
from .validators.remote_validator import RemoteValidator

logger = logging.getLogger(__name__)


class SubscriptionMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for subscription enforcement."""

    def __init__(self, app, local_app_dir: str = ".mekong"):
        super().__init__(app)
        self.local_validator = LocalValidator(local_app_dir)
        self.remote_validator = RemoteValidator()
        self.tier_service = TierService()
        self.rate_limiter = RateLimiter()
        self.usage_tracker = UsageTracker()

        self._subscription_cache: Dict[str, Dict] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through subscription validation."""
        # Extract user_id from request (adjust based on your auth)
        user_id = self._extract_user_id(request)
        if not user_id:
            # Allow non-authenticated requests to certain endpoints
            if self._is_public_endpoint(request.url.path):
                return await call_next(request)

            return Response(
                content='{"error": "Authentication required"}',
                status_code=401,
                media_type="application/json",
            )

        # Get subscription
        subscription = await self._get_subscription(user_id)

        # Check rate limits
        action = self._get_action_from_request(request)
        if not self.rate_limiter.check_rate_limit(user_id, action):
            return Response(
                content='{"error": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
            )

        # Check tier limits
        tier = subscription.tier
        usage = self.usage_tracker.get_monthly_usage(subscription.agency_id or user_id)

        if action in ["api_call", "command_exec"]:
            limit_check = self.tier_service.check_limit(
                tier, action, usage.api_calls if action == "api_call" else usage.commands
            )
            if not limit_check["allowed"]:
                return Response(
                    content=f'{{"error": "{limit_check["reason"]}"}}',
                    status_code=403,
                    media_type="application/json",
                )

        # Process request
        response = await call_next(request)

        # Record usage on successful requests
        if response.status_code < 400:
            event = UsageEvent(
                user_id=user_id,
                action=action,
                timestamp=datetime.now(),
                agency_id=subscription.agency_id,
                command=self._get_command_from_request(request),
            )
            self.usage_tracker.record_usage(event)

        return response

    def _extract_user_id(self, request: Request) -> Optional[str]:
        """Extract user_id from request headers or JWT token."""
        # Implement based on your authentication system
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Parse JWT token or session cookie
            # For now, return a placeholder
            return "default_user"
        return None

    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (no auth required)."""
        public_paths = ["/health", "/docs", "/openapi.json", "/auth/login", "/auth/register"]
        return any(path.startswith(p) for p in public_paths)

    def _get_action_from_request(self, request: Request) -> str:
        """Determine action type from request."""
        path = request.url.path

        if "/api/" in path:
            return "api_call"
        elif "/command/" in path:
            return "command_exec"
        elif "/video/" in path:
            return "video_gen"

        return "api_call"  # Default

    def _get_command_from_request(self, request: Request) -> Optional[str]:
        """Extract command name from request."""
        # Parse from query params or body
        return request.url.path.split("/")[-1] if request.url.path else None

    async def _get_subscription(self, user_id: str) -> Subscription:
        """Get subscription with caching."""
        # Check cache (5 min TTL)
        if user_id in self._subscription_cache:
            cached = self._subscription_cache[user_id]
            if datetime.now() - cached.get("_cached_at", datetime.min) < timedelta(minutes=5):
                return cached["subscription"]

        # Try local first, then remote
        subscription = self.local_validator.get_subscription(user_id)
        if not subscription:
            subscription = self.remote_validator.get_subscription(user_id)

        # Default subscription if none found
        if not subscription:
            subscription = Subscription(
                user_id=user_id, tier=SubscriptionTier.STARTER, source="default"
            )

        # Update cache
        self._subscription_cache[user_id] = {
            "subscription": subscription,
            "_cached_at": datetime.now(),
        }

        return subscription
