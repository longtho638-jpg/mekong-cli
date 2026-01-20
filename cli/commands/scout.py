"""
Scout CLI Command
=================
Codebase intelligence and search command.
"""

from antigravity.core.scout import scout_engine

import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="🔍 Scout - Codebase Intelligence")
console = Console()


@app.command("files")
def search_files(
    pattern: str = typer.Argument(..., help="File pattern to search for"),
    limit: int = typer.Option(20, "--limit", "-l", help="Max results"),
):
    """Search for files by name pattern."""
    with console.status(f"[cyan]Scouting files matching '{pattern}'..."):
        report = scout_engine.search_files(pattern, limit=limit)

    if not report.results:
        console.print(f"[yellow]No files found matching '{pattern}'")
        return

    table = Table(title=f"🔍 Scout: {report.total_found} files ({report.duration_ms:.1f}ms)")
    table.add_column("Path", style="cyan")

    for result in report.results:
        table.add_row(result.path)

    console.print(table)


@app.command("content")
def search_content(
    query: str = typer.Argument(..., help="Text to search for"),
    pattern: str = typer.Option("*", "--glob", "-g", help="File glob pattern"),
    limit: int = typer.Option(20, "--limit", "-l", help="Max results"),
):
    """Search for content within files."""
    with console.status(f"[cyan]Scouting content '{query}'..."):
        report = scout_engine.search_content(query, file_pattern=pattern, limit=limit)

    if not report.results:
        console.print(f"[yellow]No matches found for '{query}'")
        return

    table = Table(title=f"🔍 Scout: {report.total_found} matches ({report.duration_ms:.1f}ms)")
    table.add_column("File", style="cyan")
    table.add_column("Line", style="yellow")
    table.add_column("Content", style="white")

    for result in report.results:
        table.add_row(
            result.path.split("/")[-1],
            str(result.line_number or "?"),
            (result.content[:60] + "...") if len(result.content or "") > 60 else result.content,
        )

    console.print(table)


@app.command("def")
def find_definition(
    symbol: str = typer.Argument(..., help="Symbol name to find"),
    lang: str = typer.Option(
        "python", "--lang", "-L", help="Language: python, javascript, typescript"
    ),
):
    """Find function, class, or variable definitions."""
    with console.status(f"[cyan]Finding definitions of '{symbol}'..."):
        report = scout_engine.find_definitions(symbol, language=lang)

    if not report.results:
        console.print(f"[yellow]No definitions found for '{symbol}'")
        return

    table = Table(title=f"🔍 Definitions of '{symbol}' ({report.total_found} found)")
    table.add_column("File", style="cyan")
    table.add_column("Line", style="yellow")
    table.add_column("Match", style="green")

    for result in report.results:
        table.add_row(
            result.path.split("/")[-1],
            str(result.line_number or "?"),
            (result.content[:50] + "...") if len(result.content or "") > 50 else result.content,
        )

    console.print(table)


@app.callback(invoke_without_command=True)
def scout_main(
    ctx: typer.Context,
    query: str = typer.Argument(None, help="Quick search query"),
):
    """
    🔍 Scout - Codebase Intelligence

    Quick search: mekong scout <query>
    File search: mekong scout files <pattern>
    Content search: mekong scout content <query>
    Find definitions: mekong scout def <symbol>
    """
    if ctx.invoked_subcommand is None and query:
        # Auto-detect search type
        with console.status(f"[cyan]Scouting '{query}'..."):
            report = scout_engine.scout(query)

        console.print(
            f"[bold green]Found {report.total_found} results ({report.search_type}) in {report.duration_ms:.1f}ms[/]"
        )
        for result in report.results[:10]:
            if result.line_number:
                console.print(f"  [cyan]{result.path}[/]:[yellow]{result.line_number}[/]")
            else:
                console.print(f"  [cyan]{result.path}[/]")
