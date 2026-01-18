import typer
from rich.console import Console

console = Console()
sales_app = typer.Typer(help="💼 Quản lý Sales & Sản phẩm")

@sales_app.command("products-list")
def list_products():
    """List sellable assets."""
    from core.sales.catalog import ProductCatalogService
    service = ProductCatalogService()
    for key, spec in service.list_products().items():
        console.print(f"[bold]{key}[/bold]: {spec['name']} (${spec['price']/100})")

@sales_app.command("products-build")
def build_product(key: str = typer.Argument(..., help="Product Key")):
    """Build a product ZIP."""
    from core.sales.catalog import ProductCatalogService
    service = ProductCatalogService()
    try:
        path = service.build_product(key)
        console.print(f"[green]✅ Built product:[/green] {path}")
    except Exception as e:
        console.print(f"[red]❌ Build failed:[/red] {e}")

@sales_app.command("products-publish")
def publish_products(
    dry_run: bool = typer.Option(True, "--dry-run/--execute", help="Preview or execute publishing"),
):
    """Batch publish products to Gumroad."""
    from core.sales.publisher import GumroadPublisher
    
    publisher = GumroadPublisher()
    
    if dry_run:
        info = publisher.dry_run()
        console.print("\n[bold]🏯 GUMROAD BATCH PUBLISHER (Dry Run)[/bold]")
        console.print("=" * 60)
        
        if info["missing_files"]:
            console.print("[red]❌ Missing Files:[/red]")
            for f in info["missing_files"]:
                console.print(f"   - {f}")
            console.print("\n[yellow]⚠️  Run 'products-build' to generate these files first.[/yellow]")
            return

        for i, p in enumerate(info["products"], 1):
            console.print(f"{i}. [bold]{p['name']}[/bold]")
            console.print(f"   Price: ${p['price']/100:.2f}")
            console.print(f"   ZIP: {p['zip_path']}")
            console.print()
            
        console.print(f"📊 Total Value: ${info['total_value']:.2f}")
        
        if not info["has_token"]:
            console.print("\n[yellow]⚠️  GUMROAD_ACCESS_TOKEN not set in environment.[/yellow]")
        else:
            console.print("\n[green]✅ Token detected. Ready to publish.[/green]")
            
        console.print("\nRun with [bold]--execute[/bold] to publish.")
    else:
        try:
            console.print("[bold]🚀 Publishing to Gumroad...[/bold]")
            results = publisher.publish_all()
            
            console.print("\n[bold]Publishing Report:[/bold]")
            for res in results:
                if res["status"] == "success":
                    console.print(f"✅ {res['name']} -> {res['url']}")
                else:
                    console.print(f"❌ {res['name']} -> {res['error']}")
                    
        except ValueError as e:
            console.print(f"[red]Error: {e}[/red]")

@sales_app.command("proposal-create")
def create_proposal(
    template: str = typer.Argument(..., help="ghost_cto | venture"),
    email: str = typer.Argument(..., help="Client Email")
):
    """Generate a proposal."""
    from core.sales.proposals import ProposalService
    service = ProposalService()
    path = service.generate_proposal(template, email)
    if path:
        console.print(f"[green]✅ Proposal generated:[/green] {path}")
    else:
        console.print("[red]❌ Template not found[/red]")

@sales_app.command("contract-create")
def create_contract(
    client: str = typer.Argument(..., help="Client Company Name"),
    fee: float = typer.Argument(..., help="Monthly Fee"),
    months: int = typer.Option(6, help="Duration in months"),
    output: str = typer.Option(None, help="Output file path")
):
    """Generate a service contract."""
    from core.legal.generator import (
        ContractGenerator,
        ContractParty,
        ContractType,
        PaymentTerms,
        ServiceScope,
    )
    
    # Defaults
    agency = ContractParty("Mekong Admin", "Mekong Agency OS", "admin@mekong.os", "HQ")
    client_party = ContractParty("Representative", client, "email@example.com", "Address TBD")
    
    scope = ServiceScope(
        services=["Strategy", "Execution"],
        deliverables=["Reports"],
        exclusions=["Ads"],
        timeline="Monthly"
    )
    
    gen = ContractGenerator(agency)
    contract = gen.generate(
        client_party, scope, fee, ContractType.RETAINER, PaymentTerms.NET_30, months
    )
    
    text = gen.format_text(contract)
    
    if output:
        from pathlib import Path
        Path(output).write_text(text, encoding="utf-8")
        console.print(f"[green]✅ Contract saved to {output}[/green]")
    else:
        console.print(text)