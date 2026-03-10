"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
Refactored: 2026-03-05 — Modular architecture
ROIaaS Phase 1: Startup License Validation (TypeScript source of truth)
ROIaaS Phase 2: Remote Validation, Usage Metering, Key Generation
"""

import typer

from src.cli.commands_registry import register_all_commands
from src.cli.command_registry_legacy import register_legacy_commands
from src.cli.core_commands import register_core_commands

app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

register_all_commands(app)
register_legacy_commands(app)
register_core_commands(app)


def run_cli() -> None:
    """Entry point for CLI execution."""
    app()


if __name__ == "__main__":
    run_cli()
