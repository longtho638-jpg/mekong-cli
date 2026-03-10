"""
RaaS Maintenance CLI Command - Phase 6

Interfaces with RaaS Gateway at raas.agencyos.network to perform maintenance operations.

Commands:
    mekong raas-maintenance cache-clear       - Clear cached rate limits and entitlements
    mekong raas-maintenance rate-limit-reset <org_id> - Reset rate limit for organization
    mekong raas-maintenance health            - Check RaaS Gateway health status
    mekong raas-maintenance deep-check        - Deep health check with diagnostic report
    mekong raas-maintenance status            - Show maintenance status

All commands authenticate using mk_ API key via JWT and output structured JSON logs.
"""

import typer
import json
import sys
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional
from datetime import datetime, timezone
import os
from src.raas.sync_client import SyncClient

console = Console()

app = typer.Typer(
    name="raas-maintenance",
    help="🔧 RaaS Gateway maintenance operations",
    rich_markup_mode="rich",
)


@app.command("cache-clear")
def cache_clear(
    cache_type: str = typer.Option(
        "all",
        "--type",
        "-t",
        help="Cache type to clear: all, rate-limits, entitlements, sessions",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        "-n",
        help="Show what would be cleared without sending",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output structured JSON logs",
    ),
) -> None:
    """
    🗑️ Clear cached data from RaaS Gateway.

    Clears cached rate limits, entitlements, or sessions.

    Examples:
        mekong raas-maintenance cache-clear
        mekong raas-maintenance cache-clear -t rate-limits
        mekong raas-maintenance cache-clear -t entitlements --json
    """
    from src.raas.sync_client import get_sync_client
    from src.core.raas_auth import get_auth_client

    result = {
        "command": "cache-clear",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cache_type": cache_type,
        "dry_run": dry_run,
        "success": False,
        "cleared": [],
        "error": None,
    }

    # Authenticate
    auth_client = get_auth_client()
    session = auth_client.get_session()

    if not session.authenticated:
        api_key = os.getenv("RAAS_LICENSE_KEY")
        if not api_key:
            result["error"] = "Not authenticated. Set RAAS_LICENSE_KEY or run 'mekong raas-auth login'"
            _output_result(result, json_output)
            return

    if dry_run:
        result["dry_run"] = True
        result["success"] = True
        result["message"] = f"Would clear cache type: {cache_type}"
        _output_result(result, json_output)
        return

    try:
        client = get_sync_client()
        cleared = []

        # Clear rate limits
        if cache_type in ("all", "rate-limits"):
            if client._clear_rate_limit_cache():
                cleared.append("rate-limits")

        # Clear entitlements cache
        if cache_type in ("all", "entitlements"):
            if client._clear_entitlements_cache():
                cleared.append("entitlements")

        # Clear session cache
        if cache_type in ("all", "sessions"):
            if auth_client.clear_session_cache():
                cleared.append("sessions")

        result["success"] = len(cleared) > 0
        result["cleared"] = cleared
        result["message"] = f"Cleared {len(cleared)} cache type(s)"

    except Exception as e:
        result["error"] = str(e)

    _output_result(result, json_output)


@app.command("rate-limit-reset")
def rate_limit_reset(
    org_id: str = typer.Argument(
        ...,
        help="Organization ID to reset rate limit for",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        "-f",
        help="Force reset even if recently reset",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output structured JSON logs",
    ),
) -> None:
    """
    🔄 Reset rate limit for an organization.

    Resets the rate limit counter for the specified organization.

    Examples:
        mekong raas-maintenance rate-limit-reset org_abc123
        mekong raas-maintenance rate-limit-reset org_abc123 --json
    """
    from src.raas.sync_client import get_sync_client

    result = {
        "command": "rate-limit-reset",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "org_id": org_id,
        "force": force,
        "success": False,
        "rate_limit": None,
        "error": None,
    }

    # Check authentication
    api_key = os.getenv("RAAS_LICENSE_KEY")
    if not api_key:
        result["error"] = "RAAS_LICENSE_KEY not set"
        _output_result(result, json_output)
        return

    try:
        client = get_sync_client()

        # Call gateway to reset rate limit
        response = client._reset_rate_limit(org_id, force=force)

        result["success"] = response.get("success", False)
        result["rate_limit"] = response.get("rate_limit")
        result["message"] = response.get("message", "Rate limit reset successfully")

    except Exception as e:
        result["error"] = str(e)

    _output_result(result, json_output)


@app.command("health")
def health_check(
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output structured JSON logs",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed health information",
    ),
) -> None:
    """
    🏥 Check RaaS Gateway health status.

    Performs comprehensive health check of RaaS Gateway.

    Examples:
        mekong raas-maintenance health
        mekong raas-maintenance health --json
        mekong raas-maintenance health -v
    """
    from src.core.gateway_client import GatewayClient

    result = {
        "command": "health",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gateway_url": "https://raas.agencyos.network",
        "success": False,
        "status": "unknown",
        "checks": {},
        "error": None,
    }

    try:
        client = GatewayClient()

        # Check gateway connectivity
        health_status = client.get_health_status()

        result["success"] = health_status.get("status") == "healthy"
        result["status"] = health_status.get("status", "unknown")
        result["checks"] = health_status.get("checks", {})
        result["latency_ms"] = health_status.get("latency_ms")

        if verbose:
            result["details"] = health_status

        if not json_output:
            _display_health_table(health_status, verbose)
        else:
            _output_result(result, json_output)

    except Exception as e:
        result["error"] = str(e)
        result["status"] = "error"
        _output_result(result, json_output)


@app.command("status")
def maintenance_status(
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output structured JSON logs",
    ),
) -> None:
    """
    📊 Show current maintenance status.

    Displays current status of all maintenance operations.

    Examples:
        mekong raas-maintenance status
        mekong raas-maintenance status --json
    """
    from src.raas.sync_client import get_sync_client
    from src.core.gateway_client import GatewayClient

    result = {
        "command": "status",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "success": True,
        "gateway": {},
        "cache": {},
        "rate_limits": {},
        "error": None,
    }

    try:
        # Get gateway status
        gateway_client = GatewayClient()
        gateway_status = gateway_client.get_circuit_status()
        result["gateway"] = gateway_status

        # Get sync client status
        sync_client = get_sync_client()
        sync_status = sync_client.get_sync_status()
        result["cache"] = {
            "metrics_count": sync_status.get("metrics_count", 0),
            "last_sync": sync_status.get("last_sync"),
        }
        result["rate_limits"] = sync_status.get("circuit_breakers", {})

        if not json_output:
            _display_status_table(result)
        else:
            _output_result(result, json_output)

    except Exception as e:
        result["error"] = str(e)
        result["success"] = False
        _output_result(result, json_output)


@app.command("deep-check")
def deep_health_check(
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output structured JSON logs",
    ),
    output_path: Optional[str] = typer.Option(
        None,
        "--output",
        "-o",
        help="Write results to file path",
    ),
) -> None:
    """
    🔍 Deep health check of entire RaaS infrastructure.

    Performs comprehensive diagnostic check:
    1. Validate connectivity to RaaS Gateway (raas.agencyos.network)
    2. Verify JWT + mk_ API key authentication
    3. Check license key status via License Management
    4. Confirm Stripe/Polar webhook delivery
    5. Check usage metering data consistency in KV storage
    6. Ensure analytics dashboard data pipelines are up-to-date

    Examples:
        mekong raas-maintenance deep-check
        mekong raas-maintenance deep-check --json
        mekong raas-maintenance deep-check -o report.json
    """
    from src.core.gateway_client import GatewayClient
    from src.raas.sync_client import get_sync_client
    from src.core.raas_auth import get_auth_client
    from src.core.kv_store_client import get_kv_client

    result = {
        "command": "deep-check",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gateway_url": "https://raas.agencyos.network",
        "success": False,
        "exit_code": 0,
        "checks": {
            "connectivity": {"status": "pending", "error": None},
            "authentication": {"status": "pending", "error": None, "details": None},
            "license_status": {"status": "pending", "error": None, "details": None},
            "webhook_delivery": {"status": "pending", "error": None, "details": None},
            "kv_usage_metering": {"status": "pending", "error": None, "details": None},
            "analytics_pipeline": {"status": "pending", "error": None, "details": None},
        },
        "summary": {},
        "errors": [],
    }

    all_passed = True

    # Check 1: Gateway Connectivity
    try:
        client = GatewayClient()
        health = client.get_health_status()
        if health.get("status") == "healthy":
            result["checks"]["connectivity"]["status"] = "pass"
            result["checks"]["connectivity"]["details"] = {
                "latency_ms": health.get("latency_ms"),
                "gateway_version": health.get("version"),
            }
        else:
            result["checks"]["connectivity"]["status"] = "fail"
            result["checks"]["connectivity"]["error"] = "Gateway unhealthy"
            all_passed = False
    except Exception as e:
        result["checks"]["connectivity"]["status"] = "fail"
        result["checks"]["connectivity"]["error"] = str(e)
        all_passed = False

    # Check 2: JWT + API Key Authentication
    try:
        auth_client = get_auth_client()
        session = auth_client.get_session()

        if not session.authenticated:
            api_key = os.getenv("RAAS_LICENSE_KEY")
            if api_key:
                validation = auth_client.validate_credentials(api_key)
                if validation.valid:
                    result["checks"]["authentication"]["status"] = "pass"
                    result["checks"]["authentication"]["details"] = {
                        "auth_type": "api_key",
                        "tenant_id": validation.tenant_id,
                    }
                else:
                    result["checks"]["authentication"]["status"] = "fail"
                    result["checks"]["authentication"]["error"] = validation.error
                    all_passed = False
            else:
                result["checks"]["authentication"]["status"] = "fail"
                result["checks"]["authentication"]["error"] = "No API key or session"
                all_passed = False
        else:
            result["checks"]["authentication"]["status"] = "pass"
            result["checks"]["authentication"]["details"] = {
                "auth_type": "jwt_session",
                "tenant_id": session.tenant.tenant_id if session.tenant else None,
                "expires_at": session.expires_at.isoformat() if session.expires_at else None,
            }
    except Exception as e:
        result["checks"]["authentication"]["status"] = "fail"
        result["checks"]["authentication"]["error"] = str(e)
        all_passed = False

    # Check 3: License Status
    try:
        sync_client = get_sync_client()
        entitlements = sync_client.fetch_entitlements()

        if "error" not in entitlements and entitlements.get("tenant_id"):
            result["checks"]["license_status"]["status"] = "pass"
            result["checks"]["license_status"]["details"] = {
                "tenant_id": entitlements.get("tenant_id"),
                "tier": entitlements.get("tier"),
                "features": entitlements.get("features", []),
                "rate_limit": entitlements.get("rate_limit"),
                "expires_at": entitlements.get("expires_at"),
            }
        else:
            result["checks"]["license_status"]["status"] = "fail"
            result["checks"]["license_status"]["error"] = entitlements.get("error", "Invalid license")
            all_passed = False
    except Exception as e:
        result["checks"]["license_status"]["status"] = "fail"
        result["checks"]["license_status"]["error"] = str(e)
        all_passed = False

    # Check 4: Webhook Delivery (Stripe/Polar)
    try:
        sync_client = get_sync_client()
        webhook_status = sync_client.get_webhook_status()

        if webhook_status.get("configured"):
            result["checks"]["webhook_delivery"]["status"] = "pass"
            result["checks"]["webhook_delivery"]["details"] = webhook_status
        else:
            result["checks"]["webhook_delivery"]["status"] = "warn"
            result["checks"]["webhook_delivery"]["error"] = "Webhook not configured"
    except Exception as e:
        result["checks"]["webhook_delivery"]["status"] = "fail"
        result["checks"]["webhook_delivery"]["error"] = str(e)

    # Check 5: KV Usage Metering
    try:
        kv_client = get_kv_client()
        kv_state = kv_client.get_rate_limit_state()
        usage_state = kv_client.get_usage_state()

        if kv_state and usage_state:
            result["checks"]["kv_usage_metering"]["status"] = "pass"
            result["checks"]["kv_usage_metering"]["details"] = {
                "rate_limit_remaining": kv_state.remaining,
                "rate_limit_limit": kv_state.limit,
                "usage_events_cached": usage_state.cached_count,
                "last_sync": usage_state.last_sync,
            }
        else:
            result["checks"]["kv_usage_metering"]["status"] = "warn"
            result["checks"]["kv_usage_metering"]["error"] = "KV state incomplete"
    except Exception as e:
        result["checks"]["kv_usage_metering"]["status"] = "fail"
        result["checks"]["kv_usage_metering"]["error"] = str(e)

    # Check 6: Analytics Pipeline
    try:
        sync_client = get_sync_client()
        analytics_status = sync_client.get_analytics_status()

        if analytics_status.get("healthy"):
            result["checks"]["analytics_pipeline"]["status"] = "pass"
            result["checks"]["analytics_pipeline"]["details"] = {
                "dashboard_url": analytics_status.get("dashboard_url"),
                "last_push": analytics_status.get("last_push"),
                "events_pushed": analytics_status.get("events_pushed"),
            }
        else:
            result["checks"]["analytics_pipeline"]["status"] = "warn"
            result["checks"]["analytics_pipeline"]["error"] = analytics_status.get("error", "Analytics not configured")
    except Exception as e:
        result["checks"]["analytics_pipeline"]["status"] = "fail"
        result["checks"]["analytics_pipeline"]["error"] = str(e)

    # Summary
    passed = sum(1 for c in result["checks"].values() if c["status"] == "pass")
    failed = sum(1 for c in result["checks"].values() if c["status"] == "fail")
    warned = sum(1 for c in result["checks"].values() if c["status"] == "warn")

    result["summary"] = {
        "total_checks": len(result["checks"]),
        "passed": passed,
        "failed": failed,
        "warned": warned,
        "health_score": f"{int((passed / len(result['checks'])) * 100)}%",
    }

    result["success"] = all_passed and failed == 0
    result["exit_code"] = 0 if result["success"] else 1

    # Collect all errors
    for check_name, check_data in result["checks"].items():
        if check_data.get("error"):
            result["errors"].append({
                "check": check_name,
                "error": check_data["error"],
            })

    # Output
    output_text = json.dumps(result, indent=2, default=str)

    if output_path:
        with open(output_path, "w") as f:
            f.write(output_text)
        console.print(f"[dim]Results written to: {output_path}[/dim]\n")

    if json_output:
        print(output_text)
    else:
        _display_deep_check_summary(result)

    # Exit with appropriate code
    if result["exit_code"] != 0:
        sys.exit(result["exit_code"])


def _output_result(result: dict, as_json: bool) -> None:
    """Output result as JSON or rich console."""
    if as_json:
        print(json.dumps(result, indent=2, default=str))
    else:
        if result.get("success"):
            console.print(Panel(
                f"[green]✓ {result.get('message', 'Success')}[/green]\n"
                f"[dim]Command: {result.get('command')}[/dim]",
                title="✅ Success",
                border_style="green",
            ))
        else:
            console.print(Panel(
                f"[red]✗ {result.get('error', 'Failed')}[/red]",
                title="❌ Error",
                border_style="red",
            ))


def _display_health_table(health_status: dict, verbose: bool) -> None:
    """Display health check results in table."""
    status = health_status.get("status", "unknown")
    status_color = "green" if status == "healthy" else "yellow" if status == "degraded" else "red"

    console.print(f"\n[bold {status_color}]RaaS Gateway Health: {status.upper()}[/{status_color}]\n")

    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Check", style="dim")
    table.add_column("Status", style="green")
    table.add_column("Details", style="white")

    checks = health_status.get("checks", {})
    for check_name, check_data in checks.items():
        check_status = check_data.get("status", "unknown")
        check_color = "green" if check_status == "ok" else "red"
        table.add_row(
            check_name,
            f"[{check_color}]{check_status}[/{check_color}]",
            check_data.get("message", ""),
        )

    console.print(table)

    if verbose:
        console.print(f"\n[dim]Latency: {health_status.get('latency_ms', 0):.0f}ms[/dim]")
        console.print(f"[dim]Gateway: {health_status.get('gateway_url', 'N/A')}[/dim]\n")


def _display_status_table(result: dict) -> None:
    """Display maintenance status in table."""
    console.print("\n[bold]RaaS Maintenance Status[/bold]\n")

    # Gateway status
    gateway_table = Table(title="Gateway Status", show_header=False, box=None)
    gateway_table.add_column("Property", style="dim")
    gateway_table.add_column("Value", style="cyan")

    gateway = result.get("gateway", {})
    for key, value in gateway.items():
        gateway_table.add_row(key.replace("_", " ").title(), str(value))

    console.print(gateway_table)

    # Cache status
    cache_table = Table(title="Cache Status", show_header=False, box=None)
    cache_table.add_column("Property", style="dim")
    cache_table.add_column("Value", style="cyan")

    cache = result.get("cache", {})
    cache_table.add_row("Metrics Count", str(cache.get("metrics_count", 0)))
    cache_table.add_row("Last Sync", str(cache.get("last_sync", "Never")))

    console.print(cache_table)

    # Rate limits
    rate_limits = result.get("rate_limits", {})
    if rate_limits:
        console.print("\n[bold]Rate Limit Circuit Breakers:[/bold]")
        for gateway, info in rate_limits.items():
            state = info.get("state", "unknown")
            state_color = {"closed": "green", "half-open": "yellow", "open": "red"}.get(state, "white")
            console.print(f"  {gateway}: [{state_color}]{state}[/{state_color}]")

    console.print()


def _display_deep_check_summary(result: dict) -> None:
    """Display deep health check summary."""
    console.print("\n[bold cyan]🔍 RaaS Infrastructure Deep Health Check[/bold cyan]\n")

    # Overall status
    status_color = "green" if result["success"] else "red"
    status_icon = "✅" if result["success"] else "❌"
    console.print(Panel(
        f"[bold {status_color}]{status_icon} Overall Health: {result['summary']['health_score']}[/bold {status_color}]\n"
        f"Passed: [green]{result['summary']['passed']}[/green] | "
        f"Failed: [red]{result['summary']['failed']}[/red] | "
        f"Warnings: [yellow]{result['summary']['warned']}[/yellow]",
        title="Deep Check Summary",
        border_style=status_color,
    ))
    console.print()

    # Detailed checks table
    table = Table(title="Check Results", show_header=True, header_style="bold cyan")
    table.add_column("Check", style="dim", width=25)
    table.add_column("Status", width=12)
    table.add_column("Details", style="white")

    check_icons = {
        "pass": "✅",
        "fail": "❌",
        "warn": "⚠️",
        "pending": "⏳",
    }

    for check_name, check_data in result["checks"].items():
        status = check_data.get("status", "unknown")
        icon = check_icons.get(status, "❓")
        status_color = {"pass": "green", "fail": "red", "warn": "yellow", "pending": "dim"}.get(status, "white")

        details = []
        if check_data.get("details"):
            details_data = check_data["details"]
            if isinstance(details_data, dict):
                for k, v in details_data.items():
                    if v is not None:
                        details.append(f"{k}: {v}")
            else:
                details.append(str(details_data))

        if check_data.get("error"):
            details.append(f"[dim]{check_data['error']}[/dim]")

        table.add_row(
            check_name.replace("_", " ").title(),
            f"[{status_color}]{icon} {status}[/{status_color}]",
            " | ".join(details) if details else "-",
        )

    console.print(table)

    # Errors section
    if result["errors"]:
        console.print("\n[bold red]⚠️ Errors Detected:[/bold red]\n")
        for err in result["errors"]:
            console.print(f"  • [red]{err['check']}[/red]: {err['error']}")

    console.print()


# Helper methods for SyncClient
def _clear_rate_limit_cache(self) -> bool:
    """Clear rate limit cache."""
    try:
        from src.core.kv_store_client import get_kv_client
        kv_client = get_kv_client()
        kv_client.clear_rate_limit_state()
        return True
    except Exception:
        return False


def _clear_entitlements_cache(self) -> bool:
    """Clear entitlements cache."""
    try:
        self._entitlements_cache = None
        return True
    except Exception:
        return False


def _reset_rate_limit(self, org_id: str, force: bool = False) -> dict:
    """Reset rate limit for organization."""
    try:
        license_key = os.getenv("RAAS_LICENSE_KEY", "")
        response = self.gateway.post(
            "/v1/admin/rate-limit/reset",
            json={
                "org_id": org_id,
                "force": force,
            },
            headers={
                "Authorization": f"Bearer {license_key}",
            },
        )
        return {
            "success": True,
            "rate_limit": response.data.get("rate_limit"),
            "message": "Rate limit reset successfully",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


# Add methods to SyncClient class

if not hasattr(SyncClient, '_clear_rate_limit_cache'):
    SyncClient._clear_rate_limit_cache = _clear_rate_limit_cache
    SyncClient._clear_entitlements_cache = _clear_entitlements_cache
    SyncClient._reset_rate_limit = _reset_rate_limit
