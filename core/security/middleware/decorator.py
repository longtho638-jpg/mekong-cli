"""
Auth decorator for FastAPI endpoints.
"""
from functools import wraps
from typing import List, Optional

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .api_key_handler import validate_api_key
from .jwt_handler import AuthenticationError, decode_jwt_token
from .rate_limit import check_rate_limit

security = HTTPBearer()

def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"

def require_auth(
    permissions: List[str] = None, allow_api_key: bool = True, rate_limit: bool = True
):
    """Decorator for requiring authentication on API endpoints."""
    def decorator(func):
        @wraps(func)
        async def wrapper(
            request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None, **kwargs
        ):
            if rate_limit:
                client_ip = get_client_ip(request)
                if not check_rate_limit(client_ip, request.url.path):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded"
                    )

            user_info = None
            if credentials:
                try:
                    token = credentials.credentials
                    user_info = decode_jwt_token(token)
                    if permissions:
                        user_permissions = user_info.get("permissions", [])
                        if not any(perm in user_permissions for perm in permissions):
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Insufficient permissions",
                            )
                except AuthenticationError as e:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=str(e),
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            elif allow_api_key:
                api_key = request.headers.get("X-API-Key")
                if not api_key or not validate_api_key(api_key):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Valid API key required",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                user_info = {"auth_type": "api_key", "api_key": api_key}
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            request.state.user = user_info
            return await func(request, **kwargs)
        return wrapper
    return decorator
