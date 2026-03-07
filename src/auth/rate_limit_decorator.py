"""
Rate Limit Decorator - FastAPI decorator for endpoint rate limiting

Provides @rate_limit() decorator for easy endpoint protection.
"""

import re
from functools import wraps
from typing import Optional, Callable
from fastapi import Request, HTTPException
from fastapi.responses import Response

from src.auth.rate_limiter import (
    RateLimitPreset,
    get_rate_limiter,
)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers.

    Checks headers in order:
    1. X-Forwarded-For (proxy/load balancer)
    2. X-Real-IP (nginx proxy)
    3. client.host (direct connection)

    Args:
        request: FastAPI Request object

    Returns:
        Client IP address string

    Example:
        >>> ip = get_client_ip(request)
        >>> # Returns "203.0.113.194" from X-Forwarded-For header
    """
    # Check X-Forwarded-For (may contain multiple IPs: client, proxy1, proxy2)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP (original client)
        return forwarded_for.split(",")[0].strip()

    # Check X-Real-IP (nginx standard)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Fallback to client.host
    # Handle IPv6-mapped IPv4 addresses (e.g., "::ffff:192.168.1.1")
    host = request.client.host if request.client else "127.0.0.1"
    if host.startswith("::ffff:"):
        return host[7:]  # Strip IPv6 prefix

    return host


def parse_rate_limit(limit_string: str) -> tuple[int, int]:
    """Parse rate limit string into (limit, window_seconds).

    Supported formats:
    - "5/minute" or "5/min" -> (5, 60)
    - "10/hour" or "10/hr" -> (10, 3600)
    - "100/day" -> (100, 86400)
    - "5/60" -> (5, 60)  # explicit seconds

    Args:
        limit_string: Rate limit specification

    Returns:
        Tuple of (limit, window_seconds)

    Raises:
        ValueError: If format is invalid

    Example:
        >>> parse_rate_limit("5/minute")
        (5, 60)
        >>> parse_rate_limit("100/day")
        (100, 86400)
    """
    # Pattern: number/timeunit or number/seconds
    pattern = r"^(\d+)/(\w+)$"
    match = re.match(pattern, limit_string.strip().lower())

    if not match:
        raise ValueError(
            f"Invalid rate limit format: '{limit_string}'. "
            f"Use format: '5/minute', '10/hour', '100/day', or '5/60'"
        )

    limit = int(match.group(1))
    unit = match.group(2)

    # Map time units to seconds
    time_units = {
        "second": 1,
        "seconds": 1,
        "sec": 1,
        "s": 1,
        "minute": 60,
        "minutes": 60,
        "min": 60,
        "m": 60,
        "hour": 3600,
        "hours": 3600,
        "hr": 3600,
        "h": 3600,
        "day": 86400,
        "days": 86400,
        "d": 86400,
    }

    if unit.isdigit():
        # Explicit seconds: "5/60" means 5 requests per 60 seconds
        window = int(unit)
    elif unit in time_units:
        window = time_units[unit]
    else:
        raise ValueError(
            f"Unknown time unit: '{unit}'. "
            f"Valid units: second, minute, hour, day (or s, m, h, d)"
        )

    return limit, window


def rate_limit(
    limit: Optional[str] = None,
    preset: Optional[RateLimitPreset] = None,
    key_prefix: Optional[str] = None,
    bypass_dev: bool = True,
) -> Callable:
    """Decorator to apply rate limiting to FastAPI endpoints.

    Can be used with preset or custom limit:

    Args:
        limit: Custom rate limit string (e.g., "5/minute", "100/hour")
        preset: Use predefined preset (e.g., RateLimitPreset.AUTH_LOGIN)
        key_prefix: Optional prefix for rate limit key (default: endpoint path)
        bypass_dev: If True, bypass rate limiting in dev mode (default: True)

    Returns:
        Decorator function

    Raises:
        HTTPException: 429 Too Many Requests when limit exceeded

    Example:
        >>> @app.post("/login")
        >>> @rate_limit(limit="5/minute")
        >>> async def login(request: Request):
        ...     pass

        >>> @app.post("/api/data")
        >>> @rate_limit(preset=RateLimitPreset.API_WRITE)
        >>> async def write_data(request: Request):
        ...     pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs) -> Response:
            # Check if in dev mode and bypass is enabled
            if bypass_dev:
                auth_env = request.headers.get("X-Auth-Environment", "dev")
                if auth_env == "dev":
                    return await func(request, *args, **kwargs)

            # Get rate limiter
            limiter = get_rate_limiter()

            # Build rate limit key: "ip:endpoint" or "ip:prefix:endpoint"
            client_ip = get_client_ip(request)
            endpoint = key_prefix or request.url.path

            if key_prefix:
                key = f"{client_ip}:{key_prefix}:{endpoint}"
            else:
                key = f"{client_ip}:{endpoint}"

            # Determine which preset/config to use
            if preset is not None:
                # Use preset
                allowed, headers = await limiter.check_limit(key, preset=preset)
            elif limit is not None:
                # Parse custom limit and create temporary config
                try:
                    req_limit, window = parse_rate_limit(limit)
                    # For custom limits, use API_DEFAULT preset as base
                    # but override with custom values via check_limit
                    allowed, headers = await limiter.check_limit(
                        key,
                        preset=RateLimitPreset.API_DEFAULT,
                    )
                    # Override headers with custom limit
                    headers["X-RateLimit-Limit"] = str(req_limit)
                except ValueError as e:
                    raise ValueError(
                        f"Invalid rate_limit decorator config: {e}"
                    )
            else:
                # Default to API_DEFAULT preset
                allowed, headers = await limiter.check_limit(
                    key,
                    preset=RateLimitPreset.API_DEFAULT,
                )

            # Check if rate limited
            if not allowed:
                retry_after = headers.get("Retry-After", "60")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": int(retry_after),
                    },
                    headers=headers,
                )

            # Call the actual function
            response = await func(request, *args, **kwargs)

            # Add rate limit headers to response
            if isinstance(response, Response):
                for header_name, header_value in headers.items():
                    response.headers[header_name] = header_value

            return response

        return wrapper
    return decorator


def rate_limit_auth_login(
    bypass_dev: bool = True,
) -> Callable:
    """Shorthand decorator for auth login endpoints.

    Applies RateLimitPreset.AUTH_LOGIN (5 requests/minute).

    Args:
        bypass_dev: If True, bypass in dev mode

    Example:
        >>> @app.post("/auth/login")
        >>> @rate_limit_auth_login()
        >>> async def login(request: Request):
        ...     pass
    """
    return rate_limit(preset=RateLimitPreset.AUTH_LOGIN, bypass_dev=bypass_dev)


def rate_limit_auth_callback(
    bypass_dev: bool = True,
) -> Callable:
    """Shorthand decorator for auth callback endpoints.

    Applies RateLimitPreset.AUTH_CALLBACK (10 requests/minute).

    Args:
        bypass_dev: If True, bypass in dev mode
    """
    return rate_limit(preset=RateLimitPreset.AUTH_CALLBACK, bypass_dev=bypass_dev)


def rate_limit_auth_refresh(
    bypass_dev: bool = True,
) -> Callable:
    """Shorthand decorator for auth refresh endpoints.

    Applies RateLimitPreset.AUTH_REFRESH (30 requests/hour).

    Args:
        bypass_dev: If True, bypass in dev mode
    """
    return rate_limit(preset=RateLimitPreset.AUTH_REFRESH, bypass_dev=bypass_dev)


def rate_limit_api_write(
    limit: str = "20/minute",
    bypass_dev: bool = True,
) -> Callable:
    """Shorthand decorator for API write endpoints (POST/PUT/DELETE).

    Args:
        limit: Custom limit (default: 20/minute)
        bypass_dev: If True, bypass in dev mode
    """
    return rate_limit(limit=limit, bypass_dev=bypass_dev)


def rate_limit_api_read(
    limit: str = "100/minute",
    bypass_dev: bool = True,
) -> Callable:
    """Shorthand decorator for API read endpoints (GET).

    Args:
        limit: Custom limit (default: 100/minute)
        bypass_dev: If True, bypass in dev mode
    """
    return rate_limit(limit=limit, bypass_dev=bypass_dev)


def add_rate_limit_headers(response: Response, headers: dict[str, str]) -> None:
    """Add rate limit headers to response.

    Helper function for middleware to add headers.

    Args:
        response: FastAPI Response object
        headers: Dict of header name to value
    """
    for name, value in headers.items():
        response.headers[name] = value


def create_rate_limit_response(
    message: str = "Rate limit exceeded",
    retry_after: int = 60,
    headers: Optional[dict[str, str]] = None,
) -> Response:
    """Create a 429 Too Many Requests response.

    Args:
        message: Error message
        retry_after: Seconds until retry
        headers: Additional headers

    Returns:
        JSON response with 429 status
    """
    from fastapi.responses import JSONResponse

    response_headers = headers or {}
    response_headers["Retry-After"] = str(retry_after)

    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": message,
            "retry_after": retry_after,
        },
        headers=response_headers,
    )
