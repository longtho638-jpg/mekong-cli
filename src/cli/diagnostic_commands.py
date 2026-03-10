"""
Diagnostic Commands — Phase 6 CLI Integration with RaaS Gateway

Connectivity diagnostics for RaaS Gateway and AgencyOS services.

Commands:
  mekong diagnostic gateway    — Check RaaS Gateway connectivity
  mekong diagnostic auth       — Test credential validation
  mekong diagnostic rate-limit — Test rate limit enforcement
  mekong diagnostic all        — Run full diagnostic suite

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional
import time

console = Console()
app = typer.Typer(
    name="diagnostic",
    help="🔍 Diagnostic connectivity checks",
    rich_markup_mode="rich",
)


@app.command("gateway")
def check_gateway(
    url: Optional[str] = typer.Option(
        None,
        "--url",
        "-u",
        help="Gateway URL to test (default: from env)",
    ),
    timeout: int = typer.Option(
        10,
        "--timeout",
        "-t",
        help="Request timeout in seconds",
    ),
) -> None:
    """
    🌐 Check RaaS Gateway connectivity.

    Tests:
      - DNS resolution
      - HTTPS handshake
      - Health endpoint response
      - Response time measurement

    Examples:
        mekong diagnostic gateway
        mekong diagnostic gateway -u https://raas.agencyos.network
        mekong diagnostic gateway -t 5
    """
    import requests
    from src.core.gateway_client import GATEWAY_URLS

    console.print("[bold cyan]🌐 RaaS Gateway Connectivity Test[/bold cyan]\n")

    # Resolve gateway URL
    gateway_url = url or GATEWAY_URLS[0] or "https://raas.agencyos.network"

    console.print(f"Testing: [cyan]{gateway_url}[/cyan]\n")

    results = {
        "dns_resolution": {"status": "pending", "time_ms": None, "error": None},
        "https_handshake": {"status": "pending", "time_ms": None, "error": None},
        "health_endpoint": {"status": "pending", "time_ms": None, "error": None},
        "response_headers": {"status": "pending", "headers": {}},
    }

    # Test 1: DNS Resolution + HTTPS Handshake
    start_time = time.time()
    try:
        requests.head(
            gateway_url,
            timeout=timeout,
            allow_redirects=True,
        )
        elapsed_ms = (time.time() - start_time) * 1000

        results["dns_resolution"]["status"] = "✅"
        results["dns_resolution"]["time_ms"] = elapsed_ms

        results["https_handshake"]["status"] = "✅"
        results["https_handshake"]["time_ms"] = elapsed_ms

        # Test 2: Health Endpoint
        health_url = f"{gateway_url}/health"
        health_start = time.time()
        try:
            health_response = requests.get(health_url, timeout=timeout)
            health_elapsed = (time.time() - health_start) * 1000

            if health_response.status_code == 200:
                results["health_endpoint"]["status"] = "✅"
                results["health_endpoint"]["time_ms"] = health_elapsed
                results["health_endpoint"]["data"] = health_response.json()
            else:
                results["health_endpoint"]["status"] = "⚠️"
                results["health_endpoint"]["error"] = f"HTTP {health_response.status_code}"

            # Capture response headers
            results["response_headers"]["headers"] = dict(health_response.headers)

        except requests.exceptions.Timeout:
            results["health_endpoint"]["status"] = "❌"
            results["health_endpoint"]["error"] = f"Timeout ({timeout}s)"
        except requests.exceptions.RequestException as e:
            results["health_endpoint"]["status"] = "❌"
            results["health_endpoint"]["error"] = str(e)

    except requests.exceptions.SSLError as e:
        results["https_handshake"]["status"] = "❌"
        results["https_handshake"]["error"] = f"SSL Error: {str(e)}"
        results["dns_resolution"]["status"] = "⚠️"
        results["dns_resolution"]["error"] = "DNS resolved, SSL failed"
    except requests.exceptions.Timeout:
        results["dns_resolution"]["status"] = "❌"
        results["dns_resolution"]["error"] = f"Timeout ({timeout}s)"
    except requests.exceptions.ConnectionError as e:
        results["dns_resolution"]["status"] = "❌"
        results["dns_resolution"]["error"] = f"Connection failed: {str(e)}"
    except Exception as e:
        results["dns_resolution"]["status"] = "❌"
        results["dns_resolution"]["error"] = str(e)

    # Display results
    table = Table(title="Gateway Connectivity Results", show_header=True, header_style="bold cyan")
    table.add_column("Test", style="dim")
    table.add_column("Status", justify="center")
    table.add_column("Time (ms)", justify="right")
    table.add_column("Details")

    for test_name, result in results.items():
        if test_name == "response_headers":
            continue

        status = result.get("status", "?")
        time_ms = result.get("time_ms")
        error = result.get("error", "")

        time_str = f"{time_ms:.1f}" if time_ms else "-"
        details = error if error else (result.get("data", {}) or "OK")

        table.add_row(
            test_name.replace("_", " ").title(),
            status,
            time_str,
            str(details)[:50],
        )

    console.print(table)

    # Show rate limit headers if available
    headers = results["response_headers"].get("headers", {})
    rate_limit_headers = {
        k: v for k, v in headers.items()
        if k.lower().startswith("x-ratelimit") or k.lower() == "retry-after"
    }

    if rate_limit_headers:
        console.print("\n[bold]Rate Limit Headers:[/bold]")
        rate_table = Table(show_header=False, box=None)
        rate_table.add_column("Header", style="dim")
        rate_table.add_column("Value", style="green")

        for header, value in rate_limit_headers.items():
            rate_table.add_row(header, value)

        console.print(rate_table)

    # Overall status
    all_passed = all(
        results[test]["status"] == "✅"
        for test in ["dns_resolution", "https_handshake", "health_endpoint"]
    )

    if all_passed:
        console.print(
            Panel(
                "[bold green]✅ Gateway is healthy and reachable![/bold green]",
                title="Overall Status",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                "[bold red]❌ Gateway connectivity issues detected[/bold red]",
                title="Overall Status",
                border_style="red",
            )
        )


@app.command("auth")
def check_auth(
    token: Optional[str] = typer.Option(
        None,
        "--token",
        "-t",
        help="Token to test (defaults to stored credentials)",
    ),
    gateway_url: Optional[str] = typer.Option(
        None,
        "--gateway",
        "-g",
        help="Gateway URL to test against",
    ),
) -> None:
    """
    🔐 Test credential validation against RaaS Gateway.

    Validates stored credentials or provided token.

    Examples:
        mekong diagnostic auth
        mekong diagnostic auth -t mk_abc123
        mekong diagnostic auth -g https://raas.agencyos.network
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]🔐 Credential Validation Test[/bold cyan]\n")

    client = RaaSAuthClient(gateway_url=gateway_url)

    # Get token to test
    if not token:
        session = client.get_session()
        if session.authenticated:
            token = session.token
        else:
            import os
            token = os.getenv("RAAS_LICENSE_KEY")

    if not token:
        console.print("[yellow]No credentials found.[/yellow]")
        console.print("Set RAAS_LICENSE_KEY env var or login: [bold]mekong auth login[/bold]\n")
        return

    # Test validation
    console.print(f"Testing token: [cyan]{token[:8]}...{token[-4:] if len(token) > 4 else ''}[/cyan]\n")

    start_time = time.time()
    result = client.validate_credentials(token)
    elapsed_ms = (time.time() - start_time) * 1000

    # Display results
    table = Table(title="Validation Result", show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value")

    status = "[green]✅ Valid[/green]" if result.valid else "[red]❌ Invalid[/red]"
    table.add_row("Status", status)
    table.add_row("Response Time", f"{elapsed_ms:.1f} ms")

    if result.valid and result.tenant:
        table.add_row("Tenant ID", result.tenant.tenant_id)
        table.add_row("Tier", result.tenant.tier.upper())
        table.add_row("Role", result.tenant.role)

        if result.tenant.features:
            table.add_row("Features", f"{len(result.tenant.features)} enabled")

        console.print(table)

        console.print(
            Panel(
                f"[bold green]✅ Credentials are valid![/bold green]\n"
                f"Gateway: {client.gateway_url}",
                title="Auth Status",
                border_style="green",
            )
        )
    else:
        console.print(table)
        console.print(
            Panel(
                f"[bold red]❌ Validation Failed[/bold red]\n"
                f"Error: {result.error}\n"
                f"Code: {result.error_code}",
                title="Auth Status",
                border_style="red",
            )
        )


@app.command("rate-limit")
def check_rate_limit(
    gateway_url: Optional[str] = typer.Option(
        None,
        "--gateway",
        "-g",
        help="Gateway URL to test",
    ),
    num_requests: int = typer.Option(
        5,
        "--requests",
        "-n",
        help="Number of requests to send",
    ),
) -> None:
    """
    🚦 Test rate limit enforcement.

    Sends multiple requests to observe rate limit headers.

    Examples:
        mekong diagnostic rate-limit
        mekong diagnostic rate-limit -n 10

    Args:
        gateway_url: Gateway URL to test
        num_requests: Number of requests to send (1-20)
    """
    # Validate num_requests
    if num_requests < 1:
        console.print("[red]Error: --requests must be at least 1[/red]\n")
        raise typer.Exit(1)
    if num_requests > 20:
        console.print("[red]Error: --requests cannot exceed 20[/red]\n")
        raise typer.Exit(1)
    import requests
    from src.core.raas_auth import RaaSAuthClient
    from src.core.gateway_client import GATEWAY_URLS

    console.print("[bold cyan]🚦 Rate Limit Enforcement Test[/bold cyan]\n")

    url = gateway_url or GATEWAY_URLS[0] or "https://raas.agencyos.network"
    test_endpoint = f"{url}/health"

    console.print(f"Testing: [cyan]{test_endpoint}[/cyan]")
    console.print(f"Requests: [cyan]{num_requests}[/cyan]\n")

    # Get auth header if available
    client = RaaSAuthClient(gateway_url=url)
    session = client.get_session()
    headers = {}
    if session.authenticated:
        headers["Authorization"] = f"Bearer {session.token}"
    else:
        import os
        token = os.getenv("RAAS_LICENSE_KEY")
        if token:
            headers["Authorization"] = f"Bearer {token}"

    results = []
    rate_limit_headers = {}

    for i in range(num_requests):
        try:
            start = time.time()
            response = requests.get(test_endpoint, headers=headers, timeout=10)
            elapsed = (time.time() - start) * 1000

            result = {
                "request": i + 1,
                "status": response.status_code,
                "time_ms": elapsed,
                "rate_limit_remaining": response.headers.get("X-RateLimit-Remaining"),
                "rate_limit_limit": response.headers.get("X-RateLimit-Limit"),
                "rate_limit_reset": response.headers.get("X-RateLimit-Reset"),
                "retry_after": response.headers.get("Retry-After"),
            }
            results.append(result)

            # Capture last rate limit headers
            rate_limit_headers = {
                "X-RateLimit-Limit": response.headers.get("X-RateLimit-Limit"),
                "X-RateLimit-Remaining": response.headers.get("X-RateLimit-Remaining"),
                "X-RateLimit-Reset": response.headers.get("X-RateLimit-Reset"),
            }

        except Exception as e:
            results.append({
                "request": i + 1,
                "status": "ERROR",
                "time_ms": None,
                "error": str(e),
            })

    # Display results
    table = Table(title="Rate Limit Test Results", show_header=True, header_style="bold cyan")
    table.add_column("#", justify="right")
    table.add_column("Status", justify="center")
    table.add_column("Time (ms)", justify="right")
    table.add_column("Remaining", justify="right")
    table.add_column("Limit", justify="right")

    for result in results:
        status = str(result["status"])
        status_display = (
            f"[green]{status}[/green]" if status == "200" else
            f"[yellow]{status}[/yellow]" if status == "429" else
            f"[red]{status}[/red]" if status == "ERROR" else
            status
        )

        table.add_row(
            str(result["request"]),
            status_display,
            f"{result['time_ms']:.1f}" if result.get("time_ms") else "-",
            str(result.get("rate_limit_remaining", "-")),
            str(result.get("rate_limit_limit", "-")),
        )

    console.print(table)

    # Show rate limit info
    if rate_limit_headers.get("X-RateLimit-Limit"):
        console.print("\n[bold]Rate Limit Configuration:[/bold]")
        rate_table = Table(show_header=False, box=None)
        rate_table.add_column("Header", style="dim")
        rate_table.add_column("Value", style="cyan")

        for header, value in rate_limit_headers.items():
            if value:
                rate_table.add_row(header, value)

        console.print(rate_table)

        # Interpret rate limit status
        remaining = int(rate_limit_headers.get("X-RateLimit-Remaining", 0) or 0)
        limit = int(rate_limit_headers.get("X-RateLimit-Limit", 0) or 0)

        if remaining == 0:
            console.print(
                Panel(
                    "[bold red]🛑 Rate limit EXHAUSTED![/bold red]\n"
                    f"Wait until reset: {rate_limit_headers.get('X-RateLimit-Reset', 'unknown')}",
                    title="Rate Limit Status",
                    border_style="red",
                )
            )
        elif remaining < limit * 0.2:
            console.print(
                Panel(
                    "[bold yellow]⚠️ Rate limit nearly exhausted[/bold yellow]\n"
                    f"{remaining}/{limit} requests remaining",
                    title="Rate Limit Status",
                    border_style="yellow",
                )
            )
        else:
            console.print(
                Panel(
                    f"[bold green]✅ Rate limit healthy[/bold green]\n"
                    f"{remaining}/{limit} requests remaining",
                    title="Rate Limit Status",
                    border_style="green",
                )
            )


@app.command("all")
def run_all_diagnostics(
    gateway_url: Optional[str] = typer.Option(
        None,
        "--gateway",
        "-g",
        help="Gateway URL to test",
    ),
    output: Optional[str] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output path for JSON report",
    ),
) -> None:
    """
    📋 Run full diagnostic suite.

    Executes all diagnostic tests and generates a report.

    Examples:
        mekong diagnostic all
        mekong diagnostic all -o diagnostic-report.json
    """
    console.print("[bold cyan]📋 Full Diagnostic Suite[/bold cyan]\n")
    console.print("Running: Gateway → Auth → Rate Limit\n")
    console.print("=" * 60)

    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "gateway_url": gateway_url,
        "tests": {},
        "overall_status": "healthy",
    }

    # Test 1: Gateway
    console.print("\n[bold]1/3: Gateway Connectivity[/bold]\n")
    try:
        check_gateway_impl(gateway_url=gateway_url)
        results["tests"]["gateway"] = {"status": "passed"}
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}\n")
        results["tests"]["gateway"] = {"status": "failed", "error": str(e)}
        results["overall_status"] = "degraded"

    console.print("\n" + "=" * 60)

    # Test 2: Auth
    console.print("\n[bold]2/3: Credential Validation[/bold]\n")
    try:
        check_auth_impl(gateway_url=gateway_url)
        results["tests"]["auth"] = {"status": "passed"}
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}\n")
        results["tests"]["auth"] = {"status": "failed", "error": str(e)}
        results["overall_status"] = "degraded"

    console.print("\n" + "=" * 60)

    # Test 3: Rate Limit
    console.print("\n[bold]3/3: Rate Limit Enforcement[/bold]\n")
    try:
        check_rate_limit_impl(gateway_url=gateway_url, num_requests=3)
        results["tests"]["rate_limit"] = {"status": "passed"}
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}\n")
        results["tests"]["rate_limit"] = {"status": "failed", "error": str(e)}
        results["overall_status"] = "degraded"

    console.print("\n" + "=" * 60)

    # Overall summary
    console.print("\n[bold]📊 Diagnostic Summary[/bold]\n")

    summary_table = Table(show_header=True, header_style="bold cyan")
    summary_table.add_column("Test", style="dim")
    summary_table.add_column("Status", justify="center")

    for test_name, test_result in results["tests"].items():
        status = "✅" if test_result["status"] == "passed" else "❌"
        summary_table.add_row(test_name.title(), status)

    console.print(summary_table)

    # Overall status
    if results["overall_status"] == "healthy":
        console.print(
            Panel(
                "[bold green]✅ All diagnostics passed![/bold green]\n"
                "Your RaaS Gateway connection is healthy.",
                title="Overall Status",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                "[bold yellow]⚠️ Some diagnostics failed[/bold yellow]\n"
                "Review the results above for details.",
                title="Overall Status",
                border_style="yellow",
            )
        )

    # Export to JSON if requested
    if output:
        import json
        from pathlib import Path

        output_path = Path(output)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

        console.print(f"\n[green]✓ Report exported to:[/green] {output_path}\n")


# Internal functions for reuse
def check_gateway_impl(url: Optional[str] = None, timeout: int = 10) -> None:
    """Internal implementation for reuse in 'all' command."""
    check_gateway(url=url, timeout=timeout)


def check_auth_impl(token: Optional[str] = None, gateway_url: Optional[str] = None) -> None:
    """Internal implementation for reuse in 'all' command."""
    check_auth(token=token, gateway_url=gateway_url)


def check_rate_limit_impl(
    gateway_url: Optional[str] = None,
    num_requests: int = 3,
) -> None:
    """Internal implementation for reuse in 'all' command."""
    check_rate_limit(gateway_url=gateway_url, num_requests=num_requests)
