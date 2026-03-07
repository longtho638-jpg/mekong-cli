"""
RaaS Gateway Synchronization Command — ROIaaS Phase 5
=====================================================

Command for integrating with the live RaaS Gateway at raas.agencyos.network.

Features:
1. Validate local RAAS_LICENSE_KEY against gateway's JWT+mk_ API key auth endpoint
2. Register CLI instance as a licensed client
3. Enable usage metering by emitting authenticated POST requests
4. Display real-time analytics from AgencyOS dashboard
"""

import os
import time
import json
import requests
from typing import Optional, Dict
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.console import Group
from pathlib import Path

console = Console()
app = typer.Typer()

# RaaS Gateway Configuration
RAAS_GATEWAY_BASE_URL = "https://raas.agencyos.network"
AUTH_ENDPOINT = f"{RAAS_GATEWAY_BASE_URL}/auth/validate"
REGISTER_ENDPOINT = f"{RAAS_GATEWAY_BASE_URL}/license/register"
USAGE_ENDPOINT = f"{RAAS_GATEWAY_BASE_URL}/usage"
ANALYTICS_ENDPOINT = f"{RAAS_GATEWAY_BASE_URL}/analytics/dashboard"

# Rate Limiting Configuration (Cloudflare Worker v2.0.0 compliance)
RATE_LIMIT_DELAY = 1.0  # seconds between requests
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds between retries

# Cache Configuration
CACHE_DIR = Path.home() / ".mekong" / "cache"
CACHE_FILE = CACHE_DIR / "raas_analytics_cache.json"
CACHE_TTL = 300  # 5 minutes in seconds


def get_license_key() -> str:
    """Get RAAS_LICENSE_KEY from environment variables."""
    license_key = os.getenv("RAAS_LICENSE_KEY")
    if not license_key:
        console.print(
            Panel(
                "[bold red]Error: RAAS_LICENSE_KEY environment variable not found[/bold red]\n\n"
                "Please set your license key using:\n"
                "  export RAAS_LICENSE_KEY=your_license_key_here",
                title="❌ Missing License Key",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)
    return license_key


def validate_license(license_key: str) -> bool:
    """Validate license key against RaaS Gateway auth endpoint."""
    try:
        headers = {"Authorization": f"Bearer {license_key}"}
        response = requests.get(AUTH_ENDPOINT, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data.get("valid"):
                console.print(
                    Panel(
                        "[bold green]✓ License key validated successfully[/bold green]\n\n"
                        f"[dim]Key ID: {data.get('key_id', 'N/A')}[/dim]\n"
                        f"[dim]Tier: {data.get('tier', 'N/A')}[/dim]\n"
                        f"[dim]Status: {data.get('status', 'N/A')}[/dim]",
                        title="✅ License Validation",
                        border_style="green",
                    )
                )
                return True
            else:
                console.print(
                    Panel(
                        "[bold red]✗ Invalid license key[/bold red]\n\n"
                        f"[dim]Reason: {data.get('reason', 'Unknown')}[/dim]",
                        title="❌ License Validation",
                        border_style="red",
                    )
                )
                return False
        else:
            console.print(
                Panel(
                    f"[bold red]✗ API Error: {response.status_code}[/bold red]\n\n"
                    f"[dim]{response.text}[/dim]",
                    title="❌ Validation Error",
                    border_style="red",
                )
            )
            return False
    except requests.exceptions.RequestException as e:
        console.print(
            Panel(
                f"[bold red]✗ Connection Error[/bold red]\n\n"
                f"[dim]{str(e)}[/dim]",
                title="❌ Network Error",
                border_style="red",
            )
        )
        return False


def register_cli_instance(license_key: str) -> bool:
    """Register CLI instance as a licensed client."""
    try:
        headers = {
            "Authorization": f"Bearer {license_key}",
            "Content-Type": "application/json",
        }
        data = {
            "client_type": "cli",
            "client_version": "2.1.33",  # TODO: Get from package.json
            "platform": os.name,
        }

        response = requests.post(REGISTER_ENDPOINT, headers=headers, json=data, timeout=10)

        if response.status_code == 200:
            data = response.json()
            console.print(
                Panel(
                    "[bold green]✓ CLI instance registered successfully[/bold green]\n\n"
                    f"[dim]Client ID: {data.get('client_id', 'N/A')}[/dim]\n"
                    f"[dim]Status: {data.get('status', 'N/A')}[/dim]",
                    title="✅ CLI Registration",
                    border_style="green",
                )
            )
            return True
        else:
            console.print(
                Panel(
                    f"[bold red]✗ Registration Error: {response.status_code}[/bold red]\n\n"
                    f"[dim]{response.text}[/dim]",
                    title="❌ Registration Failed",
                    border_style="red",
                )
            )
            return False
    except requests.exceptions.RequestException as e:
        console.print(
            Panel(
                f"[bold red]✗ Connection Error[/bold red]\n\n"
                f"[dim]{str(e)}[/dim]",
                title="❌ Network Error",
                border_style="red",
            )
        )
        return False


def track_usage(license_key: str, command_name: str, project_id: Optional[str] = None) -> bool:
    """Track command usage by emitting authenticated POST request."""
    try:
        headers = {
            "Authorization": f"Bearer {license_key}",
            "Content-Type": "application/json",
        }
        data = {
            "command": command_name,
            "timestamp": int(time.time()),
            "project_id": project_id,
            "client_version": "2.1.33",
        }

        response = requests.post(USAGE_ENDPOINT, headers=headers, json=data, timeout=10)

        if response.status_code == 200:
            return True
        else:
            console.print(
                Panel(
                    f"[bold yellow]⚠️ Usage Tracking Failed: {response.status_code}[/bold yellow]\n\n"
                    f"[dim]{response.text}[/dim]",
                    title="⚠️ Usage Tracking",
                    border_style="yellow",
                )
            )
            return False
    except requests.exceptions.RequestException as e:
        console.print(
            Panel(
                f"[bold yellow]⚠️ Usage Tracking Connection Error[/bold yellow]\n\n"
                f"[dim]{str(e)}[/dim]",
                title="⚠️ Network Error",
                border_style="yellow",
            )
        )
        return False


def _get_cache() -> Optional[Dict]:
    """Get cached analytics data if it's still valid."""
    if not CACHE_FILE.exists():
        return None

    try:
        with open(CACHE_FILE, "r") as f:
            cache_data = json.load(f)

        timestamp = cache_data.get("timestamp", 0)
        if time.time() - timestamp > CACHE_TTL:
            # Cache expired
            os.remove(CACHE_FILE)
            return None

        return cache_data.get("data")
    except Exception as e:
        console.print(
            Panel(
                f"[bold yellow]⚠️ Cache Error: {str(e)}[/bold yellow]\n\n"
                "Will fetch fresh data from API.",
                title="⚠️ Cache Error",
                border_style="yellow",
            )
        )
        return None


def _save_cache(data: Dict):
    """Save analytics data to cache."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cache_data = {
        "timestamp": int(time.time()),
        "data": data
    }

    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f)
    except Exception as e:
        console.print(
            Panel(
                f"[bold yellow]⚠️ Cache Save Error: {str(e)}[/bold yellow]\n\n"
                "Data will not be cached.",
                title="⚠️ Cache Error",
                border_style="yellow",
            )
        )


def fetch_analytics(license_key: str, use_cache: bool = True) -> Optional[dict]:
    """Fetch real-time analytics from RaaS Analytics dashboard API with caching."""
    # Try to get from cache first
    if use_cache:
        cached_data = _get_cache()
        if cached_data:
            console.print(
                Panel(
                    "[bold blue]📊 Using cached analytics data[/bold blue]\n\n"
                    "Data will be refreshed in 5 minutes.",
                    title="✅ Cached Data",
                    border_style="blue",
                )
            )
            return cached_data

    try:
        headers = {"Authorization": f"Bearer {license_key}"}
        response = requests.get(ANALYTICS_ENDPOINT, headers=headers, timeout=10)

        # Handle rate limiting
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", "60")
            console.print(
                Panel(
                    f"[bold yellow]⚠️ Rate Limited[/bold yellow]\n\n"
                    f"Please retry after {retry_after} seconds.",
                    title="⚠️ Rate Limiting",
                    border_style="yellow",
                )
            )
            return None

        if response.status_code == 200:
            data = response.json()
            _save_cache(data)
            return data
        else:
            console.print(
                Panel(
                    f"[bold yellow]⚠️ Analytics Fetch Failed: {response.status_code}[/bold yellow]\n\n"
                    f"[dim]{response.text}[/dim]",
                    title="⚠️ Analytics Error",
                    border_style="yellow",
                )
            )
            return None
    except requests.exceptions.RequestException as e:
        console.print(
            Panel(
                f"[bold yellow]⚠️ Analytics Connection Error[/bold yellow]\n\n"
                f"[dim]{str(e)}[/dim]",
                title="⚠️ Network Error",
                border_style="yellow",
            )
        )
        return None


def display_analytics(analytics: dict):
    """Display detailed analytics in formatted tables with key metrics."""
    console.print("\n[bold blue]📊 RaaS Gateway Analytics Dashboard[/bold blue]")

    # Usage Metrics Table
    if "usage" in analytics:
        usage = analytics["usage"]
        usage_table = Table(show_header=True, header_style="bold green")
        usage_table.add_column("Metric", style="dim")
        usage_table.add_column("Value")

        if "total_commands" in usage:
            usage_table.add_row("Total Commands", str(usage["total_commands"]))
        if "commands_today" in usage:
            usage_table.add_row("Commands Today", str(usage["commands_today"]))
        if "commands_this_month" in usage:
            usage_table.add_row("Commands This Month", str(usage["commands_this_month"]))
        if "avg_commands_per_day" in usage:
            usage_table.add_row("Avg Commands/Day", f"{usage['avg_commands_per_day']:.1f}")
        if "daily_active_users" in usage:
            usage_table.add_row("Daily Active Users (DAU)", str(usage["daily_active_users"]))
        if "monthly_active_users" in usage:
            usage_table.add_row("Monthly Active Users (MAU)", str(usage["monthly_active_users"]))
        if "unique_projects" in usage:
            usage_table.add_row("Unique Projects", str(usage["unique_projects"]))

        console.print(usage_table)

    # Quota Consumption Table
    if "quota" in analytics:
        quota = analytics["quota"]
        quota_table = Table(show_header=True, header_style="bold blue")
        quota_table.add_column("Resource", style="dim")
        quota_table.add_column("Used")
        quota_table.add_column("Total")
        quota_table.add_column("Remaining")
        quota_table.add_column("Usage %")

        if "commands" in quota:
            used = quota["commands"].get("used", 0)
            total = quota["commands"].get("total", 0)
            remaining = total - used
            percent = (used / total) * 100 if total > 0 else 0
            quota_table.add_row(
                "Commands", str(used), str(total), str(remaining), f"{percent:.1f}%"
            )
        if "api_calls" in quota:
            used = quota["api_calls"].get("used", 0)
            total = quota["api_calls"].get("total", 0)
            remaining = total - used
            percent = (used / total) * 100 if total > 0 else 0
            quota_table.add_row(
                "API Calls", str(used), str(total), str(remaining), f"{percent:.1f}%"
            )
        if "storage" in quota:
            used = quota["storage"].get("used", 0)
            total = quota["storage"].get("total", 0)
            remaining = total - used
            percent = (used / total) * 100 if total > 0 else 0
            quota_table.add_row(
                "Storage (MB)", str(used), str(total), str(remaining), f"{percent:.1f}%"
            )
        if "email_sends" in quota:
            used = quota["email_sends"].get("used", 0)
            total = quota["email_sends"].get("total", 0)
            remaining = total - used
            percent = (used / total) * 100 if total > 0 else 0
            quota_table.add_row(
                "Email Sends", str(used), str(total), str(remaining), f"{percent:.1f}%"
            )

        console.print("\n[bold blue]📊 Quota Consumption[/bold blue]")
        console.print(quota_table)

    # Feature Usage Table
    if "features" in analytics:
        features = analytics["features"]
        if features:
            console.print("\n[bold blue]🎯 Feature Usage[/bold blue]")
            feature_table = Table(show_header=True, header_style="bold purple")
            feature_table.add_column("Feature")
            feature_table.add_column("Usage Count")
            feature_table.add_column("Usage %")

            total = sum(feature["count"] for feature in features)

            for feature in sorted(features, key=lambda x: x["count"], reverse=True)[:10]:  # Top 10 features
                percent = (feature["count"] / total) * 100 if total > 0 else 0
                feature_table.add_row(
                    feature.get("name", "Unknown"),
                    str(feature.get("count", 0)),
                    f"{percent:.1f}%"
                )

            console.print(feature_table)

    # Active Projects Table
    if "projects" in analytics:
        projects = analytics["projects"]
        if projects:
            console.print("\n[bold blue]📁 Active Projects[/bold blue]")
            project_table = Table(show_header=True, header_style="bold green")
            project_table.add_column("Project ID")
            project_table.add_column("Name")
            project_table.add_column("Commands")
            project_table.add_column("Last Activity")

            for project in projects[:5]:  # Show first 5 projects
                project_table.add_row(
                    project.get("id", "N/A"),
                    project.get("name", "N/A"),
                    str(project.get("command_count", 0)),
                    project.get("last_activity", "N/A")
                )

            console.print(project_table)


@app.command()
def sync(
    project_id: Optional[str] = typer.Option(None, "--project-id", "-p", help="Project ID for tracking"),
    force: bool = typer.Option(False, "--force", "-f", help="Force synchronization"),
    no_cache: bool = typer.Option(False, "--no-cache", "-n", help="Bypass local cache and fetch fresh data"),
) -> None:
    """
    Synchronize with RaaS Gateway at raas.agencyos.network.

    Performs license validation, CLI registration, usage tracking, and analytics fetch.
    """
    console.print(
        Panel(
            "[bold blue]🚀 Starting RaaS Gateway Synchronization[/bold blue]\n\n"
            "This process will validate your license, register your CLI instance,\n"
            "and fetch real-time analytics from the RaaS Gateway.",
            title="RaaS Synchronization",
            border_style="blue",
        )
    )

    # Get license key
    license_key = get_license_key()

    # Step 1: Validate license
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Validating license key...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        is_valid = validate_license(license_key)
        progress.update(task, completed=1)

    if not is_valid:
        raise typer.Exit(code=1)

    # Step 2: Register CLI instance
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Registering CLI instance...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        is_registered = register_cli_instance(license_key)
        progress.update(task, completed=1)

    if not is_registered and not force:
        raise typer.Exit(code=1)

    # Step 3: Track usage
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Tracking usage...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        track_usage(license_key, "sync-raas", project_id)
        progress.update(task, completed=1)

    # Step 4: Fetch and display analytics
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Fetching analytics...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        analytics = fetch_analytics(license_key, use_cache=not no_cache)
        progress.update(task, completed=1)

    if analytics:
        display_analytics(analytics)

    # Summary
    console.print(
        Panel(
            "[bold green]✅ RaaS Gateway synchronization complete[/bold green]\n\n"
            "Your CLI is now connected to the live RaaS Gateway.\n"
            "Usage data is being tracked and analytics are available.",
            title="✅ Synchronization Complete",
            border_style="green",
        )
    )


@app.command()
def validate_only() -> None:
    """Only validate the license key without other operations."""
    console.print(
        Panel(
            "[bold blue]🔑 License Validation Only[/bold blue]\n\n"
            "This will only validate your RAAS_LICENSE_KEY.",
            title="License Validation",
            border_style="blue",
        )
    )

    license_key = get_license_key()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Validating license key...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        is_valid = validate_license(license_key)
        progress.update(task, completed=1)

    if not is_valid:
        raise typer.Exit(code=1)


@app.command()
def analytics(
    no_cache: bool = typer.Option(False, "--no-cache", "-n", help="Bypass local cache and fetch fresh data"),
) -> None:
    """Only fetch and display real-time analytics."""
    console.print(
        Panel(
            "[bold blue]📊 Real-Time Analytics[/bold blue]\n\n"
            "This will fetch and display your RaaS usage analytics.",
            title="Analytics",
            border_style="blue",
        )
    )

    license_key = get_license_key()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Fetching analytics...", total=1)
        time.sleep(RATE_LIMIT_DELAY)
        analytics = fetch_analytics(license_key, use_cache=not no_cache)
        progress.update(task, completed=1)

    if analytics:
        display_analytics(analytics)
    else:
        raise typer.Exit(code=1)
