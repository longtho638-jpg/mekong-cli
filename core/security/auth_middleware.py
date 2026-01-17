"""
🔐 API Authentication Middleware
=================================
Centralized authentication and authorization for API endpoints.

Features:
- JWT token validation
- API key authentication  
- Rate limiting
- CORS protection
- Security headers
"""

import os
import time
import secrets
from typing import Optional, Dict, List, Any
from functools import wraps
from datetime import datetime, timedelta

import jwt
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Security configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    # Generate a secure key if not provided
    JWT_SECRET_KEY = secrets.token_urlsafe(32)
    os.environ["JWT_SECRET_KEY"] = JWT_SECRET_KEY

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Rate limiting configuration
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

# In-memory rate limiting store (production should use Redis)
rate_limit_store: Dict[str, Dict[str, Any]] = {}

security = HTTPBearer()


class AuthenticationError(Exception):
    """Custom authentication error."""
    pass


class RateLimitError(Exception):
    """Custom rate limit error."""
    pass


def generate_jwt_token(user_id: str, permissions: List[str] = None) -> str:
    """Generate a JWT access token."""
    payload = {
        "user_id": user_id,
        "permissions": permissions or [],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")


def validate_api_key(api_key: str) -> bool:
    """Validate API key against environment variables."""
    valid_keys = [
        os.getenv("API_KEY_MASTER"),
        os.getenv("API_KEY_READ_ONLY"),
        os.getenv("API_KEY_WRITE_ACCESS")
    ]
    return api_key in valid_keys and api_key is not None


def check_rate_limit(client_ip: str, endpoint: str = None) -> bool:
    """Check if client has exceeded rate limit."""
    current_time = int(time.time())
    key = f"{client_ip}:{endpoint or 'global'}"
    
    if key not in rate_limit_store:
        rate_limit_store[key] = {
            "requests": [],
            "count": 0
        }
    
    # Clean old requests outside the window
    rate_limit_store[key]["requests"] = [
        req_time for req_time in rate_limit_store[key]["requests"]
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if limit exceeded
    if len(rate_limit_store[key]["requests"]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Add current request
    rate_limit_store[key]["requests"].append(current_time)
    return True


def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers."""
    # Check for forwarded IP first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"


def require_auth(
    permissions: List[str] = None,
    allow_api_key: bool = True,
    rate_limit: bool = True
):
    """
    Decorator for requiring authentication on API endpoints.
    
    Args:
        permissions: List of required permissions
        allow_api_key: Whether to allow API key authentication
        rate_limit: Whether to apply rate limiting
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None, **kwargs):
            # Rate limiting check
            if rate_limit:
                client_ip = get_client_ip(request)
                if not check_rate_limit(client_ip, request.url.path):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded"
                    )
            
            # Authentication check
            user_info = None
            
            if credentials:
                try:
                    # JWT token authentication
                    token = credentials.credentials
                    user_info = decode_jwt_token(token)
                    
                    # Check permissions if required
                    if permissions:
                        user_permissions = user_info.get("permissions", [])
                        if not any(perm in user_permissions for perm in permissions):
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Insufficient permissions"
                            )
                
                except AuthenticationError as e:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=str(e),
                        headers={"WWW-Authenticate": "Bearer"}
                    )
            
            elif allow_api_key:
                # API key authentication
                api_key = request.headers.get("X-API-Key")
                if not api_key or not validate_api_key(api_key):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Valid API key required",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                user_info = {"auth_type": "api_key", "api_key": api_key}
            
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Add user info to request state
            request.state.user = user_info
            
            # Call the original function
            return await func(request, **kwargs)
        
        return wrapper
    return decorator


# Security headers middleware
def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response


# CORS configuration
def get_cors_config() -> Dict[str, Any]:
    """Get CORS configuration from environment."""
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
    allowed_methods = os.getenv("ALLOWED_METHODS", "GET,POST,PUT,DELETE,OPTIONS")
    allowed_headers = os.getenv("ALLOWED_HEADERS", "Authorization,Content-Type,X-API-Key")
    
    return {
        "allow_origins": [origin.strip() for origin in allowed_origins.split(",")],
        "allow_credentials": True,
        "allow_methods": [method.strip() for method in allowed_methods.split(",")],
        "allow_headers": [header.strip() for header in allowed_headers.split(",")],
        "expose_headers": ["X-RateLimit-Limit", "X-RateLimit-Remaining"]
    }


def get_rate_limit_headers(client_ip: str, endpoint: str = None) -> Dict[str, str]:
    """Get rate limit headers for response."""
    key = f"{client_ip}:{endpoint or 'global'}"
    
    if key not in rate_limit_store:
        return {
            "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
            "X-RateLimit-Remaining": str(RATE_LIMIT_REQUESTS)
        }
    
    current_count = len(rate_limit_store[key]["requests"])
    remaining = max(0, RATE_LIMIT_REQUESTS - current_count)
    
    return {
        "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
        "X-RateLimit-Remaining": str(remaining)
    }


# Environment validation
def validate_security_environment() -> List[str]:
    """Validate required security environment variables."""
    warnings = []
    
    if not os.getenv("JWT_SECRET_KEY"):
        warnings.append("JWT_SECRET_KEY not set (using auto-generated key)")
    
    if not os.getenv("API_KEY_MASTER"):
        warnings.append("API_KEY_MASTER not set")
    
    if not os.getenv("ALLOWED_ORIGINS"):
        warnings.append("ALLOWED_ORIGINS not set (using localhost defaults)")
    
    return warnings


if __name__ == "__main__":
    # Test authentication system
    print("🔐 Testing Authentication System")
    print("=" * 50)
    
    # Validate environment
    warnings = validate_security_environment()
    if warnings:
        print("⚠️  Security Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    # Test JWT generation and validation
    try:
        token = generate_jwt_token("test_user", ["read", "write"])
        print(f"✅ JWT Token Generated: {token[:50]}...")
        
        payload = decode_jwt_token(token)
        print(f"✅ JWT Token Validated: user={payload.get('user_id')}")
        
    except Exception as e:
        print(f"❌ JWT Test Failed: {e}")
    
    print("\n🔑 Security Environment Variables:")
    security_vars = [
        "JWT_SECRET_KEY",
        "API_KEY_MASTER", 
        "API_KEY_READ_ONLY",
        "API_KEY_WRITE_ACCESS",
        "ALLOWED_ORIGINS",
        "RATE_LIMIT_REQUESTS",
        "RATE_LIMIT_WINDOW"
    ]
    
    for var in security_vars:
        value = os.getenv(var)
        if value:
            masked = value[:4] + "*" * (len(value) - 4) if len(value) > 4 else "****"
            print(f"   {var}: {masked}")
        else:
            print(f"   {var}: ❌ Not set")