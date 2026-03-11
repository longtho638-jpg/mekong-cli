"""
System-level commands: gateway, dash, halt, evolve, evolve-code, version
Registered onto the main typer app via register_system_commands().
"""

import importlib
import os

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

console = Console()


def register_system_commands(app: typer.Typer) -> None:
    """Register gateway, dash, halt, evolve, evolve-code, version onto main app."""

    @app.command()
    def gateway(
        port: int = typer.Option(8000, "--port", "-p", help="Server port"),
        host: str = typer.Option("127.0.0.1", "--host", "-H", help="Server bind address"),
    ) -> None:
        """🌐 Gateway: Start the OpenClaw Hybrid Commander HTTP server"""
        import uvicorn

        api_token = os.environ.get("MEKONG_API_TOKEN")
        if not api_token:
            console.print(
                Panel(
                    "[bold red]MEKONG_API_TOKEN not set![/bold red]\n\n"
                    "Set it before starting the gateway:\n"
                    "  [cyan]export MEKONG_API_TOKEN='your-secret-token'[/cyan]",
                    title="⚠️ Security Warning",
                    border_style="red",
                )
            )
            raise typer.Exit(code=1)

        console.print(
            Panel(
                f"[bold]Host:[/bold] {host}\n"
                f"[bold]Port:[/bold] {port}\n"
                f"[bold]Token:[/bold] {'*' * len(api_token[:4])}...{api_token[-4:]}\n"
                f"[bold]Health:[/bold] http://{host}:{port}/health\n"
                f"[bold]Endpoint:[/bold] POST http://{host}:{port}/cmd",
                title="🌐 Mekong Gateway — OpenClaw Hybrid Commander",
                border_style="cyan",
            )
        )
        uvicorn.run("src.core.gateway:app", host=host, port=port, log_level="info")

    @app.command()
    def dash() -> None:
        """🟢 Dash: One-button action menu (The Washing Machine)"""
        from src.core.gateway import PRESET_ACTIONS, build_human_summary
        from src.core.llm_client import get_client
        from src.core.orchestrator import RecipeOrchestrator, OrchestrationStatus

        console.print(
            Panel(
                "[bold]Press a button, get things done.[/bold]\n"
                "[dim]Select an action below — no coding needed.[/dim]",
                title="🟢 Mekong Dashboard — The Washing Machine",
                border_style="green",
            )
        )
        table = Table(title="One-Button Actions", show_lines=True)
        table.add_column("#", style="bold cyan", justify="right", width=3)
        table.add_column("Action", style="bold", min_width=20)
        table.add_column("What it does", style="dim")
        for i, preset in enumerate(PRESET_ACTIONS, 1):
            table.add_row(str(i), f"{preset['icon']}  {preset['label']}", preset["goal"])
        console.print(table)
        console.print()

        choice = typer.prompt("Pick a number (or 'q' to quit)", default="q")
        if choice == "q":
            console.print("[dim]Bye![/dim]")
            return

        selected = PRESET_ACTIONS[int(choice) - 1]
        console.print(f"\n[bold green]Running:[/bold green] {selected['icon']}  {selected['label']}")

        llm_client = get_client()
        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
            strict_verification=True,
            enable_rollback=True,
        )
        result = orchestrator.run_from_goal(selected["goal"])
        summary = build_human_summary(result)
        status_style = "green" if result.status == OrchestrationStatus.SUCCESS else "red"
        console.print(
            Panel(
                f"[bold]{summary.en}[/bold]\n[dim]{summary.vi}[/dim]",
                title=f"[{status_style}]Result[/{status_style}]",
                border_style=status_style,
            )
        )

    @app.command()
    def halt() -> None:
        """🛑 Halt: Emergency stop all autonomous operations."""
        from src.core.governance import Governance

        Governance().halt()
        console.print("[bold red]🛑 HALTED[/bold red] — All autonomous operations stopped.")
        console.print("Run [bold]mekong autonomous resume[/bold] to restart.")

    @app.command()
    def evolve() -> None:
        """🧬 Evolve: Analyze patterns, generate recipes, deprecate bad ones."""
        from src.core.memory import MemoryStore
        from src.core.recipe_gen import RecipeGenerator
        from src.core.self_improve import SelfImprover

        improver = SelfImprover(MemoryStore(), RecipeGenerator())
        console.print(Panel(
            "[bold]Running self-improvement cycle...[/bold]",
            title="🧬 Evolution Engine",
            border_style="magenta",
        ))
        results = improver.analyze_and_improve()
        if not results:
            console.print("[yellow]No evolution actions taken — not enough data yet.[/yellow]")
        else:
            table = Table(title=f"Evolution Results ({len(results)} actions)")
            table.add_column("Action", style="bold cyan")
            table.add_column("Target", style="bold")
            table.add_column("Reason", style="dim")
            for entry in results:
                action_style = {
                    "generated": "green", "deprecated": "red", "suggestion": "yellow"
                }.get(entry.action, "dim")
                table.add_row(
                    f"[{action_style}]{entry.action}[/{action_style}]",
                    entry.target, entry.reason,
                )
            console.print(table)

        stats = improver.get_evolution_stats()
        console.print(Panel(
            f"[bold]Generated:[/bold] {stats['total_generated']}\n"
            f"[bold]Deprecated:[/bold] {stats['total_deprecated']}\n"
            f"[bold]Journal Size:[/bold] {stats['journal_size']}",
            title="📊 Evolution Statistics",
            border_style="cyan",
        ))

    @app.command(name="evolve-code")
    def evolve_code(
        target: str = typer.Option("src/core", "--target", "-t", help="Directory to analyze"),
    ) -> None:
        """🧬 Analyze source code for self-improvement opportunities."""
        from src.core.code_evolution import CodeEvolutionEngine

        engine = CodeEvolutionEngine()
        report = engine.analyze_source(target)

        if "error" in report:
            console.print(f"[red]{report['error']}[/red]")
            raise typer.Exit(code=1)

        console.print(Panel(
            f"[bold]Target:[/bold] {report['target']}\n"
            f"[bold]Files:[/bold] {len(report['files'])}\n"
            f"[bold]Total Lines:[/bold] {report['total_lines']}\n"
            f"[bold]Functions:[/bold] {report['total_functions']}\n"
            f"[bold]Issues Found:[/bold] {len(report['issues'])}",
            title="🧬 Code Analysis",
            border_style="magenta",
        ))
        if report["issues"]:
            console.print("\n[bold yellow]Issues:[/bold yellow]")
            for issue in report["issues"]:
                console.print(f"  ⚠️  {issue}")
        if report["files"]:
            table = Table(title="File Breakdown")
            table.add_column("File", style="cyan")
            table.add_column("Lines", justify="right")
            table.add_column("Functions", justify="right")
            for f in sorted(report["files"], key=lambda x: x["lines"], reverse=True)[:15]:
                table.add_row(f["path"], str(f["lines"]), str(f["functions"]))
            console.print(table)
        stats = engine.get_stats()
        if stats["total_attempts"] > 0:
            console.print(
                f"\n[dim]Evolution Journal: {stats['total_attempts']} attempts, "
                f"{stats['applied']} applied, {stats['success_rate']:.0%} success[/dim]"
            )

    @app.command()
    def version() -> None:
        """Show version info + AGI subsystem health"""
        console.print(Panel(
            "[bold green]Mekong CLI[/bold green] v2.0.0-agi\n"
            "[dim]RaaS Agency Operating System[/dim]\n"
            "[dim]Engine: Plan-Execute-Verify (Binh Pháp)[/dim]\n"
            "[dim]DNA: ClaudeKit v2.9.1+[/dim]",
            title="Version",
            border_style="blue",
        ))

        subsystems = []
        _modules = [
            ("NLU", "src.core.nlu", "IntentClassifier"),
            ("Memory", "src.core.memory", "MemoryStore"),
            ("Reflection", "src.core.reflection", "ReflectionEngine"),
            ("WorldModel", "src.core.world_model", "WorldModel"),
            ("ToolRegistry", "src.core.tool_registry", "ToolRegistry"),
            ("BrowserAgent", "src.core.browser_agent", "BrowserAgent"),
            ("Collaboration", "src.core.collaboration", "CollaborationProtocol"),
            ("CodeEvolution", "src.core.code_evolution", "CodeEvolutionEngine"),
            ("VectorMemory", "src.core.vector_memory_store", "VectorMemoryStore"),
        ]
        for name, mod, cls_name in _modules:
            try:
                m = importlib.import_module(mod)
                getattr(m, cls_name)
                subsystems.append(f"[green]✓[/green] {name}")
            except Exception:
                subsystems.append(f"[red]✗[/red] {name}")

        healthy = sum(1 for s in subsystems if "✓" in s)
        health_color = "green" if healthy == 9 else "yellow" if healthy >= 6 else "red"
        console.print(Panel(
            f"[bold]AGI Subsystems:[/bold] [{health_color}]{healthy}/9 online[/{health_color}]\n"
            + "  ".join(subsystems),
            title="🧠 AGI v2 Health",
            border_style="magenta",
        ))
