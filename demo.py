#!/usr/bin/env python3
"""
Base Class for Agency OS Unified Demo.
Follows Binh Pháp Architecture for clean execution.
"""

import sys
import time
from datetime import datetime
from typing import Any, Callable, Dict

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()


class AgencyOSDemo:
    """
    Main Demo Orchestrator for Agency OS.
    Handles step-by-step execution of platform features.
    """

    def __init__(self):
        self.steps_completed = 0
        self.total_steps = 6
        self.results: Dict[str, Any] = {}

    def print_banner(self):
        banner_text = """
🏯 [bold gold1]AGENCY OS[/bold gold1] - [bold cyan]THE ONE-PERSON UNICORN OS[/bold cyan] 🏯
[italic]"Không đánh mà thắng" - Win Without Fighting[/italic]
        """
        console.print(Panel(banner_text, expand=False, border_style="blue"))

    def run_step(self, num: int, title: str, func: Callable[[], Any]):
        """Executes a demo step with standardized rich formatting."""
        console.print(
            f"\n[bold blue][{num}/{self.total_steps}][/bold blue] [bold white]{title}[/bold white]"
        )
        console.print("─" * 60)

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description=f"Executing {title}...", total=None)
            try:
                result = func()
                self.results[title] = result
                self.steps_completed += 1
            except ImportError as e:
                console.print(f"⚠️  [yellow]Module Not Available:[/yellow] {e}")
            except Exception as e:
                console.print(f"❌ [red]Error in {title}:[/red] {e}")

    # --- Demo Steps ---

    def step_1_i18n(self):
        # We assume i18n is in core.shared or we skip if legacy
        try:
            from core.shared import i18n

            # Mock if not fully implemented in new structure or use basic print
            console.print("🌐 [cyan]Locales:[/cyan] en, vi")
            console.print("🇺🇸 [bold]English:[/bold] Welcome to Agency OS")
            console.print("🇻🇳 [bold]Tiếng Việt:[/bold] Chào mừng đến với Agency OS")
        except ImportError:
            console.print("Skipping i18n (module refactored)")

    def step_2_vietnam(self):
        # Mocking Vietnam config for demo visual
        table = Table(show_header=False, box=None)
        table.add_row("📍 Coverage", "National (63 provinces)")
        table.add_row("💰 Currency", "USD + VND")
        table.add_row("📈 Rate", "1 USD = 25,450 VND")
        console.print(table)

    def step_3_crm(self):
        from core.crm.csm import CustomerSuccessManager

        csm = CustomerSuccessManager("Demo Agency")
        csm.create_success_plan("TechCorp", "Alice", ["Growth"], ["Q1 Review"])

        console.print(csm.format_dashboard())

    def step_4_scheduler(self):
        from core.ops.scheduler import MeetingType, Scheduler

        scheduler = Scheduler()
        # Seed a meeting
        scheduler.book_call(MeetingType.DISCOVERY, "Lead", "lead@test.com", datetime.now())

        upcoming = scheduler.get_upcoming_meetings()
        console.print(f"📅 [bold]Upcoming Meetings:[/bold] {len(upcoming)}")
        for m in upcoming[:3]:
            console.print(
                f"   • [cyan]{m.start_time.strftime('%b %d, %H:%M')}[/cyan] - {m.meeting_type.value}"
            )

    def step_5_analytics(self):
        from core.finance.revenue_forecasting import RevenueForecasting

        engine = RevenueForecasting()
        engine.add_source("Retainer A", 5000, 0.05)
        forecasts = engine.generate(6)

        console.print("📊 [bold]Revenue Forecast (6mo):[/bold]")
        console.print(f"   Next Month: [bold green]${forecasts[0].predicted:,.0f}[/bold green]")
        console.print(
            f"   6 Month Total: [bold green]${sum(f.predicted for f in forecasts):,.0f}[/bold green]"
        )

    def step_6_franchise(self):
        from core.franchise.franchise import FranchiseSystem

        franchise = FranchiseSystem()

        # Use built-in dashboard
        console.print(franchise.format_dashboard())

    def print_final_summary(self):
        summary_panel = Panel(
            """
[bold green]✅ Architecture:[/bold green] Modular Core (16 Packages)
[bold green]✅ CRM:[/bold green] Customer Success Manager
[bold green]✅ Ops:[/bold green] Scheduler & Automation
[bold green]✅ Finance:[/bold green] Forecasting & Invoicing
[bold green]✅ CLI:[/bold green] Unified Typer Interface

[gold1]"Không đánh mà thắng" 🏯[/gold1]
            """,
            title="[bold]🏆 AGENCY OS DEMO COMPLETE[/bold]",
            border_style="gold1",
        )
        console.print("\n", summary_panel)

    def start(self):
        """Run the full demo sequence."""
        self.print_banner()
        time.sleep(0.5)

        steps = [
            (1, "🌐 i18n & REGION", self.step_1_i18n),
            (2, "🇻🇳 VIETNAM CONFIG", self.step_2_vietnam),
            (3, "🎯 CRM & SUCCESS", self.step_3_crm),
            (4, "📅 SCHEDULER", self.step_4_scheduler),
            (5, "📊 FINANCE & FORECAST", self.step_5_analytics),
            (6, "🌍 FRANCHISE", self.step_6_franchise),
        ]

        for num, title, func in steps:
            self.run_step(num, title, func)
            time.sleep(0.3)

        self.print_final_summary()


if __name__ == "__main__":
    demo = AgencyOSDemo()
    try:
        demo.start()
    except KeyboardInterrupt:
        console.print("\n[red]Demo interrupted.[/red]")
        sys.exit(0)
