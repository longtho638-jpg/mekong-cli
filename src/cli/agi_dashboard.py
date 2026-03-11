"""
AGI v2 Dashboard — 9 subsystem activity panel shown after cook execution.
"""

from rich.console import Console
from rich.panel import Panel

console = Console()


def show_agi_dashboard(goal: str, result: object) -> None:
    """Show all 9 AGI subsystem activity after cook execution."""
    panels = []

    try:
        from src.core.autonomous import AutonomousEngine
        report = AutonomousEngine().get_consciousness()
        score_style = "green" if report.score >= 70 else "yellow" if report.score >= 40 else "red"
        panels.append(f"[bold]🧠 Consciousness:[/bold] [{score_style}]{report.score}/100[/{score_style}]")
    except Exception:
        panels.append("[bold]🧠 Consciousness:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.nlu import IntentClassifier
        from src.core.llm_client import get_client
        intent = IntentClassifier(llm_client=get_client()).classify(goal)
        panels.append(
            f"[bold]📡 NLU:[/bold] {intent.intent.value} ({intent.confidence:.0%})"
            + (f" | {intent.entities}" if intent.entities else "")
        )
    except Exception:
        panels.append("[bold]📡 NLU:[/bold] [dim]skipped[/dim]")

    try:
        from src.core.tool_registry import ToolRegistry
        stats = ToolRegistry().get_stats()
        panels.append(
            f"[bold]🔧 Tools:[/bold] {stats['total_tools']} registered, "
            f"{stats['total_executions']} executed"
        )
    except Exception:
        panels.append("[bold]🔧 Tools:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.reflection import ReflectionEngine
        stats = ReflectionEngine().get_stats()
        panels.append(
            f"[bold]🪞 Reflection:[/bold] {stats['total_reflections']} reflections, "
            f"calibration {stats['calibration_error']:.2f}"
        )
    except Exception:
        panels.append("[bold]🪞 Reflection:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.world_model import WorldModel
        summary = WorldModel().get_context_summary()
        panels.append(f"[bold]🌍 World:[/bold] {summary[:60]}")
    except Exception:
        panels.append("[bold]🌍 World:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.collaboration import CollaborationProtocol
        stats = CollaborationProtocol().get_stats()
        panels.append(
            f"[bold]🤝 Collaboration:[/bold] {stats['registered_agents']} agents, "
            f"{stats['total_reviews']} reviews"
        )
    except Exception:
        panels.append("[bold]🤝 Collaboration:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.code_evolution import CodeEvolutionEngine
        stats = CodeEvolutionEngine().get_stats()
        panels.append(
            f"[bold]🧬 Evolution:[/bold] {stats['total_attempts']} attempts, "
            f"{stats.get('success_rate', 0):.0%} success"
        )
    except Exception:
        panels.append("[bold]🧬 Evolution:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.vector_memory_store import VectorMemoryStore
        vmem = VectorMemoryStore()
        collections = vmem.list_collections()
        total_points = sum(vmem.count(c) for c in collections) if collections else 0
        panels.append(
            f"[bold]🧠 VectorMem:[/bold] {len(collections)} collections, "
            f"{total_points} total vectors"
        )
    except Exception:
        panels.append("[bold]🧠 VectorMem:[/bold] [dim]unavailable[/dim]")

    try:
        from src.core.browser_agent import BrowserAgent
        ba = BrowserAgent()
        panels.append(f"[bold]🌐 Browser:[/bold] ready ({ba.user_agent[:30]}...)")
    except Exception:
        panels.append("[bold]🌐 Browser:[/bold] [dim]unavailable[/dim]")

    exec_modes: set = set()
    for sr in result.step_results:
        mode = sr.execution.metadata.get("mode", "shell") if sr.execution.metadata else "shell"
        exec_modes.add(mode)
    panels.append(f"[bold]⚙️  Modes:[/bold] {', '.join(sorted(exec_modes))}")

    try:
        from src.core.agi_score import AGIScoreEngine
        report = AGIScoreEngine().calculate()
        grade_colors = {"S": "magenta", "A": "green", "B": "cyan", "C": "yellow", "D": "red", "F": "red"}
        gc = grade_colors.get(report.grade, "white")
        filled = int(report.total_score / 5)
        bar = "█" * filled + "░" * (20 - filled)
        panels.append(
            f"[bold]🏆 AGI Score:[/bold] [{gc}]{report.total_score:.0f}/100 ({report.grade})[/{gc}] {bar}"
        )
    except Exception:
        pass

    console.print(
        Panel(
            "\n".join(panels),
            title="🧠 AGI v2 Dashboard — 9/9 Subsystems",
            border_style="magenta",
        )
    )
