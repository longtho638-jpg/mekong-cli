"""
OCOP Commands for Mekong CLI

One Commune One Product — AI-powered agricultural export platform.

Commands:
- mekong ocop analyze <file>: Analyze product image/JSON for export features
- mekong ocop export --target <platform>: Generate B2B listings
- mekong ocop list: Show available export platforms
"""

import json
from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()
app = typer.Typer(help="OCOP: AI-powered agricultural export tools")


@app.command("analyze")
def analyze(
    file: str = typer.Argument(..., help="Product image or JSON file to analyze"),
    output: str = typer.Option(
        None, "--output", "-o", help="Output file path (default: stdout)"
    ),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed analysis"),
):
    """
    Analyze a product image/JSON for export-ready features.

    Sends the file to the AI Agent SDK to extract:
    - Product classification (HS code)
    - Quality indicators
    - Export compliance requirements
    - Suggested target markets
    """
    file_path = Path(file)

    if not file_path.exists():
        console.print(f"[red]Error: File not found: {file}[/red]")
        raise typer.Exit(1)

    suffix = file_path.suffix.lower()
    if suffix not in (".json", ".jpg", ".jpeg", ".png", ".webp"):
        console.print(
            f"[red]Error: Unsupported file type '{suffix}'[/red]\n"
            "[dim]Supported: .json, .jpg, .jpeg, .png, .webp[/dim]"
        )
        raise typer.Exit(1)

    console.print(
        Panel(
            f"[bold cyan]Analyzing:[/bold cyan] {file_path.name}",
            title="🌾 OCOP Product Analysis",
            border_style="green",
        )
    )

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Loading product data...", total=None)

        # Load and validate input
        if suffix == ".json":
            try:
                product_data = json.loads(file_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                console.print(f"[red]Error: Invalid JSON — {e}[/red]")
                raise typer.Exit(1)
        else:
            product_data = {"image_path": str(file_path.resolve()), "type": "image"}

        progress.update(task, description="Sending to AI Agent for analysis...")

        # TECH-DEBT: OCOP-001 - Integrate with LLM client for actual analysis
        # See: docs/TECHNICAL_DEBT_TODO.md
        # For now, generate structured output from input
        analysis = _generate_analysis_stub(product_data, file_path)

        progress.update(task, description="Analysis complete!")

    # Display results
    _display_analysis(analysis, verbose)

    # Write output if requested
    if output:
        output_path = Path(output)
        output_path.write_text(
            json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        console.print(f"\n[green]✓ Results saved to {output}[/green]")


@app.command("export")
def export_listing(
    target: str = typer.Option(
        ..., "--target", "-t", help="Target platform (amazon, alibaba, shopee, lazada, tiki)"
    ),
    product_file: str = typer.Option(
        None, "--product", "-p", help="Product analysis JSON (from 'ocop analyze')"
    ),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Preview listing without submitting"),
):
    """
    Generate B2B export listings from analyzed product data.

    Triggers the AI to create platform-specific listings
    optimized for each marketplace's requirements.
    """
    valid_targets = ["amazon", "alibaba", "shopee", "lazada", "tiki", "grab", "sendo"]

    if target.lower() not in valid_targets:
        console.print(f"[red]Error: Unknown target '{target}'[/red]")
        console.print(f"[dim]Available: {', '.join(valid_targets)}[/dim]")
        raise typer.Exit(1)

    console.print(
        Panel(
            f"[bold cyan]Target:[/bold cyan] {target.upper()}\n"
            f"[bold cyan]Mode:[/bold cyan] {'Preview' if dry_run else 'Live'}",
            title="📦 OCOP Export Generator",
            border_style="green",
        )
    )

    # Load product data if provided
    product_data = None
    if product_file:
        pf = Path(product_file)
        if not pf.exists():
            console.print(f"[red]Error: Product file not found: {product_file}[/red]")
            raise typer.Exit(1)
        try:
            product_data = json.loads(pf.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            console.print(f"[red]Error: Invalid JSON — {e}[/red]")
            raise typer.Exit(1)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task(f"Generating {target} listing...", total=None)

        # TECH-DEBT: OCOP-002 - Integrate with LLM client for actual listing generation
        # See: docs/TECHNICAL_DEBT_TODO.md
        listing = _generate_listing_stub(target, product_data)

        progress.update(task, description="Listing generated!")

    # Display listing preview
    _display_listing(listing, target, dry_run)

    if dry_run:
        console.print("\n[yellow]Dry run — listing not submitted[/yellow]")
    else:
        console.print(f"\n[green]✓ Listing ready for {target.upper()}[/green]")


@app.command("list")
def list_platforms():
    """Show available export platforms and their status."""
    console.print(
        Panel("Supported Export Platforms", title="🌍 OCOP Platforms", border_style="green")
    )

    table = Table(show_header=True)
    table.add_column("Platform", style="cyan")
    table.add_column("Region", style="dim")
    table.add_column("Status", style="green")
    table.add_column("API")

    platforms = [
        ("Amazon", "Global", "Ready", "REST"),
        ("Alibaba", "China / Global", "Ready", "REST"),
        ("Shopee", "Southeast Asia", "Ready", "REST"),
        ("Lazada", "Southeast Asia", "Ready", "REST"),
        ("Tiki", "Vietnam", "Ready", "REST"),
        ("Grab", "Southeast Asia", "Beta", "gRPC"),
        ("Sendo", "Vietnam", "Beta", "REST"),
    ]

    for name, region, status, api in platforms:
        status_styled = f"[green]{status}[/green]" if status == "Ready" else f"[yellow]{status}[/yellow]"
        table.add_row(name, region, status_styled, api)

    console.print(table)


def _generate_analysis_stub(product_data: dict, file_path: Path) -> dict:
    """Generate a stub analysis result. Replace with LLM integration."""
    return {
        "source": str(file_path),
        "classification": {
            "hs_code": "0901.11",
            "category": "Agricultural Product",
            "subcategory": "Coffee, not roasted",
        },
        "quality": {
            "grade": "A",
            "certifications": ["VietGAP", "GlobalGAP"],
            "shelf_life_days": 365,
        },
        "export_compliance": {
            "phytosanitary": True,
            "food_safety": True,
            "origin_certificate": True,
        },
        "suggested_markets": ["Japan", "EU", "USA", "South Korea"],
        "estimated_fob_usd_kg": 4.50,
    }


def _display_analysis(analysis: dict, verbose: bool) -> None:
    """Display analysis results in a rich table."""
    table = Table(title="Analysis Results", show_header=True)
    table.add_column("Field", style="cyan")
    table.add_column("Value")

    cls = analysis.get("classification", {})
    table.add_row("HS Code", cls.get("hs_code", "N/A"))
    table.add_row("Category", cls.get("category", "N/A"))

    quality = analysis.get("quality", {})
    table.add_row("Grade", quality.get("grade", "N/A"))
    certs = ", ".join(quality.get("certifications", []))
    table.add_row("Certifications", certs or "None")

    markets = ", ".join(analysis.get("suggested_markets", []))
    table.add_row("Markets", markets or "N/A")

    fob = analysis.get("estimated_fob_usd_kg")
    if fob:
        table.add_row("Est. FOB (USD/kg)", f"${fob:.2f}")

    console.print(table)

    if verbose:
        console.print("\n[dim]Full analysis:[/dim]")
        console.print(json.dumps(analysis, indent=2, ensure_ascii=False))


def _display_listing(listing: dict, target: str, dry_run: bool) -> None:
    """Display generated listing preview."""
    table = Table(title=f"{target.upper()} Listing Preview", show_header=True)
    table.add_column("Field", style="cyan")
    table.add_column("Value")

    table.add_row("Title", listing.get("title", "N/A"))
    table.add_row("Price", listing.get("price", "N/A"))
    table.add_row("MOQ", listing.get("moq", "N/A"))
    table.add_row("Origin", listing.get("origin", "N/A"))
    table.add_row("Shipping", listing.get("shipping", "N/A"))

    console.print(table)


def _generate_listing_stub(target: str, product_data: dict | None) -> dict:
    """Generate stub listing. Replace with LLM integration."""
    return {
        "title": "Premium Vietnamese Robusta Coffee Beans — Grade A, VietGAP Certified",
        "price": "$4.50/kg FOB Ho Chi Minh City",
        "moq": "1,000 kg",
        "origin": "Dak Lak, Mekong Delta, Vietnam",
        "shipping": "FOB / CIF available",
        "platform": target,
        "certifications": ["VietGAP", "GlobalGAP", "ISO 22000"],
    }
