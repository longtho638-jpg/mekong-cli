"""
Tier Admin CLI — ROIaaS Phase 6

CLI commands for managing tier rate limit configurations and tenant overrides.
"""

import typer
from rich.console import Console
from rich.table import Table
from typing import Optional

console = Console()

app = typer.Typer(name="tier-admin", help="Manage tier rate limit configurations")


@app.command("list")
def list_configs() -> None:
    """
    List all tier rate limit configurations.

    Shows all tiers with their presets, rate limits, and window sizes.
    """
    from src.db.tier_config_repository import get_repository

    console.print("[bold cyan]Tier Rate Limit Configurations[/bold cyan]\n")

    try:
        repo = get_repository()
        import asyncio
        configs = asyncio.run(repo.get_all_configs())

        if not configs:
            console.print("[yellow]No tier configurations found in database.[/yellow]")
            console.print("\n[dim]Using default configurations from src/lib/tier_config.py[/dim]")
            _show_default_configs()
            return

        # Display configs in table format
        for tier_name, presets in sorted(configs.items()):
            table = Table(title=f"Tier: {tier_name.upper()}", show_lines=True)
            table.add_column("Preset", style="cyan")
            table.add_column("Rate Limit", style="green")
            table.add_column("Window (seconds)", style="yellow")

            for preset_name, config in sorted(presets.items()):
                table.add_row(
                    preset_name,
                    str(config.rate_limit),
                    str(config.window_seconds),
                )

            console.print(table)
            console.print()

    except Exception as e:
        console.print(f"[red]Error loading configs:[/red] {e}")
        console.print("\n[dim]Showing default configurations:[/dim]")
        _show_default_configs()


def _show_default_configs() -> None:
    """Show default tier configurations from module."""
    from src.lib.tier_config import DEFAULT_TIER_CONFIGS, Tier

    for tier, config in DEFAULT_TIER_CONFIGS.items():
        tier_name = tier.value if isinstance(tier, Tier) else tier
        table = Table(title=f"Tier: {tier_name.upper()} (Default)", show_lines=True)
        table.add_column("Preset", style="cyan")
        table.add_column("Requests/Min", style="green")
        table.add_column("Burst Size", style="yellow")

        presets = [
            ("auth_login", config.auth_login),
            ("auth_callback", config.auth_callback),
            ("auth_refresh", config.auth_refresh),
            ("api_default", config.api_default),
        ]

        for preset_name, preset_config in presets:
            table.add_row(
                preset_name,
                str(preset_config.requests_per_minute),
                str(preset_config.burst_size),
            )

        console.print(table)
        console.print()


@app.command("get")
def get_config(tier: str) -> None:
    """
    Get configuration for a specific tier.

    Args:
        tier: Tier name (free, trial, pro, enterprise)
    """
    from src.db.tier_config_repository import get_repository

    console.print(f"[bold cyan]Configuration for Tier: {tier.upper()}[/bold cyan]\n")

    try:
        repo = get_repository()
        import asyncio

        # Get all presets for this tier
        presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
        configs = {}

        for preset in presets:
            config = asyncio.run(repo.get_config(tier.lower(), preset))
            if config:
                configs[preset] = config

        if not configs:
            console.print(f"[yellow]No database config found for tier '{tier}'.[/yellow]")
            console.print("\n[dim]Showing default configuration:[/dim]\n")
            _show_default_tier_config(tier)
            return

        table = Table(show_header=True)
        table.add_column("Preset", style="cyan")
        table.add_column("Rate Limit", style="green")
        table.add_column("Window (seconds)", style="yellow")

        for preset, config in sorted(configs.items()):
            table.add_row(
                preset,
                str(config.rate_limit),
                str(config.window_seconds),
            )

        console.print(table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        _show_default_tier_config(tier)


def _show_default_tier_config(tier: str) -> None:
    """Show default configuration for a tier."""
    from src.lib.tier_config import get_tier_config, Tier

    try:
        config = get_tier_config(tier)
        table = Table(show_header=True)
        table.add_column("Preset", style="cyan")
        table.add_column("Requests/Min", style="green")
        table.add_column("Burst Size", style="yellow")

        presets = [
            ("auth_login", config.auth_login),
            ("auth_callback", config.auth_callback),
            ("auth_refresh", config.auth_refresh),
            ("api_default", config.api_default),
        ]

        for preset_name, preset_config in presets:
            table.add_row(
                preset_name,
                str(preset_config.requests_per_minute),
                str(preset_config.burst_size),
            )

        console.print(table)
    except ValueError as e:
        console.print(f"[red]{e}[/red]")


@app.command("set")
def set_config(
    tier: str,
    preset: str,
    rate_limit: int = typer.Argument(..., help="Rate limit (requests per window)"),
    window_seconds: int = typer.Argument(60, help="Window size in seconds (default: 60)"),
) -> None:
    """
    Set rate limit configuration for a tier preset.

    Example:
        mekong tier-admin set pro auth_login 50 60
    """
    from src.db.tier_config_repository import get_repository
    from src.lib.tier_config import Tier

    # Validate tier
    valid_tiers = [t.value for t in Tier]
    if tier.lower() not in valid_tiers:
        console.print(f"[red]Invalid tier '{tier}'.[/red]")
        console.print(f"[dim]Valid tiers: {valid_tiers}[/dim]")
        raise typer.Exit(1)

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if preset.lower() not in valid_presets:
        console.print(f"[red]Invalid preset '{preset}'.[/red]")
        console.print(f"[dim]Valid presets: {valid_presets}[/dim]")
        raise typer.Exit(1)

    # Validate rate limit
    if rate_limit < 1:
        console.print("[red]Rate limit must be at least 1.[/red]")
        raise typer.Exit(1)

    try:
        repo = get_repository()
        import asyncio

        config = asyncio.run(
            repo.update_config(tier.lower(), preset.lower(), rate_limit, window_seconds)
        )

        console.print(f"[bold green]✓ Configuration updated![/bold green]\n")
        console.print(f"  [cyan]Tier:[/cyan] {config.tier}")
        console.print(f"  [cyan]Preset:[/cyan] {config.preset}")
        console.print(f"  [cyan]Rate Limit:[/cyan] {config.rate_limit} requests / {config.window_seconds}s")
        console.print(f"  [cyan]Window:[/cyan] {config.window_seconds} seconds")

        # Invalidate cache
        from src.lib.rate_limiter_factory import invalidate_cache
        invalidate_cache(tier.lower())

    except Exception as e:
        console.print(f"[red]Error updating config:[/red] {e}")
        raise typer.Exit(1)


@app.command("override")
def set_override(
    tenant_id: str,
    preset: str,
    custom_limit: int = typer.Argument(..., help="Custom rate limit"),
    custom_window: int = typer.Argument(60, help="Custom window in seconds (default: 60)"),
    tier: Optional[str] = typer.Option(None, "--tier", "-t", help="Optional tier override"),
) -> None:
    """
    Set custom rate limit override for a tenant.

    Example:
        mekong tier-admin override tenant-123 auth_login 100 60
    """
    from typing import Optional
    from src.db.tier_config_repository import get_repository

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if preset.lower() not in valid_presets:
        console.print(f"[red]Invalid preset '{preset}'.[/red]")
        console.print(f"[dim]Valid presets: {valid_presets}[/dim]")
        raise typer.Exit(1)

    # Validate custom limit
    if custom_limit < 1:
        console.print("[red]Custom limit must be at least 1.[/red]")
        raise typer.Exit(1)

    try:
        repo = get_repository()
        import asyncio

        override = asyncio.run(
            repo.set_tenant_override(
                tenant_id=tenant_id,
                preset=preset.lower(),
                custom_limit=custom_limit,
                custom_window=custom_window,
                tier=tier.lower() if tier else None,
            )
        )

        console.print(f"[bold green]✓ Tenant override created![/bold green]\n")
        console.print(f"  [cyan]Tenant ID:[/cyan] {override.tenant_id}")
        console.print(f"  [cyan]Preset:[/cyan] {override.preset}")
        console.print(f"  [cyan]Custom Limit:[/cyan] {override.custom_limit} requests / {override.custom_window}s")
        if override.tier:
            console.print(f"  [cyan]Tier Override:[/cyan] {override.tier}")
        if override.expires_at:
            console.print(f"  [cyan]Expires:[/cyan] {override.expires_at}")

    except Exception as e:
        console.print(f"[red]Error setting override:[/red] {e}")
        raise typer.Exit(1)


@app.command("overrides")
def list_overrides(
    tenant_id: Optional[str] = typer.Option(None, "--tenant", "-t", help="Filter by tenant ID"),
) -> None:
    """
    List all tenant rate limit overrides.

    Args:
        tenant_id: Optional filter by tenant ID
    """
    from src.db.tier_config_repository import get_repository

    console.print("[bold cyan]Tenant Rate Limit Overrides[/bold cyan]\n")

    try:
        repo = get_repository()
        import asyncio

        overrides = asyncio.run(repo.get_all_tenant_overrides(tenant_id))

        if not overrides:
            if tenant_id:
                console.print(f"[yellow]No overrides found for tenant '{tenant_id}'.[/yellow]")
            else:
                console.print("[yellow]No tenant overrides configured.[/yellow]")
            return

        table = Table(show_header=True)
        table.add_column("Tenant ID", style="cyan")
        table.add_column("Preset", style="green")
        table.add_column("Custom Limit", style="yellow")
        table.add_column("Window (s)", style="magenta")
        table.add_column("Tier Override", style="blue")
        table.add_column("Expires", style="red")

        for override in overrides:
            table.add_row(
                override.tenant_id,
                override.preset,
                str(override.custom_limit) if override.custom_limit else "-",
                str(override.custom_window),
                override.tier or "-",
                override.expires_at or "-",
            )

        console.print(table)

    except Exception as e:
        console.print(f"[red]Error loading overrides:[/red] {e}")


@app.command("remove-override")
def remove_override(
    tenant_id: str,
    preset: str,
) -> None:
    """
    Remove a tenant rate limit override.

    Args:
        tenant_id: Tenant identifier
        preset: Preset name
    """
    from src.db.tier_config_repository import get_repository

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if preset.lower() not in valid_presets:
        console.print(f"[red]Invalid preset '{preset}'.[/red]")
        console.print(f"[dim]Valid presets: {valid_presets}[/dim]")
        raise typer.Exit(1)

    try:
        repo = get_repository()
        import asyncio

        deleted = asyncio.run(repo.delete_tenant_override(tenant_id, preset.lower()))

        if deleted:
            console.print(f"[bold green]✓ Override removed for {tenant_id} ({preset})[/bold green]")
        else:
            console.print(f"[yellow]No override found for {tenant_id} ({preset})[/yellow]")

    except Exception as e:
        console.print(f"[red]Error removing override:[/red] {e}")
        raise typer.Exit(1)


# Import Optional for type hints
from typing import Optional


__all__ = ["app"]
