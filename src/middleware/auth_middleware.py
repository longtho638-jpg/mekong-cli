"""
Auth Middleware — CLI Command Authorization Middleware

Phase 6: Integrates CommandAuthorizer with Typer CLI.

This middleware intercepts all CLI command invocations and:
1. Validates RAAS_LICENSE_KEY before execution
2. Blocks PRO/ENTERPRISE commands if license invalid
3. Records usage events after successful execution
4. Implements pre-flight gateway checks (<100ms)

Usage in main.py:
    from src.middleware.auth_middleware import AuthMiddleware

    middleware = AuthMiddleware()

    @app.callback()
    def main(ctx: typer.Context):
        middleware.pre_command_check(ctx)
"""

from __future__ import annotations

import sys
import logging
from typing import Optional, TYPE_CHECKING

from rich.console import Console

from src.core.command_authorizer import (
    get_authorizer,
    CommandAuthorizer,
    AuthorizationResult,
    AuthorizationReason,
)

if TYPE_CHECKING:
    import typer

logger = logging.getLogger(__name__)
console = Console()


class AuthMiddleware:
    """
    Middleware for CLI command authorization.

    Intercepts command invocations and validates license
    before allowing execution.
    """

    def __init__(self, authorizer: Optional[CommandAuthorizer] = None):
        """
        Initialize Auth Middleware.

        Args:
            authorizer: Optional CommandAuthorizer instance
        """
        self.authorizer = authorizer or get_authorizer()
        self._last_result: Optional[AuthorizationResult] = None

    def get_invoked_command(self, ctx: "typer.Context") -> str:
        """
        Extract invoked command from Typer context.

        Args:
            ctx: Typer context

        Returns:
            Command name or empty string
        """
        if ctx.invoked_subcommand:
            return ctx.invoked_subcommand
        return ""

    def pre_command_check(self, ctx: "typer.Context") -> None:
        """
        Pre-command authorization check.

        Called before every command execution.
        Blocks execution if license is invalid/expired/over quota.

        Args:
            ctx: Typer context
        """
        command = self.get_invoked_command(ctx)

        # Skip if no command (showing help)
        if not command:
            return

        # Skip help and version flags
        if "--help" in sys.argv or "-h" in sys.argv:
            return

        # Authorize command
        result = self.authorizer.authorize_command(command)
        self._last_result = result

        if not result.allowed:
            self._handle_authorization_failure(command, result)

    def post_command_check(self, command: str) -> None:
        """
        Post-command usage recording.

        Called after successful command execution.
        Records usage event for metering.

        Args:
            command: Command that was executed
        """
        if self._last_result and self._last_result.allowed:
            self.authorizer.record_usage(command, self._last_result)

    def _handle_authorization_failure(
        self,
        command: str,
        result: AuthorizationResult,
    ) -> None:
        """
        Handle authorization failure.

        Displays error message and exits with code 1.

        Args:
            command: Command that was blocked
            result: Authorization result
        """
        console.print("\n[bold red]🚫 Command Blocked[/bold red]")
        console.print(f"Command: [cyan]{command}[/cyan]\n")

        # Display specific error based on reason
        if result.reason == AuthorizationReason.INVALID_LICENSE:
            console.print("[red]Invalid or missing license.[/red]")
            console.print("\n[yellow]To activate your license:[/yellow]")
            console.print("  [cyan]mekong license-activation mk_your_key[/cyan]\n")
            console.print("[dim]Or set environment variable:[/dim]")
            console.print("  [cyan]export RAAS_LICENSE_KEY=mk_your_key[/cyan]\n")

        elif result.reason == AuthorizationReason.EXPIRED_LICENSE:
            console.print("[red]License has expired.[/red]")
            console.print("\n[yellow]To renew your license:[/yellow]")
            console.print("  [cyan]mekong renewal[/cyan]\n")
            console.print("[dim]Or visit: https://raas.agencyos.network[/dim]\n")

        elif result.reason == AuthorizationReason.QUOTA_EXCEEDED:
            console.print("[red]Rate limit exceeded.[/red]")
            if result.rate_limit_reset_in:
                console.print(
                    f"[dim]Please wait {result.rate_limit_reset_in} seconds before retrying.[/dim]\n"
                )
            console.print("\n[yellow]Upgrade your tier for higher limits:[/yellow]")
            console.print("  [cyan]https://raas.agencyos.network/pricing[/cyan]\n")

        elif result.reason == AuthorizationReason.INSUFFICIENT_TIER:
            console.print(f"[red]{result.message}[/red]")
            console.print("\n[yellow]Upgrade to access this command:[/yellow]")
            console.print("  [cyan]https://raas.agencyos.network/pricing[/cyan]\n")

        elif result.reason == AuthorizationReason.GRACE_PERIOD:
            # Grace period - allow but warn
            console.print("[yellow]⚠️  Gateway Unavailable[/yellow]")
            console.print(f"{result.message}")
            console.print(
                "[dim]Command allowed under grace period. Gateway connection required soon.[/dim]\n"
            )
            return  # Don't block during grace period

        else:
            console.print(f"[red]{result.message or 'Authorization failed'}[/red]")

        # Exit with error
        sys.exit(1)

    def get_status(self) -> dict:
        """Get middleware status."""
        return self.authorizer.get_status()


# Global middleware instance
_middleware: Optional[AuthMiddleware] = None


def get_middleware() -> AuthMiddleware:
    """Get global middleware instance."""
    global _middleware
    if _middleware is None:
        _middleware = AuthMiddleware()
    return _middleware


def reset_middleware() -> None:
    """Reset global middleware (for testing)."""
    global _middleware
    _middleware = None
