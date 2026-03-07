"""
Authentication Module Initialization

OAuth2 authentication with Google and GitHub providers,
JWT session management, and RBAC access control.
Includes rate limiting for auth endpoints.
"""

from src.auth.oauth2_providers import (
    OAuth2Client,
    get_google_oauth_url,
    get_github_oauth_url,
    handle_google_callback,
    handle_github_callback,
    get_user_info,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    REDIRECT_URI,
)

from src.auth.session_manager import (
    SessionManager,
    create_session,
    validate_token,
    revoke_session,
    get_token_from_request,
)

from src.auth.rbac import (
    Role,
    Permission,
    ROLE_PERMISSIONS,
    require_role,
    require_permission,
    get_current_user,
    check_access,
    RBACMiddleware,
)

from src.auth.config import (
    AuthConfig,
    AuthEnvironment,
    get_env_template,
)

from src.auth.middleware import (
    SessionMiddleware,
    OptionalAuthMiddleware,
    create_auth_middleware,
)

from src.auth.rate_limiter import (
    RateLimiter,
    RateLimitPreset,
    RateLimitConfig,
    RateLimitExceeded,
    TokenBucket,
    InMemoryRateStorage,
    get_rate_limiter,
    init_rate_limiter,
    DEFAULT_RATE_LIMITS,
)

from src.auth.rate_limit_decorator import (
    rate_limit,
    rate_limit_auth_login,
    rate_limit_auth_callback,
    rate_limit_auth_refresh,
    rate_limit_api_write,
    rate_limit_api_read,
    get_client_ip,
    parse_rate_limit,
    add_rate_limit_headers,
    create_rate_limit_response,
)

__all__ = [
    # OAuth2
    "OAuth2Client",
    "get_google_oauth_url",
    "get_github_oauth_url",
    "handle_google_callback",
    "handle_github_callback",
    "get_user_info",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "REDIRECT_URI",
    # Session Management
    "SessionManager",
    "create_session",
    "validate_token",
    "revoke_session",
    "get_token_from_request",
    # RBAC
    "Role",
    "Permission",
    "ROLE_PERMISSIONS",
    "require_role",
    "require_permission",
    "get_current_user",
    "check_access",
    "RBACMiddleware",
    # Config
    "AuthConfig",
    "AuthEnvironment",
    "get_env_template",
    # Middleware
    "SessionMiddleware",
    "OptionalAuthMiddleware",
    "create_auth_middleware",
    # Rate Limiting
    "RateLimiter",
    "RateLimitPreset",
    "RateLimitConfig",
    "RateLimitExceeded",
    "TokenBucket",
    "InMemoryRateStorage",
    "get_rate_limiter",
    "init_rate_limiter",
    "DEFAULT_RATE_LIMITS",
    # Rate Limit Decorators
    "rate_limit",
    "rate_limit_auth_login",
    "rate_limit_auth_callback",
    "rate_limit_auth_refresh",
    "rate_limit_api_write",
    "rate_limit_api_read",
    "get_client_ip",
    "parse_rate_limit",
    "add_rate_limit_headers",
    "create_rate_limit_response",
]
