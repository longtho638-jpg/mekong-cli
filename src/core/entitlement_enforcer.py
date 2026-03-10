"""
Entitlement Enforcer — Real-time Usage Cap Enforcement

Features:
- Check entitlement before command execution
- Usage cap enforcement with graceful degradation
- Entitlement refresh on TTL expiry
- Warnings at 80% usage
- Block at 100% usage cap
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Tuple

from src.core.raas_auth import get_auth_client
from src.core.kv_store_client import get_kv_client
from src.lib.usage_meter import get_usage_summary


class EntitlementStatus(Enum):
    """Entitlement check result."""

    ALLOWED = "allowed"
    WARNING = "warning"  # 80%+ usage
    SOFT_LIMIT = "soft_limit"  # Over quota, allow with overage
    HARD_LIMIT = "hard_limit"  # 100% cap, block


@dataclass
class EntitlementResult:
    """Result of entitlement check."""

    status: EntitlementStatus
    message: str
    remaining: int
    limit: int
    usage_percent: float
    reset_at: Optional[datetime] = None


class EntitlementEnforcer:
    """
    Real-time entitlement enforcement.

    Checks usage caps before command execution.
    Implements graceful degradation.
    """

    WARNING_THRESHOLD = 0.80  # Warn at 80%
    SOFT_LIMIT_THRESHOLD = 1.00  # Soft limit at 100%
    HARD_LIMIT_THRESHOLD = 1.00  # Hard block at 100%

    def __init__(self):
        self.auth = get_auth_client()
        self.kv = get_kv_client()
        self._last_check: Optional[EntitlementResult] = None

    def check_entitlement(self, command: str = "") -> EntitlementResult:
        """
        Check entitlement before command execution.

        Args:
            command: Command being executed (for logging)

        Returns:
            EntitlementResult with status and limits
        """
        # Get current usage
        creds = self.auth._load_credentials()
        key_id = self._extract_key_id(creds.get("token", ""))

        if not key_id:
            # No license - use free limits
            return EntitlementResult(
                status=EntitlementStatus.ALLOWED,
                message="Free tier (limited commands)",
                remaining=100,
                limit=100,
                usage_percent=0.0,
            )

        # Get usage summary
        try:
            usage = get_usage_summary(key_id)
            commands_today = usage.get("commands_today", 0)
            daily_limit = usage.get("daily_limit", 1000)

            if daily_limit <= 0:
                # Unlimited tier
                return EntitlementResult(
                    status=EntitlementStatus.ALLOWED,
                    message="Unlimited tier",
                    remaining=999999,
                    limit=999999,
                    usage_percent=0.0,
                )

            usage_percent = commands_today / daily_limit
            remaining = max(0, daily_limit - commands_today)

            # Determine status
            if usage_percent >= self.HARD_LIMIT_THRESHOLD:
                status = EntitlementStatus.HARD_LIMIT
                message = "Usage cap reached (100%). Commands blocked."
            elif usage_percent >= self.WARNING_THRESHOLD:
                status = EntitlementStatus.WARNING
                message = f"Warning: {usage_percent * 100:.0f}% usage. {remaining} commands remaining."
            else:
                status = EntitlementStatus.ALLOWED
                message = f"{remaining} commands remaining today."

            result = EntitlementResult(
                status=status,
                message=message,
                remaining=remaining,
                limit=daily_limit,
                usage_percent=usage_percent,
                reset_at=datetime.now(timezone.utc).replace(
                    hour=23, minute=59, second=59
                ),
            )

            self._last_check = result
            return result

        except Exception as e:
            import logging

            logging.debug(f"Entitlement check failed: {e}")
            # Fail open - allow with warning
            return EntitlementResult(
                status=EntitlementStatus.ALLOWED,
                message="Entitlement check unavailable (offline mode)",
                remaining=999999,
                limit=999999,
                usage_percent=0.0,
            )

    def _extract_key_id(self, token: str) -> Optional[str]:
        """Extract key_id from token."""
        if token.startswith("mk_"):
            parts = token.split("_")
            if len(parts) >= 3:
                return parts[2]
        return None

    def should_block(self) -> bool:
        """Check if command should be blocked."""
        if self._last_check is None:
            return False
        return self._last_check.status == EntitlementStatus.HARD_LIMIT

    def get_warning_message(self) -> Optional[str]:
        """Get warning message if at 80%+ usage."""
        if self._last_check is None:
            return None
        if self._last_check.status == EntitlementStatus.WARNING:
            return self._last_check.message
        return None

    def refresh_entitlement(self) -> bool:
        """
        Refresh entitlement from KV store.

        Called on TTL expiry.
        """
        try:
            # Sync with KV store
            state = self.kv.get_rate_limit_state(force_refresh=True)

            self._last_check = EntitlementResult(
                status=(
                    EntitlementStatus.ALLOWED
                    if state.remaining > 0
                    else EntitlementStatus.HARD_LIMIT
                ),
                message=f"{state.remaining} commands remaining",
                remaining=state.remaining,
                limit=state.limit,
                usage_percent=1.0 - (state.remaining / state.limit)
                if state.limit > 0
                else 0.0,
                reset_at=state.reset_at,
            )

            return True

        except Exception:
            return False


def check_and_enforce(command: str) -> Tuple[bool, Optional[str]]:
    """
    Convenience function for entitlement check.

    Args:
        command: Command being executed

    Returns:
        Tuple of (allowed, warning_message)
    """
    enforcer = EntitlementEnforcer()
    result = enforcer.check_entitlement(command)

    if enforcer.should_block():
        return False, result.message

    return True, enforcer.get_warning_message()


# Global instance
_enforcer: Optional[EntitlementEnforcer] = None


def get_enforcer() -> EntitlementEnforcer:
    """Get global entitlement enforcer."""
    global _enforcer
    if _enforcer is None:
        _enforcer = EntitlementEnforcer()
    return _enforcer


def show_entitlement_status() -> None:
    """Display entitlement status and usage caps."""
    from rich.console import Console
    from rich.panel import Panel

    console = Console()
    enforcer = get_enforcer()

    console.print("[bold cyan]📊 Entitlement Status[/bold cyan]\n")

    result = enforcer.check_entitlement()

    # Status indicator
    status_icons = {
        EntitlementStatus.ALLOWED: "✓",
        EntitlementStatus.WARNING: "⚠",
        EntitlementStatus.SOFT_LIMIT: "!",
        EntitlementStatus.HARD_LIMIT: "✗",
    }

    status_colors = {
        EntitlementStatus.ALLOWED: "green",
        EntitlementStatus.WARNING: "yellow",
        EntitlementStatus.SOFT_LIMIT: "orange",
        EntitlementStatus.HARD_LIMIT: "red",
    }

    status = result.status
    icon = status_icons[status]
    color = status_colors[status]

    console.print(f"[bold {color}]{icon} {result.message}[/bold {color}]\n")

    # Usage bar
    bar_width = 40
    filled = int(result.usage_percent * bar_width)
    bar = "█" * filled + "░" * (bar_width - filled)

    console.print(
        Panel(
            f"[{color}]{bar}[/{color}]\n"
            f"[dim]{result.usage_percent * 100:.1f}% of {result.limit} daily limit[/dim]\n"
            f"[bold]{result.remaining}[/bold] commands remaining",
            title="Usage",
            border_style=color,
        )
    )

    if result.reset_at:
        console.print(f"\n[dim]Resets at: {result.reset_at.strftime('%H:%M')}[/dim]")

    # Show tier info
    session = enforcer.auth.get_session()
    tier = session.tier if session.authenticated else "free"
    console.print(f"\n[dim]Tier: {tier.upper()}[/dim]")


__all__ = [
    "EntitlementStatus",
    "EntitlementResult",
    "EntitlementEnforcer",
    "get_enforcer",
    "check_and_enforce",
    "show_entitlement_status",
]
