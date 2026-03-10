"""
Debug Rate Limits CLI — ROIaaS Phase 4 Observability

Diagnostic CLI commands for debugging rate limit issues.
"""

import typer
import asyncio
import json
from typing import Optional
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

app = typer.Typer(name="debug-rate-limits", help="Debug rate limit issues")


def _format_timestamp(timestamp_str: str) -> str:
    """Format timestamp for display."""
    try:
        # Handle ISO format with timezone
        ts = timestamp_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        return timestamp_str


def _format_tier_display(tier: str) -> str:
    """Format tier name for display."""
    if "custom" in tier.lower():
        return f"{tier.split()[0]} (custom)"
    return tier


@app.command("status")
def check_status(
    tenant_id: str = typer.Argument(..., help="Tenant ID to check"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """
    Check current rate limit status for a tenant.

    Shows tier, custom overrides, quota utilization, and current state.

    Example:
        mekong debug-rate-limits status tenant-123
    """
    from src.db.tier_config_repository import get_repository
    from src.db.database import init_database, close_database

    async def _get_status():
        await init_database()
        repo = get_repository()

        # Get tenant override if exists
        overrides = {}
        presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]

        for preset in presets:
            override = await repo.get_tenant_override(tenant_id, preset)
            if override and not override.is_expired():
                overrides[preset] = override

        # Get recent events for quota utilization
        query = """
            SELECT
                preset,
                event_type,
                quota_limit,
                quota_remaining,
                quota_utilization_pct,
                created_at
            FROM rate_limit_events
            WHERE tenant_id = $1
              AND created_at > NOW() - INTERVAL '5 minutes'
            ORDER BY created_at DESC
            LIMIT 100
        """
        db = repo._db
        events = await db.fetch_all(query, (tenant_id,))

        # Calculate utilization by preset
        utilization = {}
        for event in events:
            preset = event["preset"]
            if preset not in utilization:
                utilization[preset] = {
                    "requests": 0,
                    "limited": 0,
                    "last_limit": None,
                    "last_remaining": None,
                    "utilization": 0.0,
                }
            utilization[preset]["requests"] += 1
            if event["event_type"] == "rate_limited":
                utilization[preset]["limited"] += 1
            if event["quota_remaining"] is not None:
                utilization[preset]["last_remaining"] = event["quota_remaining"]
                utilization[preset]["last_limit"] = event["quota_limit"]
                utilization[preset]["utilization"] = float(event["quota_utilization_pct"] or 0)

        # Determine effective tier
        if overrides:
            # Check if all overrides have same tier
            tiers = set(o.tier for o in overrides.values() if o.tier)
            effective_tier = list(tiers)[0] if len(tiers) == 1 else "mixed (custom)"
        else:
            # Get tier from recent events
            if events:
                effective_tier = events[0].get("tier", "unknown")
            else:
                effective_tier = "unknown"

        return {
            "tenant_id": tenant_id,
            "effective_tier": effective_tier,
            "has_custom_overrides": len(overrides) > 0,
            "overrides": overrides,
            "presets": utilization,
            "recent_events_count": len(events),
        }

    try:
        result = asyncio.run(_get_status())
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        asyncio.run(close_database())

    if as_json:
        # JSON output
        output = {
            "tenant_id": result["tenant_id"],
            "tier": result["effective_tier"],
            "has_custom_overrides": result["has_custom_overrides"],
            "overrides": {
                preset: {
                    "custom_limit": o.custom_limit,
                    "custom_window": o.custom_window,
                    "expires_at": o.expires_at,
                }
                for preset, o in result["overrides"].items()
            },
            "quota_utilization": {
                preset: {
                    "requests_5min": data["requests"],
                    "limited_count": data["limited"],
                    "remaining": data["last_remaining"],
                    "utilization_pct": round(data["utilization"], 2),
                }
                for preset, data in result["presets"].items()
            },
        }
        console.print(json.dumps(output, indent=2))
        return

    # Rich table output
    console.print(Panel(f"[bold cyan]Rate Limit Status[/bold cyan]\n[cyan]Tenant:[/cyan] {tenant_id}", border_style="cyan"))

    # Tier info
    tier_display = _format_tier_display(result["effective_tier"])
    if result["has_custom_overrides"]:
        tier_display = f"[green]{tier_display}[/green] [dim](custom overrides active)[/dim]"

    console.print(f"[bold]Effective Tier:[/bold] {tier_display}")
    console.print()

    # Overrides table
    if result["overrides"]:
        console.print("[bold yellow]Custom Overrides:[/bold yellow]")
        table = Table(show_header=True, show_lines=True)
        table.add_column("Preset", style="cyan")
        table.add_column("Custom Limit", style="green")
        table.add_column("Window (s)", style="yellow")
        table.add_column("Expires", style="red")

        for preset, override in result["overrides"].items():
            expires = override.expires_at or "Never"
            if expires != "Never":
                expires = _format_timestamp(expires)

            table.add_row(
                preset,
                str(override.custom_limit),
                str(override.custom_window),
                expires,
            )

        console.print(table)
        console.print()

    # Quota utilization table
    if result["presets"]:
        console.print("[bold blue]Quota Utilization (Last 5 minutes)[/bold blue]")
        table = Table(show_header=True)
        table.add_column("Preset", style="cyan")
        table.add_column("Requests", style="white")
        table.add_column("Limited", style="red")
        table.add_column("Remaining", style="green")
        table.add_column("Utilization", style="yellow")

        for preset, data in result["presets"].items():
            utilization_pct = data["utilization"]
            utilization_color = "green" if utilization_pct < 50 else "yellow" if utilization_pct < 80 else "red"

            table.add_row(
                preset,
                str(data["requests"]),
                str(data["limited"]),
                str(data["last_remaining"] or "-"),
                f"[{utilization_color}]{utilization_pct:.1f}%[/{utilization_color}]",
            )

        console.print(table)
    else:
        console.print("[yellow]No recent activity (last 5 minutes)[/yellow]")

    console.print()


@app.command("history")
def view_history(
    tenant_id: str = typer.Argument(..., help="Tenant ID"),
    hours: int = typer.Option(24, "--hours", "-h", help="Hours of history"),
    limit: int = typer.Option(50, "--limit", "-l", help="Max events to show"),
    event_type: Optional[str] = typer.Option(None, "--type", "-t", help="Filter by event type"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """
    View rate limit event history for a tenant.

    Shows recent rate limit decisions with timestamps, endpoints, and outcomes.

    Example:
        mekong debug-rate-limits history tenant-123 --hours 24 --limit 100
        mekong debug-rate-limits history tenant-123 --type rate_limited
    """
    from src.db.database import init_database, close_database
    from src.db.tier_config_repository import get_repository

    async def _get_history():
        await init_database()
        repo = get_repository()
        db = repo._db

        query = """
            SELECT
                id, tenant_id, tier, endpoint, preset,
                event_type, quota_limit, quota_remaining,
                quota_utilization_pct, response_status,
                retry_after, created_at
            FROM rate_limit_events
            WHERE tenant_id = $1
              AND created_at > NOW() - INTERVAL '%s hours'
        """ % hours

        params = [tenant_id]

        if event_type:
            query += " AND event_type = $2"
            params.append(event_type)

        query += " ORDER BY created_at DESC LIMIT %s" % limit

        events = await db.fetch_all(query, tuple(params))
        return events

    try:
        events = asyncio.run(_get_history())
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        asyncio.run(close_database())

    if as_json:
        # JSON output
        output = {
            "tenant_id": tenant_id,
            "hours": hours,
            "count": len(events),
            "events": [
                {
                    "timestamp": e["created_at"],
                    "tier": e["tier"],
                    "endpoint": e["endpoint"],
                    "preset": e["preset"],
                    "event_type": e["event_type"],
                    "quota_limit": e["quota_limit"],
                    "quota_remaining": e["quota_remaining"],
                    "response_status": e["response_status"],
                    "retry_after": e["retry_after"],
                }
                for e in events
            ],
        }
        console.print(json.dumps(output, indent=2))
        return

    # Rich table output
    if not events:
        console.print(f"[yellow]No events found for tenant '{tenant_id}' in last {hours}h[/yellow]")
        return

    console.print(Panel(f"[bold cyan]Rate Limit History[/bold cyan]\n[cyan]Tenant:[/cyan] {tenant_id} | [cyan]Period:[/cyan] Last {hours}h | [cyan]Events:[/cyan] {len(events)}", border_style="cyan"))

    table = Table(show_header=True, show_lines=True)
    table.add_column("Time", style="dim", width=19)
    table.add_column("Tier", style="cyan", width=15)
    table.add_column("Endpoint", style="white", width=30)
    table.add_column("Preset", style="yellow", width=15)
    table.add_column("Event", style="green", width=18)
    table.add_column("Status", style="white", width=8)
    table.add_column("Retry", style="red", width=8)

    for event in events:
        event_style = {
            "override_applied": "blue",
            "request_allowed": "green",
            "rate_limited": "red",
        }
        event_color = event_style.get(event["event_type"], "white")

        status_str = str(event["response_status"]) if event["response_status"] else "-"
        retry_str = f"{event['retry_after']}s" if event["retry_after"] else "-"

        table.add_row(
            _format_timestamp(event["created_at"]),
            _format_tier_display(event["tier"]),
            event["endpoint"][:30],
            event["preset"],
            f"[{event_color}]{event['event_type']}[/{event_color}]",
            status_str,
            retry_str,
        )

    console.print(table)
    console.print(f"[dim]Showing {len(events)} events (use --limit to adjust)[/dim]")


@app.command("violations")
def list_violations(
    tenant_id: Optional[str] = typer.Option(None, "--tenant", "-t", help="Filter by tenant ID"),
    hours: int = typer.Option(24, "--hours", "-h", help="Hours of history"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """
    List rate limit violations (429 responses).

    Shows throttled requests with retry_after values and aggregates by endpoint.

    Example:
        mekong debug-rate-limits violations --hours 24
        mekong debug-rate-limits violations --tenant tenant-123
    """
    from src.db.database import init_database, close_database
    from src.db.tier_config_repository import get_repository

    async def _get_violations():
        await init_database()
        repo = get_repository()
        db = repo._db

        # Get individual violations
        where_clause = "WHERE tenant_id = $1" if tenant_id else ""
        tenant_param = (tenant_id,) if tenant_id else ()

        query = f"""
            SELECT
                id, tenant_id, tier, endpoint, preset,
                retry_after, created_at
            FROM rate_limit_events
            {where_clause}
              AND event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            ORDER BY created_at DESC
            LIMIT 100
        """ % hours

        events = await db.fetch_all(query, tenant_param)

        # Get aggregates by tenant
        agg_tenant_query = """
            SELECT tenant_id, COUNT(*) as violations
            FROM rate_limit_events
            WHERE event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            GROUP BY tenant_id
            ORDER BY violations DESC
        """ % hours

        by_tenant = await db.fetch_all(agg_tenant_query)

        # Get aggregates by endpoint
        agg_endpoint_query = f"""
            SELECT endpoint, COUNT(*) as violations
            FROM rate_limit_events
            {where_clause}
              AND event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            GROUP BY endpoint
            ORDER BY violations DESC
            LIMIT 10
        """ % hours

        by_endpoint = await db.fetch_all(agg_endpoint_query, tenant_param)

        total = sum(t["violations"] for t in by_tenant)

        return {
            "events": events,
            "by_tenant": by_tenant,
            "by_endpoint": by_endpoint,
            "total": total,
        }

    try:
        result = asyncio.run(_get_violations())
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        asyncio.run(close_database())

    if as_json:
        # JSON output
        output = {
            "period_hours": hours,
            "total_violations": result["total"],
            "by_tenant": [dict(t) for t in result["by_tenant"]],
            "by_endpoint": [dict(e) for e in result["by_endpoint"]],
            "recent_violations": [
                {
                    "tenant_id": e["tenant_id"],
                    "tier": e["tier"],
                    "endpoint": e["endpoint"],
                    "preset": e["preset"],
                    "retry_after": e["retry_after"],
                    "timestamp": e["created_at"],
                }
                for e in result["events"]
            ],
        }
        console.print(json.dumps(output, indent=2))
        return

    # Summary output
    console.print(Panel(f"[bold red]Rate Limit Violations[/bold red]\n[cyan]Period:[/cyan] Last {hours}h | [cyan]Total:[/cyan] {result['total']} violations", border_style="red"))

    if result["total"] == 0:
        console.print("[green]No violations in this period![/green]")
        return

    # By tenant
    console.print("\n[bold yellow]By Tenant:[/bold yellow]")
    if result["by_tenant"]:
        table = Table(show_header=True)
        table.add_column("Tenant ID", style="cyan")
        table.add_column("Violations", style="red", justify="right")

        for row in result["by_tenant"]:
            table.add_row(row["tenant_id"], str(row["violations"]))

        console.print(table)
    else:
        console.print("[dim]No tenant data[/dim]")

    # By endpoint
    console.print("\n[bold yellow]Top Violated Endpoints:[/bold yellow]")
    if result["by_endpoint"]:
        table = Table(show_header=True)
        table.add_column("Endpoint", style="white")
        table.add_column("Violations", style="red", justify="right")

        for row in result["by_endpoint"]:
            endpoint = row["endpoint"]
            if len(endpoint) > 40:
                endpoint = endpoint[:37] + "..."
            table.add_row(endpoint, str(row["violations"]))

        console.print(table)
    else:
        console.print("[dim]No endpoint data[/dim]")

    # Recent violations
    if result["events"]:
        console.print(f"\n[bold yellow]Recent Violations (Last {len(result['events'])})[/bold yellow]:")
        table = Table(show_header=True, show_lines=True)
        table.add_column("Time", style="dim", width=19)
        table.add_column("Tenant", style="cyan", width=20)
        table.add_column("Endpoint", style="white", width=35)
        table.add_column("Preset", style="yellow", width=15)
        table.add_column("Retry After", style="red", width=12)

        for event in result["events"]:
            table.add_row(
                _format_timestamp(event["created_at"]),
                event["tenant_id"],
                event["endpoint"][:35],
                event["preset"],
                f"{event['retry_after']}s" if event["retry_after"] else "-",
            )

        console.print(table)


@app.command("list-overrides")
def list_overrides(
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """
    List all tenant rate limit overrides.

    Shows custom limits, tier overrides, and expiration dates.

    Example:
        mekong debug-rate-limits list-overrides
    """
    from src.db.tier_config_repository import get_repository
    from src.db.database import init_database, close_database

    async def _get_overrides():
        await init_database()
        repo = get_repository()
        overrides = await repo.get_all_tenant_overrides()
        return overrides

    try:
        overrides = asyncio.run(_get_overrides())
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        asyncio.run(close_database())

    if as_json:
        # JSON output
        output = {
            "count": len(overrides),
            "overrides": [
                {
                    "tenant_id": o.tenant_id,
                    "tier": o.tier,
                    "preset": o.preset,
                    "custom_limit": o.custom_limit,
                    "custom_window": o.custom_window,
                    "expires_at": o.expires_at,
                }
                for o in overrides
            ],
        }
        console.print(json.dumps(output, indent=2))
        return

    # Rich table output
    if not overrides:
        console.print("[yellow]No tenant overrides configured.[/yellow]")
        return

    console.print(Panel(f"[bold cyan]Tenant Rate Limit Overrides[/bold cyan]\n[cyan]Total:[/cyan] {len(overrides)}", border_style="cyan"))

    table = Table(show_header=True, show_lines=True)
    table.add_column("Tenant ID", style="cyan")
    table.add_column("Preset", style="green")
    table.add_column("Custom Limit", style="yellow", justify="right")
    table.add_column("Window (s)", style="magenta", justify="right")
    table.add_column("Tier Override", style="blue")
    table.add_column("Expires", style="red")

    for override in overrides:
        expires = override.expires_at or "Never"
        if expires != "Never":
            expires = _format_timestamp(expires)

        # Highlight expired overrides
        if override.is_expired():
            expires = f"[dim]{expires} (expired)[/dim]"

        table.add_row(
            override.tenant_id,
            override.preset,
            str(override.custom_limit) if override.custom_limit else "-",
            str(override.custom_window),
            override.tier or "-",
            expires,
        )

    console.print(table)


# Export app for main.py registration
__all__ = ["app"]
