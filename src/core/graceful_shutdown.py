"""
Graceful Shutdown Handler — ROIaaS Final Phase

Handles graceful shutdown sequence when all five ROIaaS phases are operational:
1. Logs "Goodbye!" message with shutdown reason
2. Performs cleanup operations
3. Exits cleanly with proper exit codes

Shutdown Sequence:
1. Stop accepting new requests
2. Complete in-flight operations
3. Close database connections
4. Stop health endpoint server
5. Flush logs and telemetry
6. Log final "Goodbye!" message
7. Exit with code 0
"""

import os
import sys
import asyncio
import signal
import atexit
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Callable, Awaitable, Dict, Any

from rich.console import Console
from rich.panel import Panel


class ShutdownReason(str, Enum):
    """Reason for shutdown."""
    ALL_PHASES_OPERATIONAL = "all_phases_operational"
    USER_REQUESTED = "user_requested"
    ERROR = "error"
    SIGNAL_RECEIVED = "signal_received"
    MAINTENANCE = "maintenance"


@dataclass
class ShutdownContext:
    """Context information for shutdown."""
    reason: ShutdownReason
    timestamp: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    cleanup_steps_completed: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class GracefulShutdownHandler:
    """
    Handles graceful shutdown sequence.

    Features:
    - Ordered cleanup operations
    - Error handling during shutdown
    - Final logging with "Goodbye!" message
    - Exit code management
    """

    def __init__(self) -> None:
        self.console = Console()
        self._shutdown_in_progress = False
        self._shutdown_context: Optional[ShutdownContext] = None
        self._cleanup_handlers: List[Callable[[], Awaitable[bool]]] = []
        self._final_callbacks: List[Callable[[], Awaitable[None]]] = []
        self._exit_code = 0

        # Register atexit handler
        atexit.register(self._on_exit)

    def register_cleanup_handler(
        self,
        handler: Callable[[], Awaitable[bool]],
        name: str = "",
    ) -> None:
        """
        Register a cleanup handler to be called during shutdown.

        Args:
            handler: Async callable that returns True if cleanup succeeded
            name: Optional name for logging
        """
        self._cleanup_handlers.append(handler)

    def register_final_callback(
        self,
        callback: Callable[[], Awaitable[None]],
    ) -> None:
        """Register callback to be called just before exit."""
        self._final_callbacks.append(callback)

    async def initiate_shutdown(
        self,
        reason: ShutdownReason = ShutdownReason.ALL_PHASES_OPERATIONAL,
        details: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Initiate graceful shutdown sequence.

        Args:
            reason: Reason for shutdown
            details: Optional details about shutdown reason

        Returns:
            Exit code (0 for success, non-zero for error)
        """
        if self._shutdown_in_progress:
            self.console.print("[yellow]⚠ Shutdown already in progress...[/yellow]")
            return self._exit_code

        self._shutdown_in_progress = True
        self._shutdown_context = ShutdownContext(
            reason=reason,
            timestamp=datetime.now(timezone.utc).isoformat(),
            details=details or {},
        )

        self.console.print("\n" + "=" * 60)
        self.console.print(
            Panel(
                f"[bold yellow]Initiating Graceful Shutdown[/bold yellow]\n\n"
                f"[dim]Reason:[/dim] [cyan]{reason.value}[/cyan]\n"
                f"[dim]Time:[/dim] {self._shutdown_context.timestamp}",
                title="🛑 SHUTDOWN SEQUENCE",
                border_style="yellow",
            ),
        )

        # Execute cleanup handlers in order
        for idx, handler in enumerate(self._cleanup_handlers):
            step_name = f"Cleanup handler {idx + 1}"
            try:
                self.console.print(f"[dim]⟳ {step_name}...[/dim]")
                success = await handler()
                if success:
                    self.console.print(f"[green]✓ {step_name} completed[/green]")
                    self._shutdown_context.cleanup_steps_completed.append(step_name)
                else:
                    self.console.print(f"[yellow]⚠ {step_name} returned failure[/yellow]")
                    self._shutdown_context.errors.append(f"{step_name} returned failure")
            except Exception as e:
                error_msg = f"{step_name} failed: {e}"
                self.console.print(f"[red]✗ {error_msg}[/red]")
                self._shutdown_context.errors.append(error_msg)

        # Execute final callbacks
        for callback in self._final_callbacks:
            try:
                await callback()
            except Exception as e:
                self.console.print(f"[yellow]⚠ Final callback error: {e}[/yellow]")

        # Log final "Goodbye!" message
        self._log_goodbye()

        # Set exit code
        self._exit_code = 0 if not self._shutdown_context.errors else 1

        return self._exit_code

    def _log_goodbye(self) -> None:
        """Log final 'Goodbye!' message."""
        ctx = self._shutdown_context

        if not ctx:
            return

        # Build summary
        summary_lines = [
            f"[dim]Reason:[/dim] {ctx.reason.value}",
            f"[dim]Timestamp:[/dim] {ctx.timestamp}",
            f"[dim]Cleanup steps:[/dim] {len(ctx.cleanup_steps_completed)} completed",
        ]

        if ctx.errors:
            summary_lines.append(f"[dim]Errors:[/dim] {len(ctx.errors)}")
        else:
            summary_lines.append("[green]✓ Clean shutdown[/green]")

        # Add phase completion details if available
        if "phases_status" in ctx.details:
            phases = ctx.details["phases_status"]
            summary_lines.append(f"[dim]Phases operational:[/dim] {len([p for p in phases.values() if p == 'operational'])}/{len(phases)}")

        self.console.print("\n" + "=" * 60)
        self.console.print(
            Panel(
                "\n".join([
                    "[bold green]Goodbye![/bold green]",
                    "",
                ] + summary_lines),
                title="👋 SHUTDOWN COMPLETE",
                border_style="green",
            ),
        )
        self.console.print("=" * 60 + "\n")

    def _on_exit(self) -> None:
        """Called on interpreter exit."""
        if self._shutdown_in_progress:
            return

        # Fallback shutdown if handler wasn't called
        self.console.print("\n[yellow]⚠ Process exiting without graceful shutdown...[/yellow]")

    def perform_sync_cleanup(self) -> None:
        """
        Perform synchronous cleanup operations.

        This is called when async operations aren't available.
        """
        self.console.print("[dim]Performing synchronous cleanup...[/dim]")

        # Close any open file handles
        # Flush any buffered output
        sys.stdout.flush()
        sys.stderr.flush()


# Default shutdown handler instance
_shutdown_handler: Optional[GracefulShutdownHandler] = None


def get_shutdown_handler() -> GracefulShutdownHandler:
    """Get global GracefulShutdownHandler instance."""
    global _shutdown_handler
    if _shutdown_handler is None:
        _shutdown_handler = GracefulShutdownHandler()
    return _shutdown_handler


def reset_shutdown_handler() -> None:
    """Reset global shutdown handler (for testing)."""
    global _shutdown_handler
    _shutdown_handler = None


async def shutdown_on_all_phases_operational() -> None:
    """
    Convenience function to shutdown when all phases are operational.

    Usage:
        from src.core.graceful_shutdown import shutdown_on_all_phases_operational
        detector.register_callback(shutdown_on_all_phases_operational)
    """
    from src.raas.phase_completion_detector import get_detector

    handler = get_shutdown_handler()
    detector = get_detector()

    await handler.initiate_shutdown(
        reason=ShutdownReason.ALL_PHASES_OPERATIONAL,
        details={
            "phases_status": {
                phase_id: info.status.value
                for phase_id, info in detector.get_all_phases_status().items()
            },
        },
    )

    # Perform final exit
    sys.exit(handler._exit_code)


def register_shutdown_cleanup(
    name: str,
    cleanup_fn: Callable[[], Awaitable[bool]],
) -> None:
    """
    Register a cleanup function to be called during shutdown.

    Usage:
        register_shutdown_cleanup("close_db", close_database_connections)
    """
    handler = get_shutdown_handler()
    handler.register_cleanup_handler(cleanup_fn, name)


__all__ = [
    "ShutdownReason",
    "ShutdownContext",
    "GracefulShutdownHandler",
    "get_shutdown_handler",
    "reset_shutdown_handler",
    "shutdown_on_all_phases_operational",
    "register_shutdown_cleanup",
]
