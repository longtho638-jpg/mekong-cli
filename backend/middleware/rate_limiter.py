import logging
import os
import time
from typing import List, Optional, Tuple

import yaml
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.api.config.settings import settings
from backend.services.ip_blocker import ip_blocker
from backend.services.rate_limit_monitor import rate_limit_monitor
from backend.services.rate_limiter_service import RateLimiterService

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    Applies multi-layer protection:
    0. Layer 0: IP Blocklist Check (DDoS protection)
    1. Layer 1: IP-based rate limiting (DDoS protection)
    2. Layer 2: Authenticated User rate limiting
    3. Layer 3: Endpoint-specific limits

    Supports Sliding Window, Token Bucket, and Fixed Window algorithms.
    Configurable via backend/config/rate_limits.yaml.
    """
    def __init__(self, app, config_path: str = 'backend/config/rate_limits.yaml'):
        super().__init__(app)
        self.rate_limiter = RateLimiterService()
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self):
        try:
            # Handle relative path from project root
            if not os.path.isabs(self.config_path):
                base_path = os.getcwd()
                full_path = os.path.join(base_path, self.config_path)
            else:
                full_path = self.config_path

            if os.path.exists(full_path):
                with open(full_path) as f:
                    return yaml.safe_load(f).get('rate_limits', {})
            else:
                logger.warning(f"Rate limit config not found at {full_path}. Using defaults.")
                return {}
        except Exception as e:
            logger.warning(f"Failed to load rate limit config from {self.config_path}: {e}. Using defaults.")
            return {}

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and metrics
        if request.url.path in ['/health', '/metrics', '/', '/docs', '/openapi.json', '/redoc']:
            return await call_next(request)

        # Skip OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Get user ID (if authenticated) and IP
        user_id = getattr(request.state, 'user_id', None)
        client_ip = request.client.host if request.client else "unknown"

        # Layer 0: IP Blocklist Check
        if await ip_blocker.is_blocked(client_ip):
            logger.warning(f"Blocked IP attempted access: {client_ip}")
            return Response(
                content='{"error": "Access denied. Your IP is blocked due to suspicious activity."}',
                status_code=403,
                media_type='application/json'
            )

        # Load Global Config
        global_config = self.config.get('global', {})

        # Layer 1: Global IP Limit
        ip_limit = global_config.get('ip_limit', 100)
        ip_window = global_config.get('ip_window', 60)

        # Layer 2: Global User Limit
        user_limit = global_config.get('user_limit', 1000)
        user_window = global_config.get('user_window', 3600)

        # Layer 3: Endpoint Specific Config
        endpoint_path = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint_path)

        if endpoint_config and not endpoint_config.get('enabled', True):
             # Rate limiting disabled for this specific endpoint
            return await call_next(request)

        # Checks to perform
        checks = []

        # 1. IP Check (Global)
        checks.append({
            'key': f"global:ip:{client_ip}",
            'limit': ip_limit,
            'window': ip_window,
            'type': 'global_ip'
        })

        # 2. User Check (Global) - Only if authenticated
        if user_id:
            checks.append({
                'key': f"global:user:{user_id}",
                'limit': user_limit,
                'window': user_window,
                'type': 'global_user'
            })

        # 3. Endpoint Check
        if endpoint_config:
            ep_limit = endpoint_config.get('limit', 100)
            ep_window = endpoint_config.get('window_seconds', 60)
            algorithm = endpoint_config.get('algorithm', 'sliding_window')

            if user_id:
                key = f"ep:user:{user_id}:{endpoint_path}"
            else:
                key = f"ep:ip:{client_ip}:{endpoint_path}"

            checks.append({
                'key': key,
                'limit': ep_limit,
                'window': ep_window,
                'algorithm': algorithm,
                'type': 'endpoint'
            })

        try:
            for check in checks:
                key = check['key']
                limit = check['limit']
                window = check['window']
                algorithm = check.get('algorithm', 'sliding_window')

                allowed = True
                remaining = 0

                # Check based on algorithm
                if algorithm == 'token_bucket':
                    # Simplified assumption for token bucket params
                    allowed, remaining = await self.rate_limiter.check_token_bucket(
                        key, capacity=limit, refill_rate=limit/window if window > 0 else 1
                    )
                elif algorithm == 'fixed_window':
                    allowed, remaining = await self.rate_limiter.check_fixed_window(key, limit, window)
                else: # sliding_window
                    allowed, remaining = await self.rate_limiter.check_sliding_window(key, limit, window)

                if not allowed:
                    # Rate limit exceeded
                    reset_time = await self.rate_limiter.get_reset_time(key, algorithm, window)
                    retry_after = max(1, reset_time - int(time.time()))

                    logger.warning(f"Rate limit exceeded for {key}. Type: {check['type']}")

                    # Async log violation (fire and forget ideally, but here we await for simplicity or spawn task)
                    # In high throughput, use background task
                    try:
                        await rate_limit_monitor.log_violation(
                            ip_address=client_ip,
                            violation_type=check['type'],
                            endpoint=request.url.path,
                            user_id=str(user_id) if user_id else None,
                            headers=dict(request.headers)
                        )
                    except Exception as ex:
                        logger.error(f"Error logging violation: {ex}")

                    return Response(
                        content='{"error": "Rate limit exceeded. Please try again later.", "type": "' + check['type'] + '"}',
                        status_code=429,
                        media_type='application/json',
                        headers={
                            'X-RateLimit-Limit': str(limit),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': str(reset_time),
                            'Retry-After': str(retry_after),
                            'X-RateLimit-Type': check['type']
                        },
                    )

        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Graceful degradation: Fail open if rate limiter fails (e.g. Redis down)
            return await call_next(request)

        # All checks passed
        response = await call_next(request)

        # Add headers for the most restrictive limit (Endpoint) if it exists, otherwise Global IP
        # This is a simplification; ideally we'd return the lowest remaining limit
        try:
            # Use the last check (usually endpoint) for headers
            last_check = checks[-1]
            key = last_check['key']
            limit = last_check['limit']
            window = last_check['window']
            algorithm = last_check.get('algorithm', 'sliding_window')

            # We don't have the remaining count for all checks easily available without re-querying or storing it
            # For simplicity, we won't add detailed remaining headers for *every* layer,
            # just ensuring the request was allowed.
            # Ideally we would track the minimum remaining.

            # Let's just calculate reset time for the headers
            reset_time = await self.rate_limiter.get_reset_time(key, algorithm, window)
            response.headers['X-RateLimit-Limit'] = str(limit)
            # response.headers['X-RateLimit-Remaining'] = str(remaining) # We don't have accurate remaining for the *exact* check that was last processed in loop
            response.headers['X-RateLimit-Reset'] = str(reset_time)

        except Exception as e:
            logger.error(f"Error setting rate limit headers: {e}")

        return response

    def _get_endpoint_config(self, path: str) -> Optional[dict]:
        """
        Get rate limit config for endpoint.
        Matches longest prefix (e.g., /api/auth/login > /api/auth > /api).
        """
        endpoints = self.config.get('endpoints', {})

        # Try exact match first
        if path in endpoints:
            return endpoints[path]

        # Try prefix match (longest first)
        for endpoint_path in sorted(endpoints.keys(), key=len, reverse=True):
            # Check for glob-like wildcards
            if endpoint_path.endswith('*'):
                prefix = endpoint_path[:-1]
                if path.startswith(prefix):
                    return endpoints[endpoint_path]
            elif path.startswith(endpoint_path):
                 return endpoints[endpoint_path]

        return None
