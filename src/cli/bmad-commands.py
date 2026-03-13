"""BMAD Workflow CLI Commands."""

import typer
from rich.console import Console
from rich.table import Table
from pathlib import Path
import json
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from packages.core.bmad.catalog import WorkflowCatalog  # noqa: E402
from packages.core.bmad.loader import BMADWorkflowLoader  # noqa: E402

app = typer.Typer(name="bmad", help="BMAD workflow management")
console = Console()


@app.command("list")
def list_workflows(
    agent_type: str = typer.Option(None, "--agent-type", help="Filter by agent type")
) -> None:
    """List available BMAD workflows."""
    try:
        loader = BMADWorkflowLoader()
        workflows = loader.list_workflows(agent_type)

        table = Table(title=f"BMAD Workflows ({len(workflows)} total)")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Agent", style="yellow")
        table.add_column("Description")

        for workflow in workflows:
            desc = workflow.description[:60] + "..." if len(workflow.description) > 60 else workflow.description
            table.add_row(
                workflow.id,
                workflow.name,
                workflow.agent_type,
                desc
            )

        console.print(table)
    except Exception as e:
        console.print(f"[red]Error loading workflows: {e}[/red]")
        raise typer.Exit(1)


@app.command("info")
def workflow_info(workflow_id: str) -> None:
    """Show detailed workflow information."""
    try:
        loader = BMADWorkflowLoader()
        workflow = loader.get_workflow(workflow_id)

        if not workflow:
            console.print(f"[red]Workflow not found: {workflow_id}[/red]")
            raise typer.Exit(1)

        console.print(f"[bold]Workflow:[/bold] {workflow.name}")
        console.print(f"[bold]ID:[/bold] {workflow.id}")
        console.print(f"[bold]Agent Type:[/bold] {workflow.agent_type}")
        console.print(f"[bold]Description:[/bold] {workflow.description}")
        console.print(f"[bold]File:[/bold] {workflow.file_path}")

        if workflow.prerequisites:
            console.print(f"[bold]Prerequisites:[/bold] {', '.join(workflow.prerequisites)}")

        if workflow.parameters:
            console.print("[bold]Parameters:[/bold]")
            for key, value in workflow.parameters.items():
                console.print(f"  - {key}: {value}")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@app.command("catalog")
def build_catalog() -> None:
    """Build and cache workflow catalog."""
    try:
        catalog = WorkflowCatalog()
        data = catalog.build_catalog()

        console.print("[green]Catalog built:[/green]")
        console.print(f"  - Total workflows: {data['total_count']}")
        console.print(f"  - Agent types: {', '.join(data['agent_types'])}")
        console.print(f"  - Cache: {catalog.cache_path}")
    except Exception as e:
        console.print(f"[red]Error building catalog: {e}[/red]")
        raise typer.Exit(1)


@app.command("search")
def search_workflows(query: str) -> None:
    """Search workflows by name or description."""
    try:
        loader = BMADWorkflowLoader()
        results = loader.search_workflows(query)

        console.print(f"[bold]Search results for '{query}':[/bold] {len(results)} found")

        for workflow in results:
            console.print(f"  [cyan]{workflow.id}[/cyan] - {workflow.name} ({workflow.agent_type})")
    except Exception as e:
        console.print(f"[red]Error searching: {e}[/red]")
        raise typer.Exit(1)


@app.command("run")
def run_workflow(
    workflow_id: str,
    context: str = typer.Option(None, help="Context as JSON string")
) -> None:
    """Execute a BMAD workflow."""
    console.print("[yellow]Note: Workflow execution requires orchestrator integration[/yellow]")
    console.print(f"[bold]Workflow ID:[/bold] {workflow_id}")

    if context:
        try:
            context_dict = json.loads(context)
            console.print(f"[bold]Context:[/bold] {context_dict}")
        except json.JSONDecodeError:
            console.print("[red]Invalid JSON context[/red]")
            raise typer.Exit(1)

    console.print("[yellow]Full execution to be implemented in orchestrator integration[/yellow]")


if __name__ == "__main__":
    app()
