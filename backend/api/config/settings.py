"""
Centralized Configuration with Pydantic Settings
=================================================

All configuration values extracted from hardcoded locations.
Environment-aware with validation and type safety.

Binh Pháp: "Dùng Cầu" - Bridge Configuration
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from .constants import (
    CACHE_TTL_FAST,
    CACHE_TTL_MEDIUM,
    CACHE_TTL_SLOW,
    DEFAULT_BACKEND_URL,
    DEFAULT_DEV_CORS_ORIGINS,
    DEFAULT_FRONTEND_URL,
    DEFAULT_MAX_JSON_DEPTH,
    DEFAULT_MAX_REQUEST_SIZE,
    DEFAULT_MAX_STRING_LENGTH,
    DEFAULT_METRICS_BUCKETS,
    DEFAULT_WEBHOOK_PORTAL_URL,
    FAST_RESPONSE_THRESHOLD,
    SLOW_REQUEST_THRESHOLD,
)
from .rate_limits import RATE_LIMITS_BY_PLAN


class Settings(BaseSettings):
    """
    Centralized configuration with validation.

    All hardcoded values from across the API layer are now here.
    Uses Pydantic Settings for environment variable loading and validation.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore unknown env vars
    )

    # ========================================
    # Application Metadata
    # ========================================
    project_name: str = Field(default="Agency OS", description="Project name")
    api_version: str = Field(default="0.2.0", description="API version")
    api_v1_str: str = Field(default="/api", description="API v1 prefix")
    environment: str = Field(default="development", description="Environment: development/staging/production")
    debug: bool = Field(default=False, description="Debug mode")

    # ========================================
    # Security - CRITICAL: No defaults for secrets in production
    # ========================================
    secret_key: str = Field(
        default="dev-secret-key-CHANGE-IN-PRODUCTION",  # Dev fallback only
        description="Secret key for JWT signing (REQUIRED in production)"
    )
    access_token_expire_minutes: int = Field(default=15, description="JWT access token expiration (15 minutes)")
    refresh_token_expire_minutes: int = Field(default=60 * 24 * 7, description="JWT refresh token expiration (7 days)")
    jwt_algorithm: str = Field(default="HS256", description="JWT Algorithm")

    # Optional webhook secrets
    gumroad_webhook_secret: str = Field(default="", description="Gumroad webhook secret")

    # ========================================
    # CORS Configuration
    # ========================================
    allowed_origins: List[str] = Field(
        default_factory=lambda: DEFAULT_DEV_CORS_ORIGINS,
        description="CORS allowed origins"
    )
    allowed_hosts: List[str] = Field(default_factory=lambda: ["*"], description="Allowed hosts")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from env or use defaults based on environment."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ========================================
    # Email Configuration
    # ========================================
    email_provider: str = Field(default="smtp", description="Email provider (smtp/resend/sendgrid)")
    resend_api_key: str = Field(default="", description="Resend API Key")
    sendgrid_api_key: str = Field(default="", description="SendGrid API Key")
    default_from_email: str = Field(default="noreply@binhphap.com", description="Default sender email")
    default_from_name: str = Field(default="AgencyOS", description="Default sender name")

    # SMTP Settings (Keep existing)
    smtp_host: str = Field(default="smtp.gmail.com", description="SMTP Host")
    smtp_port: int = Field(default=587, description="SMTP Port")
    smtp_user: str = Field(default="", description="SMTP User")
    smtp_password: str = Field(default="", description="SMTP Password")
    email_mock_mode: bool = Field(default=False, description="Mock email sending")

    # ========================================
    # Notification Configuration
    # ========================================
    vapid_private_key: str = Field(default="", description="VAPID Private Key for WebPush")
    vapid_public_key: str = Field(default="", description="VAPID Public Key for WebPush")
    vapid_claims_email: str = Field(default="mailto:admin@agencyos.network", description="VAPID Claims Email")
    fcm_credentials_path: Optional[str] = Field(default=None, description="Path to FCM service account JSON")

    # ========================================
    # Database Configuration
    # ========================================
    database_url: str = Field(
        default="sqlite:///./agencyos.db",
        description="Database connection URL"
    )
    db_pool_size: int = Field(default=5, description="DB connection pool size")
    db_max_overflow: int = Field(default=10, description="DB connection max overflow")
    db_pool_recycle: int = Field(default=3600, description="DB connection pool recycle (seconds)")

    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    tenant_db_path: str = Field(
        default="./data/tenants",
        description="Path for tenant databases"
    )

    # ========================================
    # Cache & Timeout Configuration
    # ========================================
    cache_ttl_fast: int = Field(default=CACHE_TTL_FAST, description="Fast cache TTL")
    cache_ttl_medium: int = Field(default=CACHE_TTL_MEDIUM, description="Medium cache TTL")
    cache_ttl_slow: int = Field(default=CACHE_TTL_SLOW, description="Slow cache TTL")
    request_timeout: int = Field(default=30, description="Request timeout (seconds)")

    # ========================================
    # Metrics Configuration
    # ========================================
    slow_request_threshold: float = Field(default=SLOW_REQUEST_THRESHOLD, description="Slow request threshold")
    fast_response_threshold: float = Field(default=FAST_RESPONSE_THRESHOLD, description="Fast response threshold")
    metrics_buckets: List[float] = Field(
        default_factory=lambda: DEFAULT_METRICS_BUCKETS,
        description="Prometheus histogram buckets"
    )

    # ========================================
    # Webhook & Portal URLs
    # ========================================
    webhook_portal_url: str = Field(default=DEFAULT_WEBHOOK_PORTAL_URL, description="Webhook redirect portal URL")

    # ========================================
    # Backend & API URLs
    # ========================================
    backend_url: str = Field(default=DEFAULT_BACKEND_URL, description="Backend API base URL")
    frontend_url: str = Field(default=DEFAULT_FRONTEND_URL, description="Frontend application URL")

    # ========================================
    # Tenant Configuration (extracted from multitenant.py)
    # ========================================
    default_tenant: str = Field(default="default", description="Default tenant ID")
    tenant_header_name: str = Field(default="X-Tenant-ID", description="HTTP header for tenant ID")

    # ========================================
    # Feature Flags
    # ========================================
    enable_metrics: bool = Field(default=True, description="Enable Prometheus metrics")
    enable_rate_limiting: bool = Field(default=True, description="Enable rate limiting")
    enable_multitenant: bool = Field(default=True, description="Enable multi-tenancy")
    enable_validation: bool = Field(default=True, description="Enable input validation")

    # ========================================
    # Rate Limiting Configuration
    # ========================================
    rate_limit_bypass_key: Optional[str] = Field(default=None, description="Key to bypass rate limits")
    rate_limit_whitelist_ips: List[str] = Field(default_factory=list, description="Whitelisted IPs for rate limiting")

    # ========================================
    # Input Validation Limits
    # ========================================
    max_json_depth: int = Field(default=DEFAULT_MAX_JSON_DEPTH, description="Maximum JSON nesting depth")
    max_request_size: int = Field(default=DEFAULT_MAX_REQUEST_SIZE, description="Max request size in bytes")
    max_string_length: int = Field(default=DEFAULT_MAX_STRING_LENGTH, description="Max string field length")

    # ========================================
    # Audit & Compliance
    # ========================================
    audit_retention_days: int = Field(default=365, description="Days to retain audit logs in hot storage")
    splunk_hec_url: Optional[str] = Field(default=None, description="Splunk HEC Endpoint")
    splunk_token: Optional[str] = Field(default=None, description="Splunk HEC Token")
    datadog_api_key: Optional[str] = Field(default=None, description="Datadog API Key")

    # ========================================
    # AWS / Storage Configuration
    # ========================================
    aws_access_key_id: Optional[str] = Field(default=None, description="AWS Access Key ID")
    aws_secret_access_key: Optional[str] = Field(default=None, description="AWS Secret Access Key")
    aws_region: str = Field(default="us-east-1", description="AWS Region")
    s3_bucket_name: str = Field(default="agencyos-exports", description="S3 Bucket for exports")

    # ========================================
    # Computed Properties
    # ========================================
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == "development"

    @property
    def rate_limits_by_plan(self) -> Dict[str, Dict[str, str]]:
        """
        Get rate limits organized by plan.
        Uses external configuration from rate_limits.py
        """
        return RATE_LIMITS_BY_PLAN


# ========================================
# Singleton Instance
# ========================================
settings = Settings()
