"""
Help system for CLI commands.
Displays command information and usage.
"""

from rich.console import Console
from rich.table import Table

from cli.theme import get_theme


def print_help() -> None:
    """Print help menu."""
    console = Console(theme=get_theme())
    table = Table(
        title="[bold white]📚 AVAILABLE COMMANDS[/bold white]",
        border_style="dim",
        box=None,
        header_style="bold blue",
    )

    table.add_column("Command", style="command")
    table.add_column("Description", style="white")

    table.add_row("", "")
    table.add_row("[bold secondary]🚀 START HERE[/bold secondary]", "")
    table.add_row("guide", "Hướng dẫn sử dụng cho người mới")
    table.add_row("scaffold", "Tạo bản vẽ kiến trúc (Architecture)")
    table.add_row("kanban", "Quản lý task và agent")

    table.add_row("", "")
    table.add_row("[bold secondary]🎯 CORE COMMANDS[/bold secondary]", "")
    table.add_row("binh-phap", "Phân tích chiến lược dự án")
    table.add_row("cook", "Xây dựng tính năng (AI Agent)")
    table.add_row("ship", "Deploy sản phẩm")

    table.add_row("", "")
    table.add_row("[bold secondary]⚡ UTILITIES[/bold secondary]", "")
    table.add_row("proposal", "Tạo Proposal khách hàng")
    table.add_row("content", "Tạo Content Marketing")
    table.add_row("invoice", "Tạo Invoice")

    console.print(table)
    console.print("\n[dim]Usage: agencyos [command][/dim]")
