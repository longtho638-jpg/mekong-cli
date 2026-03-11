"""
Autonomous + Telegram sub-commands: autonomous (status/run/resume/reflect/world/predict), telegram (start/status)
register_agi_commands() wires all AGI sub-apps onto the main typer app.
"""

import asyncio
import os

import typer
from rich.console import Console
from rich.panel import Panel

from src.cli.tools_browse_collab_commands import tools_app, browse_app, collab_app
from src.cli.system_commands import register_system_commands

console = Console()

autonomous_app = typer.Typer(help="Autonomous: AGI loop control")
telegram_app = typer.Typer(help="Telegram: remote commander bot")


# ---------------------------------------------------------------------------
# Autonomous commands
# ---------------------------------------------------------------------------

@autonomous_app.command(name="status")
def autonomous_status() -> None:
    """Show Consciousness Score and subsystem health (AGI v2: all 9 subsystems)."""
    from src.core.autonomous import AutonomousEngine

    engine = AutonomousEngine()
    report = engine.get_consciousness()
    score_style = "green" if report.score >= 70 else "yellow" if report.score >= 40 else "red"

    console.print(
        Panel(
            f"[bold]Consciousness Score:[/bold] [{score_style}]{report.score}/100[/{score_style}]\n\n"
            f"[bold]Memory:[/bold]      {report.memory_health:.0%}\n"
            f"[bold]NLU:[/bold]         {report.nlu_health:.0%}\n"
            f"[bold]Router:[/bold]      {report.router_health:.0%}\n"
            f"[bold]Executor:[/bold]    {report.executor_health:.0%}\n"
            f"[bold]Learner:[/bold]     {report.learner_health:.0%}\n"
            f"[bold]Evolution:[/bold]   {report.evolution_health:.0%}\n"
            f"[bold]Governance:[/bold]  {report.governance_health:.0%}\n"
            f"[bold cyan]Reflection:[/bold cyan]  {report.reflection_health:.0%}\n"
            f"[bold cyan]World Model:[/bold cyan] {report.world_model_health:.0%}",
            title="🧠 AGI Consciousness (v2)",
            border_style="magenta",
        )
    )

    trend = engine.get_consciousness_trend(10)
    if len(trend) > 1:
        direction = "📈" if trend[-1] >= trend[0] else "📉"
        console.print(f"\n[dim]Trend: {direction} {' → '.join(str(s) for s in trend)}[/dim]")

    traces = engine.get_decision_traces(3)
    if traces:
        console.print("\n[bold]Recent Decision Traces:[/bold]")
        for t in traces:
            console.print(
                f"  • [cyan]{t.goal[:40]}[/cyan] → {t.intent_classified or '?'} "
                f"({t.confidence:.0%}) → {t.result}"
            )


@autonomous_app.command(name="run")
def autonomous_run(
    goal: str = typer.Argument(..., help="Goal to process autonomously"),
) -> None:
    """Run a single autonomous cycle with full AGI v2 pipeline."""
    from src.core.autonomous import AutonomousEngine

    engine = AutonomousEngine()
    if engine.is_halted():
        console.print("[bold red]System is HALTED. Use 'mekong autonomous resume' first.[/bold red]")
        raise typer.Exit(code=1)

    result = engine.process_goal(goal)
    status_style = "green" if result.result_status == "success" else "red"
    console.print(
        Panel(
            f"[bold]Goal:[/bold] {result.goal}\n"
            f"[bold]Status:[/bold] [{status_style}]{result.result_status}[/{status_style}]\n"
            f"[bold]Executed:[/bold] {result.executed}\n"
            f"[bold]Recipe Generated:[/bold] {result.recipe_generated}\n"
            f"[bold]Patterns Detected:[/bold] {result.patterns_detected}",
            title="🤖 Autonomous Cycle Result",
            border_style=status_style,
        )
    )

    if result.governance_decision:
        console.print(
            f"[dim]Governance: {result.governance_decision.action_class.value} "
            f"— {result.governance_decision.reason}[/dim]"
        )
    if result.reflection_summary:
        console.print(Panel(result.reflection_summary, title="🪞 Reflection", border_style="cyan"))
    if result.world_diff_summary:
        console.print(Panel(result.world_diff_summary, title="🌍 World Changes", border_style="blue"))
    if result.decision_trace:
        t = result.decision_trace
        console.print(
            f"\n[dim]Decision Trace: intent={t.intent_classified} confidence={t.confidence:.0%} "
            f"strategy={t.strategy_used[:40] if t.strategy_used else 'none'}[/dim]"
        )
    if result.result_status in ("blocked", "rejected"):
        raise typer.Exit(code=1)


@autonomous_app.command(name="resume")
def autonomous_resume() -> None:
    """Resume autonomous operations after halt."""
    from src.core.governance import Governance

    Governance().resume()
    console.print("[bold green]RESUMED[/bold green] — Autonomous operations re-enabled.")


@autonomous_app.command(name="reflect")
def autonomous_reflect() -> None:
    """Show reflection engine stats and recent reflections."""
    from src.core.reflection import ReflectionEngine

    engine = ReflectionEngine()
    stats = engine.get_stats()
    recent = engine.get_recent(5)

    console.print(
        Panel(
            f"[bold]Total Reflections:[/bold] {stats['total_reflections']}\n"
            f"[bold]Calibration Error:[/bold] {stats['calibration_error']:.2f}\n"
            f"[bold]Strategy Changes:[/bold] {stats['strategy_changes_suggested']}",
            title="🪞 Reflection Engine",
            border_style="cyan",
        )
    )
    if recent:
        console.print("\n[bold]Recent Reflections:[/bold]")
        for r in recent:
            status_style = "green" if r.status == "success" else "red"
            console.print(
                f"  • [{status_style}]{r.status}[/{status_style}] "
                f"{r.goal[:40]} — {r.lesson_learned[:60]}"
            )


@autonomous_app.command(name="world")
def autonomous_world() -> None:
    """Show current world model snapshot."""
    from src.core.world_model import WorldModel

    console.print(Panel(WorldModel().get_context_summary(), title="🌍 World Model", border_style="blue"))


@autonomous_app.command(name="predict")
def autonomous_predict(
    action: str = typer.Argument(..., help="Action to predict side effects for"),
) -> None:
    """Predict side effects of an action before executing."""
    from src.core.world_model import WorldModel

    pred = WorldModel().predict_side_effects(action)
    risk_style = {"high": "red", "medium": "yellow", "low": "green"}.get(pred.risk_level, "dim")
    console.print(
        Panel(
            f"[bold]Action:[/bold] {pred.action}\n"
            f"[bold]Risk Level:[/bold] [{risk_style}]{pred.risk_level.upper()}[/{risk_style}]\n"
            + (
                "\n[bold]Warnings:[/bold]\n" + "\n".join(f"  ⚠️  {w}" for w in pred.warnings)
                if pred.warnings else ""
            ),
            title="🔮 Side Effect Prediction",
            border_style=risk_style,
        )
    )


# ---------------------------------------------------------------------------
# Telegram commands
# ---------------------------------------------------------------------------

@telegram_app.command(name="start")
def telegram_start() -> None:
    """Start Telegram bot in foreground (blocking)."""
    token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
    if not token:
        console.print(
            Panel(
                "[bold red]MEKONG_TELEGRAM_TOKEN not set![/bold red]\n\n"
                "Set it before starting:\n"
                "  [cyan]export MEKONG_TELEGRAM_TOKEN='your-bot-token'[/cyan]",
                title="Telegram Bot",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)

    try:
        from src.core.telegram_bot import MekongBot
    except ImportError:
        console.print("[red]python-telegram-bot not installed.[/red]")
        console.print("[dim]pip install python-telegram-bot[/dim]")
        raise typer.Exit(code=1)

    bot = MekongBot(token=token)
    console.print("[green]Starting Telegram bot...[/green]")

    async def _run() -> None:
        await bot.start()
        try:
            while bot.is_running():
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            await bot.stop()

    asyncio.run(_run())


@telegram_app.command(name="status")
def telegram_status_cmd() -> None:
    """Check Telegram bot configuration status."""
    token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
    configured = bool(token)
    status_style = "green" if configured else "red"
    console.print(
        Panel(
            f"[bold]Configured:[/bold] [{status_style}]{configured}[/{status_style}]\n"
            f"[bold]Token:[/bold] {'*' * 8 + token[-4:] if token else 'not set'}",
            title="Telegram Bot Status",
            border_style=status_style,
        )
    )


# ---------------------------------------------------------------------------
# Wiring: attach all AGI sub-apps + system commands to main app
# ---------------------------------------------------------------------------

def register_agi_commands(app: typer.Typer) -> None:
    """Wire all AGI sub-typers and system commands onto the main app."""
    app.add_typer(autonomous_app, name="autonomous")
    app.add_typer(telegram_app, name="telegram")
    app.add_typer(tools_app, name="tools")
    app.add_typer(browse_app, name="browse")
    app.add_typer(collab_app, name="collab")
    register_system_commands(app)
