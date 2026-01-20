"""
API Authentication Middleware Facade.
"""
import os
from typing import List

from .api_key_handler import validate_api_key
from .decorator import require_auth, security
from .headers import add_security_headers, get_cors_config
from .jwt_handler import AuthenticationError, decode_jwt_token, generate_jwt_token
from .rate_limit import check_rate_limit, get_rate_limit_headers


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

__all__ = [
    'generate_jwt_token',
    'decode_jwt_token',
    'AuthenticationError',
    'validate_api_key',
    'check_rate_limit',
    'get_rate_limit_headers',
    'add_security_headers',
    'get_cors_config',
    'require_auth',
    'security',
    'validate_security_environment'
]
