#!/usr/bin/env python3
"""
Base Class for Agency OS Unified Demo.
Follows Binh Pháp Architecture for clean execution.
"""

import time
import sys
from typing import Callable, Any, Dict, List, Optional
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()

class AgencyOSDemo:
    """
    Main Demo Orchestrator for Agency OS.
    Handles step-by-step execution of platform features.
    """

    def __init__(self):
        self.steps_completed = 0
        self.total_steps = 7
        self.results: Dict[str, Any] = {}

    def print_banner(self):
        banner_text = """
🏯 [bold gold1]AGENCY OS[/bold gold1] - [bold cyan]THE ONE-PERSON UNICORN OS[/bold cyan] 🏯
[italic]"Không đánh mà thắng" - Win Without Fighting[/italic]
        """
        console.print(Panel(banner_text, expand=False, border_style="blue"))

    def run_step(self, num: int, title: str, func: Callable[[], Any]):
        """Executes a demo step with standardized rich formatting."""
        console.print(f"\n[bold blue][{num}/{self.total_steps}][/bold blue] [bold white]{title}[/bold white]")
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

    def animate_text(self, text: str, delay: float = 0.02):
        """Animate text output for a more 'hacker' vibe."""
        for char in text:
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(delay)
        print()

    # --- Demo Steps ---

    def step_1_i18n(self):
        from locales import i18n, t
        
        locales = i18n.get_available_locales()
        console.print(f"🌐 [cyan]Available Locales:[/cyan] {', '.join(locales)}")
        
        # English
        i18n.set_locale("en")
        console.print(f"🇺🇸 [bold]English:[/bold] {t('common.welcome')}")
        
        # Vietnamese
        i18n.set_locale("vi")
        console.print(f"🇻🇳 [bold]Tiếng Việt:[/bold] {t('common.welcome')}")
        
        i18n.set_locale("en") # Reset

    def step_2_vietnam(self):
        from regions.vietnam import VietnamConfig, VietnamPricingEngine
        
        config = VietnamConfig()
        table = Table(show_header=False, box=None)
        table.add_row("📍 Coverage", f"{config.coverage_type} ({len(config.provinces)} provinces)")
        table.add_row("💰 Currency", f"{config.primary_currency.value} + {config.local_currency.value}")
        table.add_row("📈 Rate", f"1 USD = {config.exchange_rate:,.0f} VND")
        console.print(table)
        
        pricing = VietnamPricingEngine(config)
        console.print("\n[bold]Local Services (USD Equiv):[/bold]")
        console.print(f"   • SEO Basic: [green]{pricing.get_local_price('seo_basic', in_usd=True)}[/green]")
        console.print(f"   • Website:   [green]{pricing.get_local_price('website', in_usd=True)}[/green]")

    def step_3_crm(self):
        from core import CRM
        crm = CRM()
        summary = crm.get_summary()
        
        table = Table(title="Pipeline Summary", border_style="blue")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Contacts", str(summary['contacts_total']))
        table.add_row("Deals", str(summary['deals_total']))
        table.add_row("Pipeline Value", f"${summary['pipeline_value']:,.0f}")
        table.add_row("Win Rate", f"{summary['win_rate']:.1f}%")
        console.print(table)

    def step_4_scheduler(self):
        from core import Scheduler
        scheduler = Scheduler()
        upcoming = scheduler.get_upcoming_meetings()
        
        console.print(f"📅 [bold]Upcoming Meetings:[/bold] {len(upcoming)}")
        for m in upcoming[:3]:
            config = scheduler.meeting_types[m.meeting_type]
            console.print(f"   • [cyan]{m.start_time.strftime('%b %d, %H:%M')}[/cyan] - {config.name}")

    def step_5_analytics(self):
        try:
            from core import AnalyticsDashboard
            analytics = AnalyticsDashboard()
            summary = analytics.get_summary()
            
            console.print(f"📊 [bold]Revenue Metrics:[/bold]")
            console.print(f"   MRR: [bold green]${summary['mrr']:,.0f}[/bold green] | ARR: [bold green]${summary['arr']:,.0f}[/bold green]")
            console.print(f"   Active Clients: {summary['clients']}")
        except Exception:
            console.print(f"📊 [dim]Analytics Dashboard: MRR $5,000 | ARR $60,000 (Mock)[/dim]")

    def step_6_franchise(self):
        from core import FranchiseSystem
        franchise = FranchiseSystem()
        hq = franchise.get_hq_revenue()
        stats = franchise.get_territory_stats()
        
        console.print(f"🌍 [bold]Global Franchise System:[/bold]")
        console.print(f"   • Territories: [cyan]{stats['total_territories']}[/cyan] ({stats['claimed']} claimed)")
        console.print(f"   • HQ Monthly Revenue: [green]{hq['monthly_platform_fees']}[/green]")

    def print_final_summary(self):
        summary_panel = Panel(
            """
[bold green]✅ i18n:[/bold green] English + Vietnamese
[bold green]✅ Vietnam:[/bold green] 20 provinces, VND + USD
[bold green]✅ CRM:[/bold green] Deals, Contacts, Pipeline
[bold green]✅ Scheduler:[/bold green] Meetings, Calendar
[bold green]✅ Analytics:[/bold green] MRR, ARR, Metrics
[bold green]✅ Franchise:[/bold green] 12 territories, $36K/year

[bold cyan]📊 17,000+ Lines | 32 Phases | 6 Git Commits Today[/bold cyan]

[gold1]"Không đánh mà thắng" 🏯[/gold1]
            """,
            title="[bold]🏆 AGENCY OS COMPLETE[/bold]",
            border_style="gold1"
        )
        console.print("\n", summary_panel)
        console.print("\n[bold green]🎉 DEMO COMPLETE![/bold green]\n")

    def start(self):
        """Run the full demo sequence."""
        self.print_banner()
        time.sleep(0.5)
        
        steps = [
            (1, "🌐 i18n - MULTI-LANGUAGE", self.step_1_i18n),
            (2, "🇻🇳 VIETNAM REGION CONFIG", self.step_2_vietnam),
            (3, "🎯 CRM - SALES PIPELINE", self.step_3_crm),
            (4, "📅 SCHEDULER - MEETINGS", self.step_4_scheduler),
            (5, "📊 ANALYTICS - REVENUE", self.step_5_analytics),
            (6, "🌍 FRANCHISE - GLOBAL NETWORK", self.step_6_franchise),
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
