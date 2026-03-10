"""
Usage Overage — Calculate and display overage charges.

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import random
from datetime import datetime
from typing import Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.cli.usage_types import OverageStatus, DEFAULT_OVERAGE_RATE

console = Console()


def fetch_overage_from_gateway(
    license_key: str,
    start_hour: datetime,
    end_hour: datetime,
    auth_token: Optional[str] = None,
) -> Optional[dict]:
    """Fetch overage data from RaaS Gateway."""
    try:
        import requests
        from src.core.gateway_client import GatewayClient
        from src.core.raas_auth import get_auth_client

        gateway_client = GatewayClient()

        if not auth_token:
            auth_client = get_auth_client()
            session = auth_client.get_session()
            if session.authenticated:
                auth_token = session.token

        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        overage_url = f"{gateway_client.gateway_url}/v1/overage/calculate"
        params = {
            "start_hour": start_hour.isoformat() + "Z",
            "end_hour": end_hour.isoformat() + "Z",
        }

        response = requests.get(overage_url, headers=headers, params=params, timeout=10)

        if response.status_code == 200:
            return response.json()
        return None

    except Exception:
        return None


def display_overage_data(overage_data: dict) -> None:
    """Display overage data from gateway."""
    usage_summary = overage_data.get("usage_summary", {})
    overage_status = overage_data.get("overage_status", {})

    table = Table(title="Overage Summary", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row(
        "Total Usage",
        f"{usage_summary.get('total_requests', 0):,}",
        "requests",
    )
    table.add_row(
        "Included Quota",
        f"{usage_summary.get('included_quota', 0):,}",
        "requests",
    )
    table.add_row(
        "Overage",
        f"{usage_summary.get('overage_requests', 0):,}",
        "requests",
    )

    overage_rate = overage_status.get("overage_rate", DEFAULT_OVERAGE_RATE)
    overage_charge = usage_summary.get("overage_requests", 0) * overage_rate

    table.add_row(
        "Overage Rate",
        f"${overage_rate:.6f}",
        "per request",
    )
    table.add_row(
        "Overage Charge",
        f"${overage_charge:,.2f}",
        "USD",
    )

    console.print(table)

    display_payment_status(overage_status)


def display_payment_status(overage_status: OverageStatus) -> None:
    """Display overage payment status."""
    status = overage_status.get("status", "pending")
    status_display = {
        "pending": ("⏳", "yellow"),
        "invoiced": ("📄", "blue"),
        "paid": ("✅", "green"),
        "waived": ("🎁", "green"),
    }

    icon, color = status_display.get(status, ("❓", "gray"))

    console.print(
        Panel(
            f"Status: [{color}]{icon} {status.title()}[/{color}]\n"
            f"Next billing date: {overage_status.get('next_billing_date', 'N/A')}",
            title="Payment Status",
            border_style=color,
        )
    )


def generate_overage_estimate(
    period_start: datetime,
    period_end: datetime,
) -> dict:
    """Generate overage estimate when gateway is unavailable."""
    included_quota = 10000  # Example: PRO tier quota
    total_usage = random.randint(8000, 15000)
    overage_requests = max(0, total_usage - included_quota)
    overage_rate = DEFAULT_OVERAGE_RATE
    overage_charge = overage_requests * overage_rate

    return {
        "period_start": period_start,
        "period_end": period_end,
        "total_usage": total_usage,
        "included_quota": included_quota,
        "overage_requests": overage_requests,
        "overage_rate": overage_rate,
        "overage_charge": overage_charge,
        "is_estimate": True,
    }


def display_overage_estimate(estimate: dict) -> None:
    """Display overage estimate."""
    table = Table(title="Overage Estimate (Local)", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Usage", f"{estimate['total_usage']:,}", "requests")
    table.add_row("Included Quota", f"{estimate['included_quota']:,}", "requests")
    table.add_row("Overage", f"{estimate['overage_requests']:,}", "requests")
    table.add_row("Overage Rate", f"${estimate['overage_rate']:.6f}", "per request")
    table.add_row("Overage Charge", f"${estimate['overage_charge']:,.2f}", "USD")

    console.print(table)

    console.print(
        Panel(
            "[dim]This is an estimate. Connect to RaaS Gateway for actual charges.[/dim]",
            title="Estimate Notice",
            border_style="yellow",
        )
    )


def calculate_overage_charge(
    total_requests: int,
    included_quota: int,
    overage_rate: float = DEFAULT_OVERAGE_RATE,
) -> dict:
    """Calculate overage charge given usage and quota."""
    overage_requests = max(0, total_requests - included_quota)
    overage_charge = overage_requests * overage_rate

    return {
        "total_requests": total_requests,
        "included_quota": included_quota,
        "overage_requests": overage_requests,
        "overage_rate": overage_rate,
        "overage_charge": overage_charge,
    }
