"""
Mekong CLI Clean Command - Clean cache, temp files, build artifacts
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Confirm
from pathlib import Path
import shutil

app = typer.Typer(name="clean", help="Clean cache, temp files, build artifacts")
console = Console()


# Directories and files to clean
CLEAN_TARGETS = {
    "cache": [
        ".mekong/cache",
        ".mekong/llm_cache",
        ".mekong/vector_cache",
        "__pycache__",
        "**/__pycache__",
        "*.pyc",
        "**/*.pyc",
    ],
    "build": [
        "build",
        "dist",
        "*.egg-info",
        "**/*.egg-info",
        ".eggs",
    ],
    "temp": [
        ".mekong/tmp",
        ".mekong/temp",
        "*.tmp",
        "**/*.tmp",
        ".pytest_cache",
        ".mypy_cache",
    ],
    "logs": [
        "*.log",
        "**/*.log",
        ".mekong/logs",
    ],
    "all": [
        # Everything above
    ],
}


def get_clean_patterns(target: str) -> list:
    """Get clean patterns for a specific target"""
    if target == "all":
        all_patterns = []
        for key in ["cache", "build", "temp", "logs"]:
            all_patterns.extend(CLEAN_TARGETS[key])
        return all_patterns
    return CLEAN_TARGETS.get(target, [])


def find_files_to_clean(base_path: Path, patterns: list) -> list:
    """Find files and directories matching patterns"""
    to_clean = []

    for pattern in patterns:
        # Handle ** glob patterns
        if "**" in pattern:
            try:
                matches = list(base_path.glob(pattern))
                to_clean.extend(matches)
            except Exception:
                pass
        else:
            # Simple glob
            matches = list(base_path.glob(pattern))
            to_clean.extend(matches)

    # Remove duplicates and sort
    unique = list(set(to_clean))
    unique.sort(key=lambda x: str(x))

    return unique


def human_readable_size(path: Path) -> str:
    """Get human-readable size of a file or directory"""
    try:
        if path.is_file():
            size = path.stat().st_size
        elif path.is_dir():
            size = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
        else:
            return "N/A"

        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    except Exception:
        return "N/A"


@app.command()
def cache() -> None:
    """Clean LLM and vector cache"""
    _clean_target("cache", "cache files")


@app.command()
def build() -> None:
    """Clean build artifacts"""
    _clean_target("build", "build artifacts")


@app.command()
def temp() -> None:
    """Clean temporary files"""
    _clean_target("temp", "temporary files")


@app.command()
def logs() -> None:
    """Clean log files"""
    _clean_target("logs", "log files")


@app.command()
def all(dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Show what would be cleaned")) -> None:
    """Clean everything (cache, build, temp, logs)"""
    console.print(
        Panel(
            "🧹 Mekong CLI - Full Clean",
            border_style="cyan",
        )
    )

    base_path = Path.cwd()
    all_patterns = get_clean_patterns("all")

    console.print("[bold]Searching for files to clean...[/bold]\n")

    to_clean = find_files_to_clean(base_path, all_patterns)

    if not to_clean:
        console.print("[green]✓ Nothing to clean![/green]")
        return

    # Show what will be cleaned
    table = Table(title=f"{'Would delete' if dry_run else 'Deleting'} ({len(to_clean)} items)")
    table.add_column("Path", style="cyan")
    table.add_column("Type", style="yellow")
    table.add_column("Size", style="dim")

    total_size = 0

    for path in to_clean:
        size_str = human_readable_size(path)
        try:
            size_num = float(size_str.split()[0])
            size_unit = size_str.split()[1]
            if size_unit == "MB":
                total_size += size_num * 1024 * 1024
            elif size_unit == "KB":
                total_size += size_num * 1024
            elif size_unit == "GB":
                total_size += size_num * 1024 * 1024 * 1024
            else:
                total_size += size_num
        except Exception:
            pass

        file_type = "dir" if path.is_dir() else "file"
        table.add_row(str(path.relative_to(base_path)), file_type, size_str)

    console.print(table)

    total_size_str = human_readable_size(Path(str(total_size)))
    console.print(f"\n[bold]Total: {len(to_clean)} items, ~{total_size_str}[/bold]")

    if dry_run:
        console.print("\n[yellow]Dry run - nothing was deleted[/yellow]")
        console.print("[dim]Run 'mekong clean all' without --dry-run to delete[/dim]")
        return

    # Confirm deletion
    if not Confirm.ask("\n[yellow]Delete these files?[/yellow]", default=False):
        console.print("[dim]Cancelled[/dim]")
        return

    # Delete
    deleted_count = 0
    for path in to_clean:
        try:
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
            deleted_count += 1
        except Exception as e:
            console.print(f"[red]✗ Failed to delete {path}: {e}[/red]")

    console.print(f"\n[green]✓ Deleted {deleted_count}/{len(to_clean)} items[/green]")


def _clean_target(target: str, description: str) -> None:
    """Clean a specific target category"""
    base_path = Path.cwd()
    patterns = get_clean_patterns(target)

    console.print(
        Panel(
            f"🧹 Cleaning {description}...",
            border_style="yellow",
        )
    )

    to_clean = find_files_to_clean(base_path, patterns)

    if not to_clean:
        console.print(f"[green]✓ No {description} found[/green]")
        return

    table = Table(title=f"Deleting {description} ({len(to_clean)} items)")
    table.add_column("Path", style="cyan")
    table.add_column("Size", style="dim")

    for path in to_clean:
        table.add_row(str(path.relative_to(base_path)), human_readable_size(path))

    console.print(table)

    if not Confirm.ask(f"\nDelete {len(to_clean)} {description}?", default=False):
        console.print("[dim]Cancelled[/dim]")
        return

    deleted_count = 0
    for path in to_clean:
        try:
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
            deleted_count += 1
        except Exception as e:
            console.print(f"[red]✗ Failed to delete {path}: {e}[/red]")

    console.print(f"\n[green]✓ Deleted {deleted_count}/{len(to_clean)} {description}[/green]")


@app.command()
def list(target: str = typer.Option("all", "--target", "-t", help="Target category")) -> None:
    """List files that would be cleaned (dry run)"""
    base_path = Path.cwd()
    patterns = get_clean_patterns(target) if target != "all" else get_clean_patterns("all")

    console.print(
        Panel(
            f"📋 Files matching '{target}' patterns",
            border_style="blue",
        )
    )

    to_clean = find_files_to_clean(base_path, patterns)

    if not to_clean:
        console.print("[green]✓ No files found[/green]")
        return

    table = Table(title=f"Matched files ({len(to_clean)} items)")
    table.add_column("Path", style="cyan")
    table.add_column("Type", style="yellow")
    table.add_column("Size", style="dim")

    for path in to_clean:
        table.add_row(
            str(path.relative_to(base_path)),
            "dir" if path.is_dir() else "file",
            human_readable_size(path),
        )

    console.print(table)


def main():
    """Entry point for clean command"""
    app()


if __name__ == "__main__":
    app()
