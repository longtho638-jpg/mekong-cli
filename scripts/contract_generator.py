#!/usr/bin/env python3
"""
📜 Contract Generator CLI
=========================

Generates professional agency-client contracts with "Binh Pháp" style.
Aligned with Mekong Agency OS architecture.

Usage:
    python scripts/contract_generator.py generate --client "Client Co" --fee 5000
    python scripts/contract_generator.py interactive
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import FloatPrompt, IntPrompt, Prompt

from core.legal.generator import (
    ContractGenerator,
    ContractParty,
    ContractType,
    PaymentTerms,
    ServiceScope,
)

# --- Configuration & Setup ---

APP_NAME = "Mekong Contract Generator"
VERSION = "2.0.0"

console = Console()
app = typer.Typer(
    help=f"{APP_NAME} - Professional Agreement System",
    add_completion=False,
    rich_markup_mode="rich",
)

# --- CLI Commands ---


@app.command()
def generate(
    client_name: str = typer.Option(..., help="Client contact name"),
    client_company: str = typer.Option(..., help="Client company name"),
    client_email: str = typer.Option(..., help="Client email"),
    fee: float = typer.Option(..., help="Monthly fee"),
    months: int = typer.Option(6, help="Duration in months"),
    output: Path = typer.Option(None, help="Output file path (default: stdout)"),
):
    """
    ⚡ Quick Generate: Create a contract with default settings.
    """
    # Defaults for quick generation
    agency = ContractParty("Mekong Admin", "Mekong Agency OS", "admin@mekong.os", "HQ")
    client = ContractParty(client_name, client_company, client_email, "TBD")

    scope = ServiceScope(
        services=["Strategy Consulting", "Implementation"],
        deliverables=["Weekly Reports", "Monthly Review"],
        exclusions=["Ad Spend", "Third Party Tools"],
        timeline="Monthly Retainer",
    )

    gen = ContractGenerator(agency)
    contract = gen.generate(client, scope, fee, ContractType.RETAINER, PaymentTerms.NET_30, months)

    text = gen.format_text(contract)

    if output:
        output.write_text(text, encoding="utf-8")
        console.print(f"[green]✅ Contract saved to {output}[/green]")
    else:
        console.print(text)


@app.command()
def interactive():
    """
    🤝 Interactive Mode: Step-by-step contract builder.
    """
    console.print(
        Panel(
            f"[bold blue]Welcome to {APP_NAME}[/bold blue]\n[italic]Let's build a Win-Win-Win agreement.[/italic]"
        )
    )

    # Agency Details (could be loaded from config)
    agency_name = Prompt.ask("Agency Name", default="Mekong Agency")
    agency_email = Prompt.ask("Agency Email", default="contact@mekong.agency")
    agency = ContractParty("Representative", agency_name, agency_email, "Headquarters")

    # Client Details
    console.print("\n[bold]Client Information[/bold]")
    c_name = Prompt.ask("Client Contact Name")
    c_company = Prompt.ask("Client Company")
    c_email = Prompt.ask("Client Email")
    c_address = Prompt.ask("Client Address", default="N/A")
    client = ContractParty(c_name, c_company, c_email, c_address)

    # Contract Details
    console.print("\n[bold]Agreement Details[/bold]")
    c_type_str = Prompt.ask(
        "Contract Type", choices=[t.value for t in ContractType], default="retainer"
    )
    c_type = ContractType(c_type_str)

    fee = FloatPrompt.ask("Monthly Fee ($)")
    months = IntPrompt.ask("Duration (months)", default=6)

    pay_term_str = Prompt.ask(
        "Payment Terms", choices=[t.value for t in PaymentTerms], default="net_30"
    )
    pay_term = PaymentTerms(pay_term_str)

    # Scope
    console.print("\n[bold]Scope of Work (comma separated)[/bold]")
    services = [s.strip() for s in Prompt.ask("Services").split(",")]
    deliverables = [s.strip() for s in Prompt.ask("Deliverables").split(",")]
    exclusions = [
        s.strip()
        for s in Prompt.ask("Exclusions", default="Ad Spend, Software Licenses").split(",")
    ]

    scope = ServiceScope(services, deliverables, exclusions, "As agreed")

    # Generate
    gen = ContractGenerator(agency)
    contract = gen.generate(client, scope, fee, c_type, pay_term, months)

    text = gen.format_text(contract)

    console.print(Panel(text, title="Preview", border_style="green"))

    if Prompt.ask("Save this contract?", choices=["y", "n"], default="y") == "y":
        filename = f"contract_{c_company.replace(' ', '_').lower()}.txt"
        Path(filename).write_text(text, encoding="utf-8")
        console.print(f"[bold green]✅ Saved to {filename}[/bold green]")


if __name__ == "__main__":
    app()
