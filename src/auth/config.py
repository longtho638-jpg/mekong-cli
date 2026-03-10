"""
Auth Configuration - Environment-aware authentication settings

Handles dev/prod mode detection and configuration loading.
"""

import os
import secrets
from enum import Enum
from typing import Dict, Any
from dataclasses import dataclass


class AuthEnvironment(str, Enum):
    """Authentication environment modes."""

    DEV = "dev"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class OAuthProviderConfig:
    """OAuth provider configuration."""

    client_id: str
    client_secret: str
    redirect_uri: str
    enabled: bool = True


class AuthConfig:
    """Environment-aware authentication configuration."""

    # Environment detection
    ENVIRONMENT = AuthEnvironment(os.getenv("AUTH_ENVIRONMENT", "dev"))
    AUTH_DISABLED = ENVIRONMENT == AuthEnvironment.DEV

    # JWT settings - Use secrets.token_urlsafe for secure random generation
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        # Generate a random secret for dev mode only
        if ENVIRONMENT == AuthEnvironment.DEV:
            JWT_SECRET_KEY = secrets.token_urlsafe(32)
        else:
            # In staging/production, require JWT_SECRET_KEY
            raise ValueError(
                "JWT_SECRET_KEY environment variable is required for staging/production. "
                "Generate a secure random string (min 32 characters) and set it."
            )
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_EXPIRY_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", "30"))
    JWT_REFRESH_EXPIRY_DAYS = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", "7"))

    # Session cookie settings
    SESSION_COOKIE_NAME = "session_token"
    SESSION_COOKIE_SECURE = ENVIRONMENT == AuthEnvironment.PRODUCTION
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "lax" if ENVIRONMENT != AuthEnvironment.PRODUCTION else "none"
    SESSION_MAX_AGE = int(os.getenv("SESSION_MAX_AGE_SECONDS", "604800"))  # 7 days

    # OAuth2 - Google
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8080/auth/google/callback",
    )

    # OAuth2 - GitHub
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8080/auth/github/callback",
    )

    # Stripe (for billing integration)
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_IDS = os.getenv("STRIPE_PRICE_IDS", "{}")  # JSON mapping of price_id: role

    @classmethod
    def _current_environment(cls) -> AuthEnvironment:
        """Get current environment, reading from env at call time."""
        return AuthEnvironment(os.getenv("AUTH_ENVIRONMENT", cls.ENVIRONMENT.value))

    @classmethod
    def is_dev_mode(cls) -> bool:
        """Check if running in development mode."""
        return cls._current_environment() == AuthEnvironment.DEV

    @classmethod
    def is_staging_mode(cls) -> bool:
        """Check if running in staging mode."""
        return cls._current_environment() == AuthEnvironment.STAGING

    @classmethod
    def is_production_mode(cls) -> bool:
        """Check if running in production mode."""
        return cls._current_environment() == AuthEnvironment.PRODUCTION

    @classmethod
    def require_auth(cls) -> bool:
        """Check if authentication is required.

        Returns:
            True if auth should be enforced (prod/staging),
            False if auth can be bypassed (dev)
        """
        return not cls.is_dev_mode()

    @classmethod
    def auth_enabled(cls) -> bool:
        """Alias for require_auth()."""
        return cls.require_auth()

    @classmethod
    def is_production(cls) -> bool:
        """Check if environment is production.

        Returns:
            True if AUTH_ENVIRONMENT=production
        """
        return cls.is_production_mode()

    @classmethod
    def get_oauth_config(cls) -> Dict[str, OAuthProviderConfig]:
        """Get OAuth provider configurations.

        Returns:
            Dict mapping provider name to OAuthProviderConfig
        """
        return {
            "google": OAuthProviderConfig(
                client_id=cls.GOOGLE_CLIENT_ID,
                client_secret=cls.GOOGLE_CLIENT_SECRET,
                redirect_uri=cls.GOOGLE_REDIRECT_URI,
                enabled=bool(cls.GOOGLE_CLIENT_ID and cls.GOOGLE_CLIENT_SECRET),
            ),
            "github": OAuthProviderConfig(
                client_id=cls.GITHUB_CLIENT_ID,
                client_secret=cls.GITHUB_CLIENT_SECRET,
                redirect_uri=cls.GITHUB_REDIRECT_URI,
                enabled=bool(cls.GITHUB_CLIENT_ID and cls.GITHUB_CLIENT_SECRET),
            ),
        }

    @classmethod
    def validate_production_config(cls) -> tuple[bool, list[str]]:
        """Validate that required secrets are set for production.

        Returns:
            Tuple of (is_valid, list of missing config warnings)
        """
        warnings = []

        if cls.is_production_mode():
            # Check JWT secret - in production, it should NOT be a dev-generated value
            # We check if it looks like a secure random string (min 32 chars)
            if not cls.JWT_SECRET_KEY or len(cls.JWT_SECRET_KEY) < 32:
                warnings.append(
                    "JWT_SECRET_KEY is not set or too short (< 32 characters). "
                    "Use a secure random string for production."
                )

            # Check OAuth secrets
            if not cls.GOOGLE_CLIENT_ID or not cls.GOOGLE_CLIENT_SECRET:
                warnings.append("Google OAuth credentials not configured")

            if not cls.GITHUB_CLIENT_ID or not cls.GITHUB_CLIENT_SECRET:
                warnings.append("GitHub OAuth credentials not configured")

            # Check Stripe (optional but recommended)
            if not cls.STRIPE_SECRET_KEY:
                warnings.append("STRIPE_SECRET_KEY not configured")

        return len(warnings) == 0, warnings

    @classmethod
    def get_config_summary(cls) -> Dict[str, Any]:
        """Get human-readable config summary.

        Returns:
            Dict with current configuration status
        """
        is_valid, warnings = cls.validate_production_config()

        oauth_config = cls.get_oauth_config()

        return {
            "environment": cls.ENVIRONMENT.value,
            "auth_enabled": cls.require_auth(),
            "is_production": cls.is_production_mode(),
            "cookie_secure": cls.SESSION_COOKIE_SECURE,
            "oauth_providers": {
                name: {
                    "enabled": config.enabled,
                    "configured": bool(config.client_id and config.client_secret),
                }
                for name, config in oauth_config.items()
            },
            "config_valid": is_valid,
            "warnings": warnings,
        }


# Environment variable names for documentation
ENV_VARS = {
    "AUTH_ENVIRONMENT": "dev|staging|production",
    "JWT_SECRET_KEY": "JWT signing secret (required for production, min 32 characters)",
    "JWT_ACCESS_EXPIRY_MINUTES": "Access token expiry (default: 30)",
    "JWT_REFRESH_EXPIRY_DAYS": "Refresh token expiry (default: 7)",
    "SESSION_MAX_AGE_SECONDS": "Session cookie max age (default: 604800)",
    "GOOGLE_CLIENT_ID": "Google OAuth client ID",
    "GOOGLE_CLIENT_SECRET": "Google OAuth client secret",
    "GOOGLE_REDIRECT_URI": "Google OAuth redirect URI",
    "GITHUB_CLIENT_ID": "GitHub OAuth client ID",
    "GITHUB_CLIENT_SECRET": "GitHub OAuth client secret",
    "GITHUB_REDIRECT_URI": "GitHub OAuth redirect URI",
    "STRIPE_SECRET_KEY": "Stripe API secret key",
    "STRIPE_WEBHOOK_SECRET": "Stripe webhook signing secret",
    "STRIPE_PRICE_IDS": "JSON mapping of Stripe Price ID to role (owner/admin/member/viewer)",
}


def get_env_template() -> str:
    """Generate .env file template.

    Returns:
        String with .env template content
    """
    lines = [
        "# ====================================",
        "# Authentication Configuration",
        "# ====================================",
        "",
        "# Environment (dev|staging|production)",
        "AUTH_ENVIRONMENT=dev",
        "",
        "# JWT Settings",
        "# IMPORTANT: Set a secure random secret for production (min 32 characters)",
        "# Generate with: python3 -c 'import secrets; print(secrets.token_urlsafe(32))'",
        "JWT_SECRET_KEY=",
        "JWT_ACCESS_EXPIRY_MINUTES=30",
        "JWT_REFRESH_EXPIRY_DAYS=7",
        "SESSION_MAX_AGE_SECONDS=604800",
        "",
        "# Google OAuth2",
        "GOOGLE_CLIENT_ID=",
        "GOOGLE_CLIENT_SECRET=",
        "GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback",
        "",
        "# GitHub OAuth2",
        "GITHUB_CLIENT_ID=",
        "GITHUB_CLIENT_SECRET=",
        "GITHUB_REDIRECT_URI=http://localhost:8080/auth/github/callback",
        "",
        "# Stripe (for billing)",
        "STRIPE_SECRET_KEY=",
        "STRIPE_WEBHOOK_SECRET=",
        "STRIPE_PRICE_IDS={\"price_enterprise\": \"owner\", \"price_pro\": \"admin\", \"price_trial\": \"member\", \"price_free\": \"viewer\"}",
        "",
    ]
    return "\n".join(lines)
