"""
📊 Quota Command - Antigravity AI Quota Monitoring
===================================================
Monitor AI model quotas in real-time from the CLI.
Inspired by vscode-antigravity-cockpit.

Usage:
    mekong quota              # Show current status
    mekong quota --watch      # Live monitoring mode
    mekong quota --format json
"""

import sys
import time
from typing import List

from cli.commands.base import BaseCommand

# Import quota engine
sys.path.insert(0, str(__file__).replace("/cli/commands/core/quota.py", ""))
from packages.antigravity.core.quota_engine import QuotaEngine


class QuotaCommand(BaseCommand):
    """Command for monitoring Antigravity AI quotas."""

    @property
    def description(self) -> str:
        return "📊 Monitor Antigravity AI model quotas"

    def execute(self, args: List[str]) -> None:
        """Execute quota monitoring."""
        # Parse arguments
        watch_mode = "--watch" in args or "-w" in args
        json_output = "--json" in args
        compact_output = "--compact" in args or "-c" in args

        # Determine format
        if json_output:
            fmt = "json"
        elif compact_output:
            fmt = "compact"
        else:
            fmt = "full"

        # Initialize engine
        engine = QuotaEngine()

        if watch_mode:
            self._watch_mode(engine, fmt)
        else:
            self._show_status(engine, fmt)

    def _show_status(self, engine: QuotaEngine, fmt: str) -> None:
        """Show current quota status."""
        output = engine.format_cli_output(fmt)
        self.console.print(output)

        # Show alerts
        status = engine.get_current_status()
        if status["alerts"]["criticals"]:
            self.console.print("\n[bold red]⚠️  CRITICAL QUOTA ALERTS:[/bold red]")
            for model in status["alerts"]["criticals"]:
                self.console.print(f"   🔴 {model} - Consider switching models!")

    def _watch_mode(self, engine: QuotaEngine, fmt: str) -> None:
        """Live monitoring mode with auto-refresh."""
        self.console.print("\n[bold cyan]📊 LIVE QUOTA MONITORING[/bold cyan]")
        self.console.print("[dim]Press Ctrl+C to exit[/dim]\n")

        refresh_interval = 30  # seconds

        try:
            while True:
                # Clear screen and show status
                self.console.clear()
                self.console.print("[bold cyan]📊 LIVE QUOTA MONITORING[/bold cyan]")
                self.console.print(
                    f"[dim]Refreshing every {refresh_interval}s | Ctrl+C to exit[/dim]\n"
                )

                output = engine.format_cli_output(fmt)
                self.console.print(output)

                # Show timestamp
                from datetime import datetime

                now = datetime.now().strftime("%H:%M:%S")
                self.console.print(f"\n[dim]Last updated: {now}[/dim]")

                # Wait before refresh
                time.sleep(refresh_interval)

                # Force refresh
                engine.get_local_quota()

        except KeyboardInterrupt:
            self.console.print("\n\n[dim]Stopped monitoring.[/dim]")

    def print_help(self) -> None:
        """Print command help."""
        self.console.print("\n[bold]📊 QUOTA COMMAND[/bold]")
        self.console.print("=" * 40)
        self.console.print("Monitor Antigravity AI model quotas.\n")
        self.console.print("[bold]Usage:[/bold]")
        self.console.print("  mekong quota              Show current status")
        self.console.print("  mekong quota --watch      Live monitoring (auto-refresh)")
        self.console.print("  mekong quota --compact    Compact output")
        self.console.print("  mekong quota --json       JSON output")
        self.console.print("")
