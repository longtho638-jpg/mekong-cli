"""
Mekong CLI Status Command - System health & API status
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
import os
import sys
from pathlib import Path

app = typer.Typer(name="status", help="System health & API status")
console = Console()


@app.command()
def system() -> None:
    """Show system health status"""
    from src.core.config import get_config
    from src.core.llm_client import get_client
    from src.core.memory import MemoryStore
    from src.core.governance import Governance

    console.print(
        Panel(
            Text("🏥 Mekong System Health", style="bold cyan"),
            border_style="cyan",
        )
    )

    # Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    console.print(f"[bold]Python:[/bold] {python_version}")

    # Config status
    config = get_config()
    config_status = "✅" if config else "❌"
    console.print(f"[bold]Config:[/bold] {config_status}")

    # LLM Client status
    llm_client = get_client()
    llm_status = "✅" if llm_client and llm_client.is_available else "❌"
    llm_model = llm_client.model if llm_client and llm_client.is_available else "N/A"
    console.print(f"[bold]LLM Client:[/bold] {llm_status} (Model: {llm_model})")

    # Memory status
    try:
        memory = MemoryStore()
        stats = memory.stats()
        console.print(f"[bold]Memory:[/bold] ✅ ({stats['total']} executions)")
    except Exception:
        console.print("[bold]Memory:[/bold] ❌")

    # Governance status
    try:
        gov = Governance()
        is_halted = gov.is_halted()
        status = "🔴 HALTED" if is_halted else "🟢 RUNNING"
        console.print(f"[bold]Governance:[/bold] {status}")
    except Exception:
        console.print("[bold]Governance:[/bold] ❌")


@app.command()
def api() -> None:
    """Check API provider status and quota"""
    from src.core.llm_client import get_client
    from src.core.provider_registry import ProviderRegistry

    console.print(
        Panel(
            Text("🔌 API Provider Status", style="bold green"),
            border_style="green",
        )
    )

    llm_client = get_client()
    if not llm_client or not llm_client.is_available:
        console.print("[red]LLM Client not available[/red]")
        return

    # Provider info
    console.print(f"[bold]Base URL:[/bold] {llm_client.base_url}")
    console.print(f"[bold]Model:[/bold] {llm_client.model}")
    console.print(f"[bold]Status:[/bold] [green]Connected[/green]")

    # Try to get provider quota info
    try:
        registry = ProviderRegistry()
        providers = registry.list_providers()

        table = Table(title="Registered Providers")
        table.add_column("Name", style="cyan")
        table.add_column("Type", style="yellow")
        table.add_column("Status", style="green")

        for provider in providers:
            table.add_row(
                provider.name,
                provider.provider_type,
                "✅ Active" if provider.is_available else "❌ Inactive",
            )

        console.print(table)
    except Exception as e:
        console.print(f"[dim]Provider details: {e}[/dim]")


@app.command()
def quota() -> None:
    """Show API quota and usage limits"""
    from src.core.cost_tracker import CostTracker

    console.print(
        Panel(
            Text("📊 API Quota & Usage", style="bold yellow"),
            border_style="yellow",
        )
    )

    tracker = CostTracker()
    stats = tracker.get_stats()

    table = Table(title="Usage Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Total API Calls", str(stats.get("total_calls", 0)))
    table.add_row("Total Cost", f"${stats.get('total_cost', 0):.4f}")
    table.add_row("Total Tokens", str(stats.get("total_tokens", 0)))
    table.add_row("Cache Hits", str(stats.get("cache_hits", 0)))
    table.add_row("Cache Misses", str(stats.get("cache_misses", 0)))

    console.print(table)

    # Budget info
    if hasattr(tracker, "budget_limit") and tracker.budget_limit:
        remaining = tracker.budget_limit - stats.get("total_cost", 0)
        pct_used = (stats.get("total_cost", 0) / tracker.budget_limit) * 100
        console.print(
            f"\n[bold]Budget:[/bold] ${tracker.budget_limit:.2f} | "
            f"Used: ${stats.get('total_cost', 0):.4f} ({pct_used:.1f}%) | "
            f"Remaining: ${remaining:.2f}"
        )


@app.command()
def health() -> None:
    """Full health check with recommendations"""
    from src.core.config import get_config
    from src.core.llm_client import get_client
    from src.core.memory import MemoryStore
    from src.core.governance import Governance
    from src.core.cost_tracker import CostTracker

    console.print(
        Panel(
            Text("🩺 Full Health Check", style="bold magenta"),
            border_style="magenta",
        )
    )

    issues = []
    recommendations = []

    # Check 1: Config
    config = get_config()
    if not config:
        issues.append("Configuration not found")
        recommendations.append("Run: mekong config init")
    else:
        console.print("[green]✓[/green] Configuration loaded")

    # Check 2: LLM Client
    llm_client = get_client()
    if not llm_client or not llm_client.is_available:
        issues.append("LLM Client not available")
        recommendations.append("Check ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY env vars")
    else:
        console.print(f"[green]✓[/green] LLM Client connected ({llm_client.model})")

    # Check 3: Memory
    try:
        memory = MemoryStore()
        stats = memory.stats()
        console.print(f"[green]✓[/green] Memory store active ({stats['total']} executions)")
    except Exception as e:
        issues.append(f"Memory store error: {e}")
        recommendations.append("Check database connection")

    # Check 4: Governance
    try:
        gov = Governance()
        if gov.is_halted():
            console.print("[yellow]⚠ Governance HALTED - use 'mekong autonomous resume'[/yellow]")
        else:
            console.print("[green]✓[/green] Governance running")
    except Exception as e:
        issues.append(f"Governance error: {e}")

    # Check 5: Cost tracking
    tracker = CostTracker()
    cost_stats = tracker.get_stats()
    total_cost = cost_stats.get("total_cost", 0)
    console.print(f"[green]✓[/green] Cost tracking active (${total_cost:.4f} total)")

    # Summary
    console.print("\n" + "=" * 50)
    if not issues:
        console.print("[bold green]✅ All systems healthy![/bold green]")
    else:
        console.print(f"[bold red]❌ {len(issues)} issue(s) found:[/bold red]")
        for i, issue in enumerate(issues, 1):
            console.print(f"  {i}. {issue}")

        if recommendations:
            console.print("\n[bold yellow]Recommendations:[/bold yellow]")
            for rec in recommendations:
                console.print(f"  • {rec}")


# Main status command (combines all)
@app.command(name="all")
def status_all() -> None:
    """Show complete status (system + api + quota + health)"""
    system()
    console.print("\n")
    api()
    console.print("\n")
    quota()
    console.print("\n")
    health()


def main():
    """Entry point for status subcommands"""
    app()


if __name__ == "__main__":
    app()
