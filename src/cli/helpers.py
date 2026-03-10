"""
CLI Helpers - Output formatting and display utilities

Centralized helpers for Rich console output, tables, and panels.
"""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from typing import Any, Optional, List, Dict, Tuple
from dataclasses import dataclass


console = Console()


@dataclass
class HumanSummary:
    """Human-readable summary in EN/VI."""
    en: str
    vi: str


def create_status_panel(
    title: str,
    content: str,
    border_style: str = "cyan",
    **kwargs: Any
) -> Panel:
    """Create a status panel with consistent styling."""
    return Panel(content, title=title, border_style=border_style, **kwargs)


def create_config_panel(title: str, config: Dict[str, str], **kwargs: Any) -> Panel:
    """Create a configuration panel from dict."""
    content = "\n".join(f"[bold]{k}:[/bold] {v}" for k, v in config.items())
    return create_status_panel(title, content, **kwargs)


def create_result_table(
    title: str,
    columns: List[Tuple[str, Dict]],
    rows: List[List[str]],
) -> Table:
    """Create a result table with consistent styling.

    Args:
        title: Table title
        columns: List of (column_name, column_kwargs) tuples
        rows: List of row data
    """
    table = Table(title=title, show_lines=True)
    for col_name, col_kwargs in columns:
        table.add_column(col_name, **col_kwargs)
    for row in rows:
        table.add_row(*row)
    return table


def create_step_table(title: str = "Steps", show_lines: bool = False) -> Table:
    """Create a standard step table."""
    table = Table(title=title, show_lines=show_lines)
    table.add_column("#", style="bold cyan", justify="right")
    table.add_column("Task", style="bold")
    table.add_column("Description", style="dim")
    return table


def format_step_row(order: int, title: str, description: str, max_desc_len: int = 80) -> Tuple[str, str, str]:
    """Format a step row for table display."""
    return (str(order), title, description[:max_desc_len])


def format_agent_step_row(
    order: int,
    title: str,
    agent: Optional[str],
    description: str,
    max_desc_len: int = 80
) -> tuple[str, str, str]:
    """Format a step row with optional agent hint."""
    agent_hint = f" [{agent}]" if agent else ""
    return format_step_row(order, title + agent_hint, description, max_desc_len)


def print_success(message: str, title: str = "Success") -> None:
    """Print a success message."""
    console.print(create_status_panel(title, f"[bold green]{message}[/bold green]", border_style="green"))


def print_error(message: str, title: str = "Error", errors: Optional[List[str]] = None) -> None:
    """Print an error message with optional error list."""
    content = f"[bold red]{message}[/bold red]"
    if errors:
        content += "\n" + "\n".join(f"• {e}" for e in errors)
    console.print(create_status_panel(title, content, border_style="red"))


def print_warning(message: str, title: str = "Warning", items: Optional[List[str]] = None) -> None:
    """Print a warning message with optional items list."""
    content = f"[yellow]{message}[/yellow]"
    if items:
        content += "\n" + "\n".join(f"  • {item}" for item in items)
    console.print(create_status_panel(title, content, border_style="yellow"))


def print_json_output(data: Dict[str, Any]) -> None:
    """Print JSON output."""
    import json
    console.print(json.dumps(data, indent=2))


def build_execution_result_table(step_results: List[Any]) -> Table:
    """Build a detailed execution result table."""
    table = create_step_table("Step Details")
    table.add_column("Status")
    table.add_column("Checks", style="dim")

    for sr in step_results:
        status = "[green]PASS[/green]" if sr.verification.passed else "[red]FAIL[/red]"
        table.add_row(
            str(sr.step.order),
            sr.step.title,
            status,
            sr.verification.summary,
        )
    return table


def format_human_summary(result: Any) -> HumanSummary:
    """Build human-readable summary from orchestration result."""
    if result.status.value == "success":
        return HumanSummary(
            en="Mission accomplished! All steps completed successfully.",
            vi="Hoàn thành nhiệm vụ! Tất cả các bước đã hoàn tất."
        )
    elif result.status.value == "partial":
        return HumanSummary(
            en=f"Partial completion: {result.completed_steps}/{result.total_steps} steps done.",
            vi=f"Hoàn thành một phần: {result.completed_steps}/{result.total_steps} bước."
        )
    else:
        return HumanSummary(
            en="Mission failed. Check errors above.",
            vi="Nhiệm vụ thất bại. Xem lỗi ở trên."
        )
