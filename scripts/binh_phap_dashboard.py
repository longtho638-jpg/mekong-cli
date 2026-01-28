#!/usr/bin/env python3
"""
🏯 Binh Pháp Strategic Dashboard
Displays the 13 Chapters of Binh Pháp and their implementation status in AgencyOS.
"""
import argparse
import os
import sys
import time
from datetime import datetime

from rich import box
from rich.align import Align
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.text import Text

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from backend.api.main import app

console = Console()
client = TestClient(app)

def get_status_color(status):
    if status == "completed":
        return "green"
    elif status == "active":
        return "blue"
    elif status == "pending":
        return "yellow"
    elif status == "at_risk":
        return "red"
    return "white"

def get_status_icon(status):
    if status == "completed":
        return "✅"
    elif status == "active":
        return "🔄"
    elif status == "pending":
        return "⏳"
    elif status == "at_risk":
        return "🚨"
    return "❓"

def fetch_data():
    try:
        response = client.get("/api/v1/binh-phap/status")
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        console.print(f"[red]Error fetching data: {e}[/red]")
        return None

def create_header():
    grid = Table.grid(expand=True)
    grid.add_column(justify="center", ratio=1)
    grid.add_column(justify="right")

    title = Text("🏯 BINH PHÁP STRATEGIC DASHBOARD", style="bold magenta", justify="center")
    subtitle = Text("AgencyOS • The Art of War for Startups", style="dim white", justify="center")

    grid.add_row(title, datetime.now().strftime("%Y-%m-%d %H:%M"))
    grid.add_row(subtitle, "")

    return Panel(grid, style="magenta", border_style="magenta")

def create_chapter_table(chapters):
    table = Table(title="The 13 Chapters", expand=True, box=box.ROUNDED, show_lines=True)

    table.add_column("No.", justify="right", style="cyan", no_wrap=True)
    table.add_column("Chapter", style="bold white")
    table.add_column("Principle", style="italic")
    table.add_column("Application", style="dim")
    table.add_column("Command", style="green")
    table.add_column("Status", justify="center")

    for chapter in chapters:
        status_color = get_status_color(chapter['status'])
        status_icon = get_status_icon(chapter['status'])

        name = f"{chapter['name_vi']} ({chapter['name_en']})"
        status_text = Text(f"{status_icon} {chapter['status'].upper()}", style=status_color)

        table.add_row(
            str(chapter['id']),
            name,
            chapter['principle'],
            chapter['application'],
            chapter['command'],
            status_text
        )

    return table

def create_progress_panel(progress_pct):
    # Visual representation for static layout
    bars = int(progress_pct / 5)
    bar_str = "█" * bars + "░" * (20 - bars)
    color = "green" if progress_pct > 80 else "yellow" if progress_pct > 50 else "red"

    text = Text()
    text.append("\nStrategic Completion: ", style="bold white")
    text.append(f"{progress_pct:.2f}%\n", style=f"bold {color}")
    text.append(f"[{bar_str}]", style=f"{color}")

    return Panel(
        Align.center(text),
        title="Overall Progress",
        border_style=color
    )

def create_stats_panel(chapters):
    completed = sum(1 for c in chapters if c['status'] == 'completed')
    active = sum(1 for c in chapters if c['status'] == 'active')
    pending = sum(1 for c in chapters if c['status'] == 'pending')
    _ = len(chapters)

    grid = Table.grid(expand=True, padding=(0, 2))
    grid.add_column(justify="center", ratio=1)
    grid.add_column(justify="center", ratio=1)
    grid.add_column(justify="center", ratio=1)

    grid.add_row(
        Text(str(completed), style="bold green", justify="center"),
        Text(str(active), style="bold blue", justify="center"),
        Text(str(pending), style="bold yellow", justify="center")
    )
    grid.add_row(
        Text("COMPLETED", style="dim green", justify="center"),
        Text("ACTIVE", style="dim blue", justify="center"),
        Text("PENDING", style="dim yellow", justify="center")
    )

    return Panel(
        grid,
        title="Chapter Breakdown",
        border_style="white"
    )

def show_detail_view(chapter_key):
    """Display detailed view for a specific chapter"""
    try:
        response = client.get(f"/api/v1/binh-phap/chapter/{chapter_key}")
        if response.status_code != 200:
            console.print(f"[red]Chapter '{chapter_key}' not found.[/red]")
            return

        chapter = response.json()

        status_color = get_status_color(chapter['status'])
        status_icon = get_status_icon(chapter['status'])

        grid = Table.grid(expand=True, padding=(0, 2))
        grid.add_column(style="bold cyan", justify="right")
        grid.add_column(style="white")

        grid.add_row("Chapter No:", str(chapter['id']))
        grid.add_row("Vietnamese Name:", chapter['name_vi'])
        grid.add_row("English Name:", chapter['name_en'])
        grid.add_row("Principle:", chapter['principle'])
        grid.add_row("Status:", f"{status_icon} {chapter['status'].upper()}")
        grid.add_row("Command:", chapter['command'])

        # Application box
        app_panel = Panel(
            chapter['application'],
            title="Application & Strategy",
            border_style="blue",
            padding=(1, 2)
        )

        # Header panel
        header_text = Text(f"🏯 Chapter {chapter['id']}: {chapter['name_vi']}", justify="center", style="bold magenta")

        console.print(Panel(header_text, border_style="magenta"))
        console.print(Panel(Align.center(grid), title="Details", border_style=status_color))
        console.print(app_panel)

    except Exception as e:
        console.print(f"[red]Error fetching details: {e}[/red]")

def main():
    parser = argparse.ArgumentParser(description="Binh Pháp Strategic Dashboard")
    parser.add_argument("--chapter", "-c", type=str, help="Show details for a specific chapter key (e.g. ke-hoach)")
    parser.add_argument("--watch", "-w", action="store_true", help="Live update mode (simulated)")
    args = parser.parse_args()

    console.clear()

    if args.chapter:
        show_detail_view(args.chapter)
        return

    with console.status("[bold green]Querying Strategic Intelligence (API)..."):
        # Simulate network delay for effect
        time.sleep(0.5)
        data = fetch_data()

    if not data:
        console.print("[red]Failed to retrieve Binh Pháp data.[/red]")
        return

    layout = Layout()
    layout.split(
        Layout(name="header", size=4),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3)
    )

    layout["main"].split_row(
        Layout(name="left", ratio=2),
        Layout(name="right", ratio=1)
    )

    layout["right"].split_column(
        Layout(name="progress", size=6),
        Layout(name="stats", size=6),
        Layout(name="legend")
    )

    # Header
    layout["header"].update(create_header())

    # Left: Table
    layout["left"].update(create_chapter_table(data['chapters']))

    # Right: Widgets
    layout["progress"].update(create_progress_panel(data['total_progress']))
    layout["stats"].update(create_stats_panel(data['chapters']))

    # Legend
    legend_text = Text.from_markup(
        "\n[bold]Legend:[/bold]\n"
        "✅ [green]Completed[/green]: Fully implemented\n"
        "🔄 [blue]Active[/blue]: Currently running/in-progress\n"
        "⏳ [yellow]Pending[/yellow]: Planned\n"
        "🚨 [red]At Risk[/red]: Needs attention"
    )
    layout["legend"].update(Panel(legend_text, title="Key", border_style="dim"))

    # Footer
    footer_text = Text("Run 'python scripts/binh_phap_dashboard.py --chapter <key>' for details", justify="center", style="dim")
    layout["footer"].update(Panel(footer_text, style="dim"))

    console.print(layout)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Dashboard closed.[/yellow]")
