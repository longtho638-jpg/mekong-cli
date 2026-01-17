import typer
from rich.console import Console
from rich.panel import Panel
from core.dashboard.service import DashboardService

console = Console()

def show_dashboard():
    """Show the unified master dashboard."""
    service = DashboardService()
    data = service.get_master_view()
    
    rev = data['revenue']['financials']
    leads = data['leads']
    
    console.print("\n[bold blue]🏯 MASTER DASHBOARD[/bold blue]")
    
    # Revenue Panel
    console.print(Panel(
        f"MRR: ${rev.get('mrr', 0):,.0f}\n"
        f"ARR: ${rev.get('arr', 0):,.0f}\n"
        f"Outstanding: ${rev.get('outstanding', 0):,.0f}",
        title="💰 Revenue",
        expand=False
    ))
    
    # Leads Panel
    console.print(Panel(
        f"Total Leads: {leads.get('total_leads', 0)}\n"
        f"Pipeline Value: ${leads.get('pipeline_value', 0):,.0f}\n"
        f"Conversion Rate: {leads.get('conversion_rate', 0):.1f}%",
        title="🧲 Pipeline",
        expand=False
    ))
    
    console.print(f"\n[dim]Automation Last Run: {data['automation']['last_run']}[/dim]")
