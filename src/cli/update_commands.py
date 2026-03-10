"""
Mekong CLI - Update Command

Secure auto-update mechanism with SHA256+GPG verification,
RaaS entitlement gating, and usage metering.
"""

import os
import subprocess
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

app = typer.Typer(help="CLI auto-update management")
console = Console()


@app.command()
def check(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed info"),
) -> None:
    """
    Check for available updates.

    Shows current version and latest release info.
    """
    from src.cli.auto_updater import get_updater

    updater = get_updater()
    current_version = updater.get_current_version()
    latest = updater.check_for_updates()

    console.print(Panel.fit("[bold cyan]Mekong CLI Update Check[/bold cyan]"))
    console.print()
    console.print(f"Current version: [bold]{current_version}[/bold]")

    if latest:
        console.print(f"Latest version:  [bold green]{latest.version}[/bold green]")
        console.print()

        if verbose:
            console.print(f"Release: {latest.name}")
            console.print(f"Published: {latest.published_at}")
            console.print(f"Security update: {'Yes' if latest.is_security_update else 'No'}")

            if latest.body:
                console.print()
                console.print("[bold]Changelog:[/bold]")
                console.print(latest.body[:500])

        console.print()
        console.print("[yellow]Run 'mekong update' to upgrade[/yellow]")
    else:
        console.print()
        console.print("[bold green]✓ You are on the latest version[/bold green]")


@app.command()
def update(
    force: bool = typer.Option(False, "--force", "-f", help="Force update"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
) -> None:
    """
    Download and install the latest version.

    Verifies SHA256 checksum and GPG signature before installation.
    Preserves user configuration during update.

    Security updates bypass license checks.
    """
    from src.cli.auto_updater import get_updater
    from src.lib.raas_gate_validator import get_validator

    updater = get_updater()
    current_version = updater.get_current_version()

    # Check for updates
    latest = updater.check_for_updates()

    if not latest:
        console.print("[bold green]✓ Already on latest version[/bold green]")

        if force:
            console.print("\n[yellow]Force reinstalling latest version...[/yellow]")
        else:
            raise typer.Exit(0)

    # RaaS Entitlement Check
    # Security updates are FREE for all users
    if not latest.is_security_update:
        validator = get_validator()
        is_valid, error = validator.validate()

        if not is_valid:
            console.print(Panel(
                "[red]RaaS License Required[/red]\n\n"
                "Non-security updates require a valid RaaS license.\n"
                "Security updates are always free.\n\n"
                f"[yellow]Current: {current_version} | Available: {latest.version}[/yellow]",
                title="License Check Failed",
                border_style="red",
            ))
            console.print()
            console.print("Get a license: [cyan]https://raas.mekong.dev/pricing[/cyan]")
            console.print("\nOr check available security updates:")
            console.print("  [cyan]mekong security-cmd status[/cyan]")
            raise typer.Exit(1)

    # Show update info
    console.print(Panel.fit(
        f"[bold]Update Available[/bold]\n\n"
        f"Current:  {current_version}\n"
        f"Latest:   {latest.version}\n"
        f"Security: {'Yes' if latest.is_security_update else 'No'}",
        border_style="green" if latest.is_security_update else "yellow",
    ))

    # Confirmation
    if not yes:
        proceed = typer.confirm("\nProceed with update?")
        if not proceed:
            console.print("[yellow]Update cancelled[/yellow]")
            raise typer.Exit(0)

    # Backup config
    console.print("\n[bold]Backing up configuration...[/bold]")

    # Perform update
    console.print()
    result = updater.update(force=force)

    # Show result
    if result.success:
        console.print(Panel(
            f"[bold green]✓ Update Successful![/bold green]\n\n"
            f"Updated from {result.old_version} to {result.new_version}\n"
            f"Config preserved: {'Yes' if result.config_preserved else 'No'}\n"
            f"Rollback available: {'Yes' if result.rollback_available else 'No'}",
            title="Update Complete",
            border_style="green",
        ))
    else:
        console.print(Panel(
            f"[bold red]✗ Update Failed[/bold red]\n\n"
            f"{result.message}\n\n"
            f"Config preserved: {'Yes' if result.config_preserved else 'No'}",
            title="Update Error",
            border_style="red",
        ))
        raise typer.Exit(1)


@app.command()
def rollback() -> None:
    """
    Rollback to previous version.

    Only available if last update was successful.
    """
    from src.cli.auto_updater import get_updater

    updater = get_updater()

    console.print("[bold]Rolling back to previous version...[/bold]")
    result = updater.rollback()

    if result:
        console.print("[bold green]✓ Rollback successful![/bold green]")
    else:
        console.print("[bold red]✗ Rollback failed[/bold red]")
        console.print("[dim]No previous version available or rollback not supported[/dim]")
        console.print("\nFor manual rollback:")
        console.print("  [cyan]pip install mekong-cli==<version>[/cyan]")
        raise typer.Exit(1)


@app.command()
def status() -> None:
    """
    Show current update status.

    Displays version, cache state, and critical update flags.
    """
    from src.cli.update_checker import get_update_checker
    from src.cli.auto_updater import get_updater

    checker = get_update_checker()
    updater = get_updater()

    current_version = updater.get_current_version()

    table = Table(title="Update Status")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Current Version", current_version)
    table.add_row(
        "Auto-Update Check",
        "Enabled" if not os.getenv("MEKONG_NO_UPDATE_CHECK") else "Disabled (env var set)",
    )

    # Check cache status
    cache_status = checker.get_cache_status()
    table.add_row(
        "Last Check",
        cache_status.get("checked_at", "Never") if cache_status.get("checked_at") != "0001-01-01T00:00:00+00:00" else "Never",
    )
    table.add_row(
        "Cache Status",
        "[red]Expired[/red]" if cache_status.get("is_expired") else "[green]Valid[/green]",
    )

    # Check for critical updates
    critical_update = checker.check_critical_update()
    if critical_update:
        table.add_row(
            "Critical Update",
            f"[bold red]{critical_update.latest_version} (REQUIRED)[/bold red]",
        )
        table.add_row("Action Required", "[bold red]Run 'mekong update install' immediately[/bold red]")
    else:
        table.add_row("Critical Update", "[green]None[/green]")

    # Check for regular updates
    update_available = cache_status.get("update_available", False)
    if update_available and not critical_update:
        table.add_row(
            "Update Available",
            f"[yellow]{cache_status.get('latest_version', 'unknown')}[/yellow]",
        )
        table.add_row("Action", "[yellow]Run 'mekong update install'[/yellow]")
    else:
        table.add_row("Update Available", "[green]No[/green]")

    console.print(table)


@app.command()
def history() -> None:
    """
    Show update history.

    Displays recent update events from local logs.
    """
    table = Table(title="Update History")
    table.add_column("Date", style="cyan")
    table.add_column("Commit", style="yellow")
    table.add_column("Message", style="green")
    table.add_column("Author", justify="right")

    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "--format=%ad|%h|%s|%an", "--date=short", "-10"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                parts = line.split("|", 3)
                if len(parts) == 4:
                    table.add_row(parts[0], parts[1], parts[2][:60], parts[3])
        else:
            table.add_row("N/A", "N/A", "No git history available", "N/A", style="dim")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        table.add_row("N/A", "N/A", "Git not available", "N/A", style="dim")

    console.print(table)


if __name__ == "__main__":
    app()
