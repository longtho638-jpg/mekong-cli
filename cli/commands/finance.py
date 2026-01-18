import typer
from rich.console import Console
from rich.table import Table

console = Console()
finance_app = typer.Typer(help="💰 Quản lý Tài chính (Invoice, PayPal, Gumroad)")

# --- INVOICE COMMANDS ---


@finance_app.command("invoice-create")
def invoice_create(
    client: str = typer.Argument(..., help="Client Name"),
    amount: float = typer.Argument(..., help="Amount USD"),
    description: str = typer.Argument(..., help="Description"),
):
    """Create a new invoice."""
    from core.finance.invoicing import InvoiceService

    service = InvoiceService()
    inv = service.create_invoice(client, amount, description)
    console.print(f"[green]✅ Invoice {inv['id']} created[/green] for ${amount}")


@finance_app.command("invoice-list")
def invoice_list():
    """List all invoices."""
    from core.finance.invoicing import InvoiceService

    service = InvoiceService()
    invoices = service.load_invoices()

    table = Table(title="📋 Invoices")
    table.add_column("ID", style="cyan")
    table.add_column("Client")
    table.add_column("Amount", justify="right")
    table.add_column("Status")

    for inv in invoices:
        status_color = "green" if inv["status"] == "paid" else "yellow"
        table.add_row(
            inv["id"],
            inv["client"],
            f"${inv['amount']:,.2f}",
            f"[{status_color}]{inv['status']}[/{status_color}]",
        )
    console.print(table)


# --- HUB COMMANDS ---


@finance_app.command("status")
def hub_status():
    """Check payment gateway status."""
    from core.finance.gateways.gumroad import GumroadClient
    from core.finance.gateways.paypal import PayPalClient

    pp = PayPalClient()
    gr = GumroadClient()

    console.print("\n[bold]💳 PayPal REST API[/bold]")
    console.print(f"   Configured: {'✅' if pp.is_configured() else '❌'}")

    console.print("\n[bold]🛒 Gumroad[/bold]")
    console.print(f"   Configured: {'✅' if gr.is_configured() else '❌'}")


@finance_app.command("revenue")
def hub_revenue():
    """Check aggregated revenue."""
    from core.finance.gateways.gumroad import GumroadClient
    from core.finance.gateways.paypal import PayPalClient

    pp = PayPalClient()
    gr = GumroadClient()

    # Simple summary
    console.print("\n[bold blue]💰 Revenue Snapshot[/bold blue]")

    # PayPal (Last 30 days)
    pp_txns = pp.get_transactions(30)
    pp_total = sum(
        float(t.get("transaction_info", {}).get("transaction_amount", {}).get("value", 0))
        for t in pp_txns
    )
    console.print(f"   PayPal (30d): ${pp_total:,.2f}")

    # Gumroad
    gr_sales = gr.get_sales()
    gr_total = sum(float(s.get("price", 0)) / 100 for s in gr_sales)
    console.print(f"   Gumroad:      ${gr_total:,.2f}")

    console.print(f"   [bold]Total:        ${pp_total + gr_total:,.2f}[/bold]")
