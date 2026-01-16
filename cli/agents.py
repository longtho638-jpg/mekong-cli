import typer
from rich.console import Console
from core.constants import APP_NAME, AGENTS_CORE, AGENTS_MEKONG

console = Console()

def run_scout_cmd(feature: str = typer.Argument(..., help="Feature to analyze")):
    """
    Run Scout Agent to analyze a feature (for testing).
    """
    console.print("\n[bold blue]🔍 Running Scout Agent...[/bold blue]")
    console.print(f"   Feature: {feature}")

    console.print("\n   [cyan]Scout would:[/cyan]")
    console.print("   • Analyze git commits related to feature")
    console.print("   • Scan Product Hunt via Playwright MCP")
    console.print("   • Scan Reddit via Fetch MCP")
    console.print("   • Generate summary via OpenRouter (fast tier)")
    console.print("\n   [yellow]Note: Full execution requires backend running[/yellow]")

def agents_cmd():
    """
    Show AI agents status and activity.
    """
    console.print(f"\n[bold blue]🤖 {APP_NAME} AI Agents[/bold blue]\n")

    console.print("   [cyan]Quad-Agent System:[/cyan]")
    for agent in AGENTS_CORE:
        console.print(f"      {agent['icon']} {agent['name']}: {agent['role']} [{agent['status']}]")

    console.print("\n   [cyan]Mekong-Specific Agents:[/cyan]")
    for agent in AGENTS_MEKONG:
        console.print(f"      {agent['icon']} {agent['name']}: {agent['role']} [{agent['status']}]")

    total_agents = len(AGENTS_CORE) + len(AGENTS_MEKONG)
    console.print(f"\n   [dim]Total: {total_agents} agents ready[/dim]")
    console.print("   [dim]Tip: Use '/nong-san' or '/tiep-thi' to activate agents[/dim]")
