"""Build command - Compile, package, and optimize project"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import subprocess
import sys
from pathlib import Path
import shutil
import os

app = typer.Typer()
console = Console()


@app.command()
def run(
    clean: bool = typer.Option(False, "--clean", help="Clean build artifacts first"),
    optimize: bool = typer.Option(False, "--optimize", "-O", help="Optimize build"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
    target: str = typer.Option("all", "--target", "-t", help="Build target: all, python, js, docker"),
):
    """Build the project with various options"""

    if clean:
        clean_build()

    console.print(f"[bold]Building for target: {target}[/bold]")

    if target in ["all", "python"]:
        build_python_package(verbose)

    if target in ["all", "js"]:
        build_js_frontend(verbose)

    if target in ["all", "docker"]:
        build_docker_image(verbose)

    console.print("[green]✅ Build completed![/green]")


@app.command()
def clean():
    """Clean build artifacts and cache"""
    clean_build()


def clean_build():
    """Helper function to clean build artifacts"""
    console.print("[yellow]🧹 Cleaning build artifacts...[/yellow]")

    dirs_to_clean = [
        "dist/",
        "build/",
        "*.egg-info/",
        ".pytest_cache/",
        ".ruff_cache/",
        "__pycache__/",
        ".mypy_cache/",
        ".coverage",
        "htmlcov/",
        "coverage.xml",
        "coverage.json",
    ]

    files_to_clean = [
        "*.pyc",
        "*~",
        ".coverage.*",
    ]

    for pattern in dirs_to_clean:
        for path in Path('.').glob(pattern):
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
                console.print(f"  Removed directory: {path}")
            elif path.is_file():
                path.unlink()
                console.print(f"  Removed file: {path}")

    console.print("[green]✅ Clean completed![/green]")


def build_python_package(verbose: bool):
    """Build Python package using Poetry"""
    console.print("[bold blue]📦 Building Python package...[/bold blue]")

    try:
        cmd = [sys.executable, "-m", "poetry", "build"]
        if verbose:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=False)
        else:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)

        console.print("[green]✅ Python package built![/green]")

        # Show built files
        dist_path = Path("dist")
        if dist_path.exists():
            console.print("\n[bold]Built files:[/bold]")
            for file in dist_path.iterdir():
                console.print(f"  {file.name} ({file.stat().st_size} bytes)")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Python build failed![/red]")
        if not verbose and e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[red] poetry not found. Install with: pip install poetry[/red]")


def build_js_frontend(verbose: bool):
    """Build JavaScript frontend"""
    console.print("[bold blue]⚡ Building JS frontend...[/bold blue]")

    # Check if package.json exists
    if not Path("package.json").exists():
        console.print("[dim]No package.json found, skipping JS build[/dim]")
        return

    try:
        cmd = ["npm", "run", "build"]
        if verbose:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=False)
        else:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)

        console.print("[green]✅ JS frontend built![/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ JS build failed![/red]")
        if not verbose and e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[yellow]npm not found, skipping JS build[/yellow]")


def build_docker_image(verbose: bool):
    """Build Docker image"""
    console.print("[bold blue]🐳 Building Docker image...[/bold blue]")

    # Check if Dockerfile exists
    if not Path("Dockerfile").exists():
        console.print("[dim]No Dockerfile found, skipping Docker build[/dim]")
        return

    try:
        image_tag = "mekong-cli:latest"
        cmd = ["docker", "build", "-t", image_tag, "."]
        if verbose:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=False)
        else:
            result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=True, text=True)

        console.print(f"[green]✅ Docker image built: {image_tag}[/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Docker build failed![/red]")
        if not verbose and e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[yellow]docker not found, skipping Docker build[/yellow]")


@app.command()
def info():
    """Show build information and status"""
    console.print(Panel("[bold]Build Information[/bold]", title="Build Status"))

    table = Table(title="Build Status")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="magenta")
    table.add_column("Location", style="dim")

    # Check Python build
    dist_path = Path("dist")
    if dist_path.exists() and any(dist_path.iterdir()):
        table.add_row("Python Package", "✅ Built", str(dist_path.absolute()))
    else:
        table.add_row("Python Package", "❌ Not built", "Run: mekong build")

    # Check JS build
    build_path = Path("build")
    if build_path.exists():
        table.add_row("JS Frontend", "✅ Built", str(build_path.absolute()))
    else:
        table.add_row("JS Frontend", "❌ Not built", "Requires package.json and build script")

    # Check Docker
    try:
        result = subprocess.run(["docker", "images", "mekong-cli"],
                              capture_output=True, text=True)
        if "mekong-cli" in result.stdout:
            table.add_row("Docker Image", "✅ Built", "mekong-cli:latest")
        else:
            table.add_row("Docker Image", "❌ Not built", "Requires Dockerfile")
    except FileNotFoundError:
        table.add_row("Docker Image", "❌ Docker not found", "Install Docker first")

    console.print(table)


@app.command()
def docker(
    tag: str = typer.Option("mekong-cli:latest", "--tag", "-t", help="Image tag"),
    push: bool = typer.Option(False, "--push", help="Push image after building"),
    no_cache: bool = typer.Option(False, "--no-cache", help="Build without cache"),
):
    """Build Docker image specifically"""
    console.print(f"[bold blue]🐳 Building Docker image: {tag}[/bold blue]")

    try:
        cmd = ["docker", "build", "-t", tag]
        if no_cache:
            cmd.append("--no-cache")
        cmd.append(".")

        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        console.print(f"[green]✅ Docker image built: {tag}[/green]")

        if push:
            console.print(f"[bold blue]⬆️  Pushing image: {tag}[/bold blue]")
            push_result = subprocess.run(["docker", "push", tag],
                                       cwd=Path.cwd(), check=True,
                                       capture_output=not verbose, text=True)
            console.print(f"[green]✅ Docker image pushed: {tag}[/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Docker operation failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except FileNotFoundError:
        console.print("[red]docker not found. Install Docker first[/red]")


if __name__ == "__main__":
    app()