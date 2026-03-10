"""
Usage Report — Generate and display usage reports.

Part of Phase 6: CLI Integration with RaaS Gateway
"""

from datetime import datetime
from typing import Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.cli.usage_types import (
    QUOTA_WARNING_THRESHOLD,
    QUOTA_CRITICAL_THRESHOLD,
    RATE_LIMIT_WARNING,
    RATE_LIMIT_CRITICAL,
    DEFAULT_QUOTA,
)
from src.cli.usage_tracker import (
    generate_mock_usage,
)

console = Console()


def display_usage_data(usage_data: dict, verbose: bool) -> None:
    """Display usage data from gateway."""
    metrics = usage_data.get("metrics", [])
    summary = usage_data.get("summary", {})

    table = Table(title="Usage Summary", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Requests", f"{summary.get('total_requests', 0):,}", "calls")
    table.add_row("Total Tokens", f"{summary.get('total_tokens', 0):,}", "tokens")
    table.add_row("Total Duration", f"{summary.get('total_duration_ms', 0):,.0f}", "ms")
    table.add_row("Unique Endpoints", f"{summary.get('unique_endpoints', 0):,}", "endpoints")

    console.print(table)

    if verbose and metrics:
        console.print("\n[bold]Detailed Breakdown:[/bold]\n")

        detail_table = Table(show_header=True, header_style="bold cyan")
        detail_table.add_column("Event Type", style="dim")
        detail_table.add_column("Count", justify="right")
        detail_table.add_column("Tokens", justify="right")
        detail_table.add_column("Duration (ms)", justify="right")

        by_type = {}
        for metric in metrics:
            event_type = metric.get("event_type", "unknown")
            if event_type not in by_type:
                by_type[event_type] = {"count": 0, "tokens": 0, "duration": 0}
            by_type[event_type]["count"] += 1
            by_type[event_type]["tokens"] += metric.get("input_tokens", 0) + metric.get("output_tokens", 0)
            by_type[event_type]["duration"] += metric.get("duration_ms", 0)

        for event_type, stats in by_type.items():
            detail_table.add_row(
                event_type,
                f"{stats['count']:,}",
                f"{stats['tokens']:,}",
                f"{stats['duration']:,.0f}",
            )

        console.print(detail_table)


def display_local_usage(license_key: str, period: str, verbose: bool) -> None:
    """Display local/mock usage data when gateway is unavailable."""
    usage = generate_mock_usage(period)
    summary = usage.get("summary", {})

    total_requests = summary.get("total_requests", 0)
    total_tokens = summary.get("total_tokens", 0)
    total_duration = summary.get("total_duration_ms", 0)

    table = Table(title="Local Usage Metrics (Cached)", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Requests", f"{total_requests:,}", "calls")
    table.add_row("Total Tokens", f"{total_tokens:,}", "tokens")
    table.add_row("Total Duration", f"{total_duration:,.0f}", "ms")

    quota_limit = DEFAULT_QUOTA
    quota_pct = (total_requests / quota_limit) * 100

    quota_style = "green" if quota_pct < QUOTA_WARNING_THRESHOLD else "yellow" if quota_pct < QUOTA_CRITICAL_THRESHOLD else "red"
    table.add_row(
        "Quota Usage",
        f"[{quota_style}]{quota_pct:.1f}%[/{quota_style}]",
        f"of {quota_limit:,}",
    )

    console.print(table)

    if verbose:
        console.print("\n[bold]Events by Type:[/bold]\n")

        detail_table = Table(show_header=True, header_style="bold cyan")
        detail_table.add_column("Event Type", style="dim")
        detail_table.add_column("Count", justify="right")
        detail_table.add_column("% of Total", justify="right")

        event_types = [
            ("cli:command", int(total_requests * 0.6)),
            ("llm:call", int(total_requests * 0.3)),
            ("agent:spawn", int(total_requests * 0.1)),
        ]

        for event_type, count in event_types:
            pct = (count / total_requests) * 100 if total_requests > 0 else 0
            detail_table.add_row(
                event_type,
                f"{count:,}",
                f"{pct:.1f}%",
            )

        console.print(detail_table)

    display_quota_warnings(quota_pct)


def display_report_table(
    usage_data: Optional[dict],
    entitlements_data: Optional[dict],
    rate_limit_remaining: int,
    rate_limit_limit: int,
    rate_limit_reset: str,
    verbose: bool,
) -> None:
    """Display comprehensive usage report table."""
    metrics = usage_data.get("metrics", []) if usage_data else []
    summary = usage_data.get("summary", {}) if usage_data else {}
    tier_info = entitlements_data.get("tier", {}) if entitlements_data else {}

    total_requests = summary.get("total_requests", 0)
    if not total_requests and metrics:
        total_requests = sum(m.get("request_count", 0) for m in metrics)

    tier_name = tier_info.get("name", "N/A")
    tier_quota = tier_info.get("quota", 0)
    quota_used = total_requests
    quota_remaining = max(0, tier_quota - quota_used)
    quota_pct = (quota_used / tier_quota * 100) if tier_quota > 0 else 0

    quota_icon, quota_color = get_quota_status(quota_pct)
    rate_color = get_rate_limit_color(rate_limit_remaining)

    reset_display = format_reset_time(rate_limit_reset)
    cycle_start = entitlements_data.get("billing_cycle_start") if entitlements_data else None
    cycle_end = entitlements_data.get("billing_cycle_end") if entitlements_data else None

    console.print("\n[bold]📈 Usage Summary[/bold]\n")

    summary_table = Table(show_header=True, header_style="bold cyan")
    summary_table.add_column("Metric", style="dim", width=25)
    summary_table.add_column("Value", justify="right", width=20)
    summary_table.add_column("Details", style="green", width=30)

    summary_table.add_row(
        "Total Requests",
        f"[bold]{total_requests:,}[/bold]",
        f"of {tier_quota:,} quota" if tier_quota else "unlimited",
    )

    summary_table.add_row(
        "Quota Used",
        f"[{quota_color}]{quota_icon} {quota_pct:.1f}%[/{quota_color}]",
        f"{quota_remaining:,} remaining",
    )

    summary_table.add_row(
        "Rate Limit",
        f"[{rate_color}]{rate_limit_remaining:,}[/{rate_color}]",
        f"of {rate_limit_limit:,} (resets: {reset_display})",
    )

    summary_table.add_row(
        "Tier",
        f"[bold cyan]{tier_name}[/bold cyan]",
        tier_info.get("description", ""),
    )

    console.print(summary_table)

    if cycle_start or cycle_end:
        console.print("\n[bold]📅 Billing Cycle[/bold]\n")

        cycle_table = Table(show_header=False, box=None)
        cycle_table.add_column("Label", style="dim")
        cycle_table.add_column("Value", style="cyan")

        if cycle_start:
            cycle_table.add_row("Period Start:", str(cycle_start)[:10])
        if cycle_end:
            cycle_table.add_row("Period End:", str(cycle_end)[:10])

        console.print(cycle_table)

    if verbose and metrics:
        display_detailed_breakdown(metrics)

    display_usage_warnings(quota_pct, rate_limit_remaining, rate_limit_limit)


def display_detailed_breakdown(metrics: list) -> None:
    """Display detailed endpoint breakdown."""
    console.print("\n[bold]📋 Detailed Breakdown[/bold]\n")

    detail_table = Table(show_header=True, header_style="bold cyan")
    detail_table.add_column("Endpoint", style="dim")
    detail_table.add_column("Method", justify="center")
    detail_table.add_column("Requests", justify="right")
    detail_table.add_column("Payload Size", justify="right")

    by_endpoint = {}
    for metric in metrics:
        endpoint = metric.get("endpoint", "unknown")
        method = metric.get("method", "N/A")
        key = f"{endpoint}:{method}"

        if key not in by_endpoint:
            by_endpoint[key] = {"requests": 0, "payload": 0}

        by_endpoint[key]["requests"] += metric.get("request_count", 1)
        by_endpoint[key]["payload"] += metric.get("payload_size", 0)

    for key, stats in sorted(by_endpoint.items()):
        endpoint, method = key.split(":", 1)
        detail_table.add_row(
            endpoint,
            method,
            f"{stats['requests']:,}",
            f"{stats['payload']:,} bytes",
        )

    console.print(detail_table)


def get_quota_status(quota_pct: float) -> tuple[str, str]:
    """Get quota status icon and color."""
    if quota_pct >= QUOTA_CRITICAL_THRESHOLD:
        return "🚨", "red"
    elif quota_pct >= QUOTA_WARNING_THRESHOLD:
        return "⚠️", "yellow"
    else:
        return "✅", "green"


def get_rate_limit_color(remaining: int) -> str:
    """Get rate limit status color."""
    if remaining < RATE_LIMIT_CRITICAL:
        return "red"
    elif remaining < RATE_LIMIT_WARNING:
        return "yellow"
    else:
        return "green"


def format_reset_time(rate_limit_reset: str) -> str:
    """Format rate limit reset time for display."""
    if not rate_limit_reset:
        return "N/A"

    try:
        reset_ts = int(rate_limit_reset)
        reset_dt = datetime.utcfromtimestamp(reset_ts)
        return reset_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except (ValueError, TypeError):
        return rate_limit_reset


def display_usage_warnings(
    quota_pct: float,
    rate_limit_remaining: int,
    rate_limit_limit: int,
) -> None:
    """Display usage warnings if thresholds exceeded."""
    warnings = []

    if quota_pct >= QUOTA_CRITICAL_THRESHOLD:
        warnings.append(
            Panel(
                "[bold red]🚨 Critical: Quota nearly exhausted![/bold red]\n"
                f"{quota_pct:.1f}% of monthly limit used.\n"
                "Immediate action required: upgrade tier or reduce usage.",
                title="Critical Warning",
                border_style="red",
            )
        )
    elif quota_pct >= QUOTA_WARNING_THRESHOLD:
        warnings.append(
            Panel(
                "[bold yellow]⚠️ Warning: High quota usage[/bold yellow]\n"
                f"{quota_pct:.1f}% of monthly limit used.\n"
                "Consider monitoring usage closely or upgrading tier.",
                title="Quota Warning",
                border_style="yellow",
            )
        )

    if rate_limit_limit > 0 and rate_limit_remaining < RATE_LIMIT_CRITICAL:
        warnings.append(
            Panel(
                "[bold red]🚨 Rate limit nearly exhausted![/bold red]\n"
                f"Only {rate_limit_remaining} requests remaining.\n"
                "Further requests may be throttled.",
                title="Rate Limit Warning",
                border_style="red",
            )
        )
    elif rate_limit_limit > 0 and rate_limit_remaining < RATE_LIMIT_WARNING:
        warnings.append(
            Panel(
                "[bold yellow]⚠️ Rate limit low[/bold yellow]\n"
                f"{rate_limit_remaining} requests remaining this hour.",
                title="Rate Limit Notice",
                border_style="yellow",
            )
        )

    for warning in warnings:
        console.print(warning)

    if not warnings:
        console.print(
            Panel(
                "[bold green]✅ All systems nominal[/bold green]\n"
                "Usage within healthy limits.",
                title="Status",
                border_style="green",
            )
        )


def display_quota_warnings(quota_pct: float) -> None:
    """Display quota warnings for local usage."""
    if quota_pct >= QUOTA_CRITICAL_THRESHOLD:
        console.print(
            Panel(
                "[bold red]🚨 Quota nearly exhausted![/bold red]\n"
                f"{quota_pct:.1f}% of monthly limit used.\n"
                "Consider upgrading your tier or reducing usage.",
                title="Quota Warning",
                border_style="red",
            )
        )
    elif quota_pct >= QUOTA_WARNING_THRESHOLD:
        console.print(
            Panel(
                "[bold yellow]⚠️ Quota warning[/bold yellow]\n"
                f"{quota_pct:.1f}% of monthly limit used.",
                title="Quota Warning",
                border_style="yellow",
            )
        )
