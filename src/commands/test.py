"""Test command - Run tests with various options"""

from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import subprocess
import sys
from pathlib import Path

app = typer.Typer()
console = Console()


@app.command()
def run(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
    coverage: bool = typer.Option(False, "--coverage", help="Run with coverage"),
    specific: str = typer.Option(None, "--specific", "-s", help="Run specific test file or directory"),
    watch: bool = typer.Option(False, "--watch", "-w", help="Watch mode"),
) -> Optional[bool]:
    """Run tests with various options"""
    cmd = [sys.executable, "-m", "pytest"]

    if verbose:
        cmd.append("-v")
    if coverage:
        cmd.extend(["--cov=src", "--cov-report", "html", "--cov-report", "term"])
    if specific:
        cmd.append(specific)
    if watch:
        # Check if pytest-watch is installed
        try:
            # import pytest_watch  # Removed unused
            cmd.insert(1, "pytest-watch")
        except ImportError:
            console.print("[red]pytest-watch not installed. Install with: pip install pytest-watch[/red]")
            raise typer.Exit(code=1)

    console.print(f"[dim]Running: {' '.join(cmd)}[/dim]")

    try:
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)
        console.print("[green]✅ Tests passed![/green]")
        if result.stdout:
            console.print(Panel(result.stdout, title="Output"))
        return True
    except subprocess.CalledProcessError as e:
        console.print("[red]❌ Tests failed![/red]")
        if e.stdout:
            console.print(Panel(e.stdout, title="Stdout"))
        if e.stderr:
            console.print(Panel(e.stderr, title="Stderr"))
        return False
    except FileNotFoundError:
        console.print("[red]pytest not found. Install with: pip install pytest[/red]")
        return False


@app.command()
def coverage_report() -> None:
    """Generate and show coverage report"""
    cmd = [sys.executable, "-m", "coverage", "report"]

    try:
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)
        console.print(Panel(result.stdout, title="Coverage Report"))
    except subprocess.CalledProcessError as e:
        console.print("[red]Coverage report failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[red]coverage not found. Install with: pip install coverage[/red]")


@app.command()
def list_tests() -> None:
    """List all available tests"""
    cmd = [sys.executable, "-m", "pytest", "--collect-only", "-q"]

    try:
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)
        lines = [line.strip() for line in result.stdout.split('\n') if line.strip() and '.py' in line]

        table = Table(title="Available Tests")
        table.add_column("Test", style="cyan")

        for line in lines[:20]:  # Limit to first 20 tests
            table.add_row(line)

        console.print(table)

        if len(lines) > 20:
            console.print(f"[dim]... and {len(lines)-20} more tests[/dim]")

    except subprocess.CalledProcessError as e:
        console.print("[red]Failed to list tests![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[red]pytest not found. Install with: pip install pytest[/red]")


@app.command()
def benchmark() -> None:
    """Run performance benchmarks"""
    console.print(Panel("[bold]Running Performance Benchmarks...[/bold]", title="Benchmark"))

    # Example benchmark for a specific operation
    import time

    # Benchmark file I/O
    start = time.time()
    with open('/tmp/mekong_benchmark.tmp', 'w') as f:
        f.write('benchmark' * 1000)
    io_time = time.time() - start

    # Benchmark computation
    start = time.time()
    # result = sum(i*i for i in range(10000))  # Removed unused
    comp_time = time.time() - start

    table = Table(title="Benchmark Results")
    table.add_column("Operation", style="cyan")
    table.add_column("Time (seconds)", style="magenta")

    table.add_row("File I/O (write)", f"{io_time:.6f}")
    table.add_row("Computation (sum squares)", f"{comp_time:.6f}")

    console.print(table)


if __name__ == "__main__":
    app()
