"""
Command Authorizer — Per-Command Authorization & Usage Metering

Phase 6: CLI Command Authorization & Usage Enforcement

Features:
- Validate RAAS_LICENSE_KEY on every command invocation
- Per-command usage metering via JWT/mk_ API key auth
- Block execution if license invalid/expired/over quota
- Command tier mapping (FREE/PRO/ENTERPRISE)
- Offline grace period with KV-backed state

Usage:
    from src.core.command_authorizer import CommandAuthorizer

    authorizer = CommandAuthorizer()
    result = authorizer.authorize_command("cook")
    if result.allowed:
        execute_command()
    else:
        print(f"Blocked: {result.reason}")
"""

from __future__ import annotations

import os
import time
import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional, Dict, Any

from src.core.gateway_client import GatewayClient, get_gateway_client
from src.core.raas_auth import get_auth_client
from src.core.license_manager import get_license_manager
from src.core.kv_store_client import get_kv_client

logger = logging.getLogger(__name__)


class CommandTier(str, Enum):
    """Command tier levels."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class AuthorizationReason(str, Enum):
    """Reasons for authorization decisions."""
    FREE_COMMAND = "free_command"
    LICENSE_VALID = "license_valid"
    GRACE_PERIOD = "grace_period"
    OFFLINE_MODE = "offline_mode"
    INVALID_LICENSE = "invalid_license"
    EXPIRED_LICENSE = "expired_license"
    QUOTA_EXCEEDED = "quota_exceeded"
    NETWORK_ERROR = "network_error"
    INSUFFICIENT_TIER = "insufficient_tier"


@dataclass
class AuthorizationResult:
    """Result of command authorization check."""
    allowed: bool
    reason: AuthorizationReason
    message: Optional[str] = None
    tenant_id: Optional[str] = None
    tier: Optional[str] = None
    rate_limit_remaining: Optional[int] = None
    rate_limit_reset_in: Optional[int] = None
    grace_period_remaining_hours: Optional[int] = None
    is_cached: bool = False  # True if using cached validation


@dataclass
class CommandConfig:
    """Configuration for a command."""
    tier: CommandTier
    requires_license: bool = True
    rate_limit_weight: int = 1  # Rate limit cost
    timeout_seconds: int = 30


# Command tier mapping
COMMAND_TIER_MAP: Dict[str, CommandConfig] = {
    # FREE commands - no license required
    "cook": CommandConfig(CommandTier.FREE, requires_license=False),
    "plan": CommandConfig(CommandTier.FREE, requires_license=False),
    "status": CommandConfig(CommandTier.FREE, requires_license=False),
    "config": CommandConfig(CommandTier.FREE, requires_license=False),
    "doctor": CommandConfig(CommandTier.FREE, requires_license=False),
    "clean": CommandConfig(CommandTier.FREE, requires_license=False),
    "test": CommandConfig(CommandTier.FREE, requires_license=False),
    "help": CommandConfig(CommandTier.FREE, requires_license=False),
    "version": CommandConfig(CommandTier.FREE, requires_license=False),
    "license": CommandConfig(CommandTier.FREE, requires_license=False),
    "license-activation": CommandConfig(CommandTier.FREE, requires_license=False),
    "activate": CommandConfig(CommandTier.FREE, requires_license=False),
    "deactivate": CommandConfig(CommandTier.FREE, requires_license=False),
    "validate-license": CommandConfig(CommandTier.FREE, requires_license=False),
    "license-status": CommandConfig(CommandTier.FREE, requires_license=False),
    "raas-auth": CommandConfig(CommandTier.FREE, requires_license=False),
    "auth": CommandConfig(CommandTier.FREE, requires_license=False),
    "diagnostic": CommandConfig(CommandTier.FREE, requires_license=False),
    "usage": CommandConfig(CommandTier.FREE, requires_license=False),
    "telemetry": CommandConfig(CommandTier.FREE, requires_license=False),
    "compliance": CommandConfig(CommandTier.FREE, requires_license=False),
    "security-cmd": CommandConfig(CommandTier.FREE, requires_license=False),
    "update": CommandConfig(CommandTier.FREE, requires_license=False),
    "init": CommandConfig(CommandTier.FREE, requires_license=False),
    "list": CommandConfig(CommandTier.FREE, requires_license=False),
    "search": CommandConfig(CommandTier.FREE, requires_license=False),
    "dash": CommandConfig(CommandTier.FREE, requires_license=False),
    "analytics": CommandConfig(CommandTier.FREE, requires_license=False),
    "dashboard": CommandConfig(CommandTier.FREE, requires_license=False),
    "roi": CommandConfig(CommandTier.FREE, requires_license=False),
    "billing": CommandConfig(CommandTier.FREE, requires_license=False),
    "sync": CommandConfig(CommandTier.FREE, requires_license=False),
    "sync-raas": CommandConfig(CommandTier.FREE, requires_license=False),
    "check-phases": CommandConfig(CommandTier.FREE, requires_license=False),
    "complete-phase6": CommandConfig(CommandTier.FREE, requires_license=False),
    "raas-debug-export": CommandConfig(CommandTier.FREE, requires_license=False),
    "health": CommandConfig(CommandTier.FREE, requires_license=False),

    # PRO commands - require valid license
    "binh-phap": CommandConfig(CommandTier.PRO, requires_license=True),
    "agi": CommandConfig(CommandTier.PRO, requires_license=True),
    "deploy": CommandConfig(CommandTier.PRO, requires_license=True),
    "monitor": CommandConfig(CommandTier.PRO, requires_license=True),
    "build": CommandConfig(CommandTier.PRO, requires_license=True),
    "lint": CommandConfig(CommandTier.PRO, requires_license=True),
    "docs": CommandConfig(CommandTier.PRO, requires_license=True),
    "ci": CommandConfig(CommandTier.PRO, requires_license=True),
    "env": CommandConfig(CommandTier.PRO, requires_license=True),
    "test-advanced": CommandConfig(CommandTier.PRO, requires_license=True),
    "renewal": CommandConfig(CommandTier.PRO, requires_license=True),

    # ClaudeKit skill commands (PRO)
    "popup-cro": CommandConfig(CommandTier.PRO, requires_license=True),
    "trading:ceo": CommandConfig(CommandTier.PRO, requires_license=True),
    "competitor": CommandConfig(CommandTier.PRO, requires_license=True),
    "context-wi": CommandConfig(CommandTier.PRO, requires_license=True),
    "copy-editing": CommandConfig(CommandTier.PRO, requires_license=True),
    "scout": CommandConfig(CommandTier.PRO, requires_license=True),
    "review": CommandConfig(CommandTier.PRO, requires_license=True),
    "fix": CommandConfig(CommandTier.PRO, requires_license=True),
    "debug": CommandConfig(CommandTier.PRO, requires_license=True),
    "kanban": CommandConfig(CommandTier.PRO, requires_license=True),
    "journal": CommandConfig(CommandTier.PRO, requires_license=True),
    "worktree": CommandConfig(CommandTier.PRO, requires_license=True),
    "skill": CommandConfig(CommandTier.PRO, requires_license=True),
    "ask": CommandConfig(CommandTier.PRO, requires_license=True),
    "brainstorm": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-ads": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-copy": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-cro": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-growth": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-local": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-seo": CommandConfig(CommandTier.PRO, requires_license=True),
    "preview": CommandConfig(CommandTier.PRO, requires_license=True),
    "save": CommandConfig(CommandTier.PRO, requires_license=True),
    "remember": CommandConfig(CommandTier.PRO, requires_license=True),
    "vercel-debug": CommandConfig(CommandTier.PRO, requires_license=True),
    "analytics-report": CommandConfig(CommandTier.PRO, requires_license=True),
    "data-validation": CommandConfig(CommandTier.PRO, requires_license=True),
    "qa-testing": CommandConfig(CommandTier.PRO, requires_license=True),
    "feature-store": CommandConfig(CommandTier.PRO, requires_license=True),
    "image-optimize": CommandConfig(CommandTier.PRO, requires_license=True),
    "operations": CommandConfig(CommandTier.PRO, requires_license=True),
    "release-notes": CommandConfig(CommandTier.PRO, requires_license=True),
    "uptime-check": CommandConfig(CommandTier.PRO, requires_license=True),
    "logs": CommandConfig(CommandTier.PRO, requires_license=True),
    "pr": CommandConfig(CommandTier.PRO, requires_license=True),
    "admin": CommandConfig(CommandTier.PRO, requires_license=True),
    "customer-service": CommandConfig(CommandTier.PRO, requires_license=True),
    "webhook-test": CommandConfig(CommandTier.PRO, requires_license=True),
    "secret-detect": CommandConfig(CommandTier.PRO, requires_license=True),
    "cofounder": CommandConfig(CommandTier.PRO, requires_license=True),
    "sitemap-gen": CommandConfig(CommandTier.PRO, requires_license=True),
    "ssl-check": CommandConfig(CommandTier.PRO, requires_license=True),
    "changelog-gen": CommandConfig(CommandTier.PRO, requires_license=True),
    "landing-page": CommandConfig(CommandTier.PRO, requires_license=True),
    "pitch-deck": CommandConfig(CommandTier.PRO, requires_license=True),
    "test-e2e": CommandConfig(CommandTier.PRO, requires_license=True),
    "a11y-audit": CommandConfig(CommandTier.PRO, requires_license=True),
    "conversion-tracking": CommandConfig(CommandTier.PRO, requires_license=True),
    "mvp-validate": CommandConfig(CommandTier.PRO, requires_license=True),
    "okr": CommandConfig(CommandTier.PRO, requires_license=True),
    "canary": CommandConfig(CommandTier.PRO, requires_license=True),
    "blue-green": CommandConfig(CommandTier.PRO, requires_license=True),
    "naming": CommandConfig(CommandTier.PRO, requires_license=True),
    "launch-promote": CommandConfig(CommandTier.PRO, requires_license=True),
    "personal-development": CommandConfig(CommandTier.PRO, requires_license=True),
    "insurance": CommandConfig(CommandTier.PRO, requires_license=True),
    "subscription": CommandConfig(CommandTier.PRO, requires_license=True),
    "legal": CommandConfig(CommandTier.PRO, requires_license=True),
    "nonprofit": CommandConfig(CommandTier.PRO, requires_license=True),
    "db-migrate": CommandConfig(CommandTier.PRO, requires_license=True),
    "startup-credits": CommandConfig(CommandTier.PRO, requires_license=True),
    "test-performance": CommandConfig(CommandTier.PRO, requires_license=True),
    "config-lint": CommandConfig(CommandTier.PRO, requires_license=True),
    "model-registry": CommandConfig(CommandTier.PRO, requires_license=True),
    "ml-pipeline": CommandConfig(CommandTier.PRO, requires_license=True),
    "media": CommandConfig(CommandTier.PRO, requires_license=True),
    "customer-success": CommandConfig(CommandTier.PRO, requires_license=True),
    "dns-propagate": CommandConfig(CommandTier.PRO, requires_license=True),
    "status-page": CommandConfig(CommandTier.PRO, requires_license=True),
    "bundle-analyze": CommandConfig(CommandTier.PRO, requires_license=True),
    "inference-api": CommandConfig(CommandTier.PRO, requires_license=True),
    "seo-audit": CommandConfig(CommandTier.PRO, requires_license=True),
    "version-bump": CommandConfig(CommandTier.PRO, requires_license=True),
    "model-deploy": CommandConfig(CommandTier.PRO, requires_license=True),
    "rollback": CommandConfig(CommandTier.PRO, requires_license=True),
    "hyperparam-tune": CommandConfig(CommandTier.PRO, requires_license=True),
    "education": CommandConfig(CommandTier.PRO, requires_license=True),
    "customer-discovery": CommandConfig(CommandTier.PRO, requires_license=True),
    "trading": CommandConfig(CommandTier.PRO, requires_license=True),
    "hr": CommandConfig(CommandTier.PRO, requires_license=True),
    "sales": CommandConfig(CommandTier.PRO, requires_license=True),
    "agriculture": CommandConfig(CommandTier.PRO, requires_license=True),
    "entrepreneur": CommandConfig(CommandTier.PRO, requires_license=True),
    "construction": CommandConfig(CommandTier.PRO, requires_license=True),
    "marketing-agent": CommandConfig(CommandTier.PRO, requires_license=True),
    "type-check": CommandConfig(CommandTier.PRO, requires_license=True),
    "bootstrap": CommandConfig(CommandTier.PRO, requires_license=True),
    "raas": CommandConfig(CommandTier.PRO, requires_license=True),
    "bizops": CommandConfig(CommandTier.PRO, requires_license=True),
    "research-agent": CommandConfig(CommandTier.PRO, requires_license=True),
    "coach": CommandConfig(CommandTier.PRO, requires_license=True),
    "accounting": CommandConfig(CommandTier.PRO, requires_license=True),
    "procurement": CommandConfig(CommandTier.PRO, requires_license=True),
    "supply-chain": CommandConfig(CommandTier.PRO, requires_license=True),
    "ecommerce": CommandConfig(CommandTier.PRO, requires_license=True),
    "invoice": CommandConfig(CommandTier.PRO, requires_license=True),
    "alert": CommandConfig(CommandTier.PRO, requires_license=True),
    "db-seed": CommandConfig(CommandTier.PRO, requires_license=True),
    "consulting": CommandConfig(CommandTier.PRO, requires_license=True),
    "real-estate": CommandConfig(CommandTier.PRO, requires_license=True),
    "data-prep": CommandConfig(CommandTier.PRO, requires_license=True),
    "rate-limit-check": CommandConfig(CommandTier.PRO, requires_license=True),
    "test-coverage": CommandConfig(CommandTier.PRO, requires_license=True),
    "deps-audit": CommandConfig(CommandTier.PRO, requires_license=True),
    "vuln-scan": CommandConfig(CommandTier.PRO, requires_license=True),
    "i18n-sync": CommandConfig(CommandTier.PRO, requires_license=True),
    "healthcare": CommandConfig(CommandTier.PRO, requires_license=True),
    "nocode": CommandConfig(CommandTier.PRO, requires_license=True),
    "helm-install": CommandConfig(CommandTier.PRO, requires_license=True),
    "lighthouse": CommandConfig(CommandTier.PRO, requires_license=True),
    "hospitality": CommandConfig(CommandTier.PRO, requires_license=True),
    "fundraise": CommandConfig(CommandTier.PRO, requires_license=True),
    "revenue": CommandConfig(CommandTier.PRO, requires_license=True),
    "security-audit": CommandConfig(CommandTier.PRO, requires_license=True),
    "health-check": CommandConfig(CommandTier.PRO, requires_license=True),
    "docker-build": CommandConfig(CommandTier.PRO, requires_license=True),
    "support": CommandConfig(CommandTier.PRO, requires_license=True),
    "email-campaign": CommandConfig(CommandTier.PRO, requires_license=True),
    "social-media": CommandConfig(CommandTier.PRO, requires_license=True),
    "product-manager": CommandConfig(CommandTier.PRO, requires_license=True),

    # ENTERPRISE commands - admin & maintenance
    "license-admin": CommandConfig(CommandTier.ENTERPRISE, requires_license=True),
    "tier-admin": CommandConfig(CommandTier.ENTERPRISE, requires_license=True),
    "raas-maintenance": CommandConfig(CommandTier.ENTERPRISE, requires_license=True),
}

# Grace period configuration (hours)
GRACE_PERIOD_NETWORK_ERROR = 24  # 24 hours for network failures
GRACE_PERIOD_INVALID_LICENSE = 1  # 1 hour for invalid license


class CommandAuthorizer:
    """
    Per-command authorization and usage metering.

    Validates RAAS_LICENSE_KEY on every command invocation,
    enforces per-command usage metering via JWT/mk_ API key auth,
    and blocks execution if license is invalid/expired/over quota.
    """

    def __init__(
        self,
        gateway_client: Optional[GatewayClient] = None,
    ):
        """
        Initialize Command Authorizer.

        Args:
            gateway_client: Optional GatewayClient instance
        """
        self.gateway = gateway_client or get_gateway_client()
        self.auth_client = get_auth_client()
        self.license_manager = get_license_manager()
        self.kv_client = get_kv_client()

        # Cache for gateway validation results
        self._last_validated_at: Optional[datetime] = None
        self._last_validation_result: Optional[AuthorizationResult] = None
        self._validation_cache_ttl_seconds = 60  # Cache for 1 minute

    def get_command_tier(self, command: str) -> CommandTier:
        """
        Get tier for a command.

        Args:
            command: Command name

        Returns:
            CommandTier for the command
        """
        config = COMMAND_TIER_MAP.get(command)
        if not config:
            # Default unknown commands to PRO
            return CommandTier.PRO
        return config.tier

    def is_free_command(self, command: str) -> bool:
        """Check if command is FREE tier."""
        return self.get_command_tier(command) == CommandTier.FREE

    def _check_license_local(self) -> tuple[bool, Optional[str]]:
        """
        Check local license validity.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not self.license_manager.is_valid():
            return False, "No valid license found"

        license_data = self.license_manager.get_license()
        if license_data and license_data.is_expired:
            return False, f"License expired on {license_data.expires_at}"

        return True, None

    def _check_grace_period(self, command: str) -> tuple[bool, Optional[int]]:
        """
        Check if within grace period for offline/invalid scenarios.

        Returns:
            Tuple of (in_grace_period, remaining_hours)
        """
        try:
            state = self.kv_client.get("auth_grace_state")
            if not state:
                return False, None

            import json
            grace_state = json.loads(state)

            grace_until = grace_state.get("grace_until")
            if not grace_until:
                return False, None

            grace_until_dt = datetime.fromisoformat(grace_until.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)

            if now >= grace_until_dt:
                return False, None

            remaining_hours = int((grace_until_dt - now).total_seconds() / 3600)
            return True, remaining_hours

        except Exception as e:
            logger.debug(f"Grace period check error: {e}")
            return False, None

    def _enter_grace_period(self, hours: int) -> None:
        """Enter grace period for specified hours."""
        try:
            import json
            grace_until = datetime.now(timezone.utc) + timedelta(hours=hours)

            state = {
                "grace_until": grace_until.isoformat(),
                "reason": "network_error" if hours > 1 else "invalid_license",
                "entered_at": datetime.now(timezone.utc).isoformat(),
            }

            self.kv_client.set("auth_grace_state", json.dumps(state))
            logger.info(f"Entered grace period for {hours}h ({state['reason']})")

        except Exception as e:
            logger.debug(f"Failed to enter grace period: {e}")

    def _validate_with_gateway(self, license_key: str) -> AuthorizationResult:
        """
        Validate license with RaaS Gateway.

        Uses lightweight /v1/verify endpoint for fast validation (<100ms).

        Args:
            license_key: RAAS_LICENSE_KEY

        Returns:
            AuthorizationResult with validation status
        """
        try:
            # Use lightweight verify endpoint
            response = self.gateway.get(
                "/v1/verify",
                headers={"Authorization": f"Bearer {license_key}"},
            )

            if response.status_code == 200:
                data = response.data
                return AuthorizationResult(
                    allowed=True,
                    reason=AuthorizationReason.LICENSE_VALID,
                    tenant_id=data.get("tenant_id"),
                    tier=data.get("tier", "pro"),
                    rate_limit_remaining=response.rate_limit_remaining,
                )

            elif response.status_code == 429:
                # Rate limited
                reset_in = response.headers.get("X-RateLimit-Reset")
                if reset_in:
                    reset_timestamp = int(reset_in)
                    reset_in_seconds = max(0, reset_timestamp - int(time.time()))
                else:
                    reset_in_seconds = 60

                return AuthorizationResult(
                    allowed=False,
                    reason=AuthorizationReason.QUOTA_EXCEEDED,
                    message="Rate limit exceeded. Please wait before retrying.",
                    rate_limit_reset_in=reset_in_seconds,
                )

            elif response.status_code == 401:
                return AuthorizationResult(
                    allowed=False,
                    reason=AuthorizationReason.INVALID_LICENSE,
                    message="Invalid API key or JWT token",
                )

            elif response.status_code == 403:
                return AuthorizationResult(
                    allowed=False,
                    reason=AuthorizationReason.EXPIRED_LICENSE,
                    message="License has expired",
                )

            else:
                # Network or server error
                raise GatewayValidationError(f"Gateway returned {response.status_code}")

        except GatewayValidationError:
            # Check grace period
            in_grace, remaining = self._check_grace_period(command="validate")
            if in_grace:
                return AuthorizationResult(
                    allowed=True,
                    reason=AuthorizationReason.GRACE_PERIOD,
                    message=f"Using grace period (network error): {remaining}h remaining",
                    grace_period_remaining_hours=remaining,
                    is_cached=True,
                )

            # Enter grace period for network errors
            self._enter_grace_period(GRACE_PERIOD_NETWORK_ERROR)

            return AuthorizationResult(
                allowed=True,
                reason=AuthorizationReason.GRACE_PERIOD,
                message=f"Network error, grace period activated: {GRACE_PERIOD_NETWORK_ERROR}h",
                grace_period_remaining_hours=GRACE_PERIOD_NETWORK_ERROR,
            )

        except Exception:
            # Network error - check grace period
            in_grace, remaining = self._check_grace_period(command="validate")
            if in_grace:
                return AuthorizationResult(
                    allowed=True,
                    reason=AuthorizationReason.GRACE_PERIOD,
                    message=f"Using grace period: {remaining}h remaining",
                    grace_period_remaining_hours=remaining,
                    is_cached=True,
                )

            # Enter grace period
            self._enter_grace_period(GRACE_PERIOD_NETWORK_ERROR)

            return AuthorizationResult(
                allowed=True,
                reason=AuthorizationReason.GRACE_PERIOD,
                message="Gateway unavailable, using grace period",
                grace_period_remaining_hours=GRACE_PERIOD_NETWORK_ERROR,
            )

    def authorize_command(self, command: str) -> AuthorizationResult:
        """
        Authorize a command invocation.

        Flow:
        1. Check if FREE command → allow immediately
        2. Check local license validity
        3. Check cache (if validated recently)
        4. Validate with RaaS Gateway
        5. Check command tier vs license tier
        6. Return authorization result

        Args:
            command: Command name to authorize

        Returns:
            AuthorizationResult with authorization status
        """
        # Step 1: FREE commands don't need authorization
        if self.is_free_command(command):
            return AuthorizationResult(
                allowed=True,
                reason=AuthorizationReason.FREE_COMMAND,
                message=f"'{command}' is a free command",
            )

        # Step 2: Check local license
        license_valid, license_error = self._check_license_local()
        if not license_valid:
            # Check grace period for invalid license
            in_grace, remaining = self._check_grace_period(command)
            if in_grace:
                return AuthorizationResult(
                    allowed=True,
                    reason=AuthorizationReason.GRACE_PERIOD,
                    message=f"Using grace period: {remaining}h remaining",
                    grace_period_remaining_hours=remaining,
                    is_cached=True,
                )

            # Enter grace period for invalid license (1 hour)
            self._enter_grace_period(GRACE_PERIOD_INVALID_LICENSE)

            return AuthorizationResult(
                allowed=False,
                reason=AuthorizationReason.INVALID_LICENSE,
                message=license_error,
            )

        # Step 3: Check cache
        if self._last_validated_at:
            elapsed = (datetime.now(timezone.utc) - self._last_validated_at).total_seconds()
            if elapsed < self._validation_cache_ttl_seconds:
                if self._last_validation_result and self._last_validation_result.allowed:
                    self._last_validation_result.is_cached = True
                    return self._last_validation_result

        # Step 4: Validate with gateway
        license_key = os.getenv("RAAS_LICENSE_KEY")
        if not license_key:
            # Try to get from license manager
            license_data = self.license_manager.get_license()
            if license_data:
                license_key = license_data.license_key

        if not license_key:
            return AuthorizationResult(
                allowed=False,
                reason=AuthorizationReason.INVALID_LICENSE,
                message="RAAS_LICENSE_KEY not set",
            )

        gateway_result = self._validate_with_gateway(license_key)

        # Cache the result
        self._last_validated_at = datetime.now(timezone.utc)
        self._last_validation_result = gateway_result

        # Step 5: Check tier requirements
        if gateway_result.allowed:
            command_tier = self.get_command_tier(command)
            license_tier = gateway_result.tier or "free"

            # Tier hierarchy: free < pro < enterprise
            tier_hierarchy = {"free": 0, "pro": 1, "enterprise": 2}

            if tier_hierarchy.get(license_tier, 0) < tier_hierarchy.get(command_tier.value, 0):
                return AuthorizationResult(
                    allowed=False,
                    reason=AuthorizationReason.INSUFFICIENT_TIER,
                    message=f"Command '{command}' requires {command_tier.value.upper()} tier, current: {license_tier.upper()}",
                )

        return gateway_result

    def record_usage(self, command: str, result: AuthorizationResult) -> None:
        """
        Record usage event for authorized command.

        Args:
            command: Command that was executed
            result: Authorization result
        """
        if not result.allowed:
            return  # Don't record blocked commands

        try:
            # Import usage instrumentor
            from src.cli.usage_auto_instrument import emit_usage_event
            emit_usage_event(command)
        except Exception as e:
            logger.debug(f"Failed to record usage for {command}: {e}")

    def get_status(self) -> Dict[str, Any]:
        """
        Get authorization status summary.

        Returns:
            Dict with authorization status info
        """
        license_valid, _ = self._check_license_local()
        in_grace, remaining = self._check_grace_period("status")

        return {
            "license_valid": license_valid,
            "in_grace_period": in_grace,
            "grace_period_remaining_hours": remaining,
            "last_validated_at": self._last_validated_at.isoformat() if self._last_validated_at else None,
            "cache_ttl_seconds": self._validation_cache_ttl_seconds,
        }


class GatewayValidationError(Exception):
    """Gateway validation error."""
    pass


# Global instance
_authorizer: Optional[CommandAuthorizer] = None


def get_authorizer() -> CommandAuthorizer:
    """Get global authorizer instance."""
    global _authorizer
    if _authorizer is None:
        _authorizer = CommandAuthorizer()
    return _authorizer


def reset_authorizer() -> None:
    """Reset global authorizer (for testing)."""
    global _authorizer
    _authorizer = None
