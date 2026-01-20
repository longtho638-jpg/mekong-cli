"""
🔐 API Authentication Middleware (Proxy)
=================================
This file is now a proxy for the modularized version in ./middleware/
Please import from core.security.middleware instead.
"""
import warnings

from .middleware import (
    AuthenticationError,
    add_security_headers,
    check_rate_limit,
    decode_jwt_token,
    generate_jwt_token,
    get_cors_config,
    get_rate_limit_headers,
    require_auth,
    security,
    validate_api_key,
    validate_security_environment,
)

# Issue a deprecation warning
warnings.warn(
    "core.security.auth_middleware is deprecated. "
    "Use core.security.middleware instead.",
    DeprecationWarning,
    stacklevel=2
)
