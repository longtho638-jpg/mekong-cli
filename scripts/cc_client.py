#!/usr/bin/env python3
"""
Client Management CLI for mekong-cli
Manages client onboarding, portal access, invoicing, and status tracking.
"""

import json
import secrets
import typer
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

app = typer.Typer(help="Client Management CLI for mekong-cli")
console = Console()

# Data file paths
DATA_DIR = Path(__file__).parent.parent / "data" / "client_portal"
CLIENTS_FILE = DATA_DIR / "clients.json"
INVOICES_FILE = DATA_DIR / "invoices.json"


def load_clients() -> dict:
    """Load clients from JSON file."""
    if not CLIENTS_FILE.exists():
        return {}
    with open(CLIENTS_FILE, 'r') as f:
        return json.load(f)


def save_clients(clients: dict):
    """Save clients to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(CLIENTS_FILE, 'w') as f:
        json.dump(clients, f, indent=2)


def load_invoices() -> dict:
    """Load invoices from JSON file."""
    if not INVOICES_FILE.exists():
        return {}
    with open(INVOICES_FILE, 'r') as f:
        return json.load(f)


def save_invoices(invoices: dict):
    """Save invoices to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(INVOICES_FILE, 'w') as f:
        json.dump(invoices, f, indent=2)


def generate_client_id() -> str:
    """Generate unique client ID."""
    return f"CLI-{secrets.token_hex(4).upper()}"


def generate_portal_code() -> str:
    """Generate unique portal access code."""
    return secrets.token_hex(6).upper()


def generate_invoice_id() -> str:
    """Generate unique invoice ID."""
    now = datetime.now()
    random_suffix = secrets.token_hex(2).upper()
    return f"INV-{now.strftime('%Y%m')}-{random_suffix}"


@app.command()
def add(
    name: str = typer.Argument(..., help="Client name"),
    email: str = typer.Option(..., "--email", "-e", help="Client email address"),
    company: Optional[str] = typer.Option(None, "--company", "-c", help="Client company name"),
    retainer: float = typer.Option(2000.0, "--retainer", "-r", help="Monthly retainer amount"),
):
    """
    Onboard a new client.

    Creates a new client with portal access and initializes their account.
    """
    clients = load_clients()

    # Generate client data
    client_id = generate_client_id()
    portal_code = generate_portal_code()

    client_data = {
        "id": client_id,
        "name": name,
        "email": email,
        "company": company or "",
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "portal_code": portal_code,
        "notes": "",
        "monthly_retainer": retainer,
        "total_spent": 0.0
    }

    clients[client_id] = client_data
    save_clients(clients)

    # Display success message
    console.print(Panel.fit(
        f"[green]✓[/green] Client onboarded successfully!\n\n"
        f"[bold]Client ID:[/bold] {client_id}\n"
        f"[bold]Name:[/bold] {name}\n"
        f"[bold]Email:[/bold] {email}\n"
        f"[bold]Company:[/bold] {company or 'N/A'}\n"
        f"[bold]Portal Code:[/bold] {portal_code}\n"
        f"[bold]Monthly Retainer:[/bold] ${retainer:,.2f}",
        title="Client Created",
        border_style="green"
    ))


@app.command()
def list(
    status: Optional[str] = typer.Option(None, "--status", "-s", help="Filter by status (active/inactive)")
):
    """
    List all clients with their status.

    Shows a comprehensive table of all clients and their key information.
    """
    clients = load_clients()

    if not clients:
        console.print("[yellow]No clients found.[/yellow]")
        return

    # Filter by status if specified
    if status:
        clients = {k: v for k, v in clients.items() if v.get("status") == status}

    # Create table
    table = Table(title="Client List", show_header=True, header_style="bold magenta")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="green")
    table.add_column("Email", style="blue")
    table.add_column("Company", style="yellow")
    table.add_column("Status", justify="center")
    table.add_column("Retainer", justify="right", style="green")
    table.add_column("Total Spent", justify="right", style="cyan")
    table.add_column("Created", style="dim")

    for client in clients.values():
        status_display = "✓" if client.get("status") == "active" else "✗"
        status_color = "green" if client.get("status") == "active" else "red"

        created_date = datetime.fromisoformat(client.get("created_at", "")).strftime("%Y-%m-%d")

        table.add_row(
            client.get("id"),
            client.get("name"),
            client.get("email"),
            client.get("company", "N/A"),
            f"[{status_color}]{status_display}[/{status_color}]",
            f"${client.get('monthly_retainer', 0):,.2f}",
            f"${client.get('total_spent', 0):,.2f}",
            created_date
        )

    console.print(table)
    console.print(f"\n[dim]Total clients: {len(clients)}[/dim]")


@app.command()
def portal(
    client_id: str = typer.Argument(..., help="Client ID"),
):
    """
    Generate client portal link.

    Creates a secure portal access URL for the specified client.
    """
    clients = load_clients()

    if client_id not in clients:
        console.print(f"[red]✗[/red] Client {client_id} not found.")
        raise typer.Exit(1)

    client = clients[client_id]
    portal_code = client.get("portal_code")

    # Generate portal URL (placeholder - replace with actual domain)
    portal_url = f"https://portal.binhphap.agency/client/{portal_code}"

    console.print(Panel.fit(
        f"[bold]Client:[/bold] {client.get('name')}\n"
        f"[bold]Email:[/bold] {client.get('email')}\n"
        f"[bold]Portal Code:[/bold] {portal_code}\n\n"
        f"[bold cyan]Portal URL:[/bold cyan]\n{portal_url}",
        title=f"Portal Access - {client_id}",
        border_style="cyan"
    ))

    console.print(f"\n[dim]Share this URL with {client.get('name')} for secure portal access.[/dim]")


@app.command()
def invoice(
    client_id: str = typer.Argument(..., help="Client ID"),
    amount: float = typer.Argument(..., help="Invoice amount"),
    description: str = typer.Option("Service Fee", "--description", "-d", help="Invoice description"),
    due_days: int = typer.Option(30, "--due-days", help="Days until invoice is due"),
):
    """
    Create an invoice for a client.

    Generates a new invoice and updates the client's total spent.
    """
    clients = load_clients()
    invoices = load_invoices()

    if client_id not in clients:
        console.print(f"[red]✗[/red] Client {client_id} not found.")
        raise typer.Exit(1)

    client = clients[client_id]

    # Generate invoice
    invoice_id = generate_invoice_id()
    due_date = datetime.now() + timedelta(days=due_days)

    invoice_data = {
        "id": invoice_id,
        "client_id": client_id,
        "project_id": None,
        "amount": amount,
        "status": "draft",
        "due_date": due_date.isoformat(),
        "paid_date": None,
        "items": [
            {
                "name": description,
                "amount": amount
            }
        ],
        "notes": ""
    }

    invoices[invoice_id] = invoice_data
    save_invoices(invoices)

    console.print(Panel.fit(
        f"[green]✓[/green] Invoice created successfully!\n\n"
        f"[bold]Invoice ID:[/bold] {invoice_id}\n"
        f"[bold]Client:[/bold] {client.get('name')} ({client_id})\n"
        f"[bold]Amount:[/bold] ${amount:,.2f}\n"
        f"[bold]Description:[/bold] {description}\n"
        f"[bold]Status:[/bold] Draft\n"
        f"[bold]Due Date:[/bold] {due_date.strftime('%Y-%m-%d')}",
        title="Invoice Created",
        border_style="green"
    ))


@app.command()
def status(
    client_id: str = typer.Argument(..., help="Client ID"),
):
    """
    Show client health/status report.

    Displays comprehensive client information including invoices and spending.
    """
    clients = load_clients()
    invoices = load_invoices()

    if client_id not in clients:
        console.print(f"[red]✗[/red] Client {client_id} not found.")
        raise typer.Exit(1)

    client = clients[client_id]

    # Get client invoices
    client_invoices = [inv for inv in invoices.values() if inv.get("client_id") == client_id]

    # Calculate statistics
    total_invoices = len(client_invoices)
    paid_invoices = len([inv for inv in client_invoices if inv.get("status") == "paid"])
    draft_invoices = len([inv for inv in client_invoices if inv.get("status") == "draft"])
    overdue_invoices = len([
        inv for inv in client_invoices
        if inv.get("status") not in ["paid", "cancelled"]
        and datetime.fromisoformat(inv.get("due_date")) < datetime.now()
    ])

    total_billed = sum(inv.get("amount", 0) for inv in client_invoices)
    total_paid = sum(inv.get("amount", 0) for inv in client_invoices if inv.get("status") == "paid")
    outstanding = total_billed - total_paid

    # Determine health status
    if overdue_invoices > 0:
        health = "[red]⚠ Needs Attention[/red]"
    elif outstanding > 0:
        health = "[yellow]⚡ Outstanding Balance[/yellow]"
    else:
        health = "[green]✓ Healthy[/green]"

    # Display client status
    console.print(Panel.fit(
        f"[bold cyan]Client Information[/bold cyan]\n"
        f"[bold]Name:[/bold] {client.get('name')}\n"
        f"[bold]Email:[/bold] {client.get('email')}\n"
        f"[bold]Company:[/bold] {client.get('company', 'N/A')}\n"
        f"[bold]Status:[/bold] {client.get('status').upper()}\n"
        f"[bold]Created:[/bold] {datetime.fromisoformat(client.get('created_at')).strftime('%Y-%m-%d')}\n\n"
        f"[bold cyan]Financial Overview[/bold cyan]\n"
        f"[bold]Monthly Retainer:[/bold] ${client.get('monthly_retainer', 0):,.2f}\n"
        f"[bold]Total Billed:[/bold] ${total_billed:,.2f}\n"
        f"[bold]Total Paid:[/bold] ${total_paid:,.2f}\n"
        f"[bold]Outstanding:[/bold] ${outstanding:,.2f}\n\n"
        f"[bold cyan]Invoice Summary[/bold cyan]\n"
        f"[bold]Total Invoices:[/bold] {total_invoices}\n"
        f"[bold]Paid:[/bold] {paid_invoices}\n"
        f"[bold]Draft:[/bold] {draft_invoices}\n"
        f"[bold]Overdue:[/bold] {overdue_invoices}\n\n"
        f"[bold cyan]Health Status[/bold cyan]\n{health}",
        title=f"Client Status - {client_id}",
        border_style="cyan"
    ))

    # Display recent invoices if any
    if client_invoices:
        console.print("\n[bold]Recent Invoices:[/bold]")
        table = Table(show_header=True, header_style="bold")
        table.add_column("Invoice ID", style="cyan")
        table.add_column("Amount", justify="right", style="green")
        table.add_column("Status", justify="center")
        table.add_column("Due Date", style="yellow")

        # Show last 5 invoices
        for inv in sorted(client_invoices, key=lambda x: x.get("due_date", ""), reverse=True)[:5]:
            status_color = {
                "paid": "green",
                "draft": "yellow",
                "pending": "blue",
                "overdue": "red"
            }.get(inv.get("status", ""), "white")

            table.add_row(
                inv.get("id"),
                f"${inv.get('amount', 0):,.2f}",
                f"[{status_color}]{inv.get('status', 'N/A').upper()}[/{status_color}]",
                datetime.fromisoformat(inv.get("due_date")).strftime("%Y-%m-%d") if inv.get("due_date") else "N/A"
            )

        console.print(table)


if __name__ == "__main__":
    app()
