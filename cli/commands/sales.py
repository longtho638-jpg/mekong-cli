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