"""
Mekong CLI Doctor Command - Diagnostic tool
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
import sys
import subprocess
import importlib.util
from pathlib import Path

app = typer.Typer(name="doctor", help="Diagnostic tool - check system requirements")
console = Console()


@app.command()
def diagnose() -> None:
    """Run full diagnostic check"""
    console.print(
        Panel(
            Text("👨‍⚕️ Mekong CLI Doctor", style="bold cyan"),
            subtitle="Diagnosing system requirements...",
            border_style="cyan",
        )
    )

    checks = []
    all_passed = True

    # Check 1: Python version
    console.print("\n[bold]1. Python Version[/bold]")
    py_version = sys.version_info
    py_str = f"{py_version.major}.{py_version.minor}.{py_version.micro}"

    if py_version.major == 3 and py_version.minor >= 9:
        console.print(f"  [green]✓[/green] Python {py_str} (required: 3.9+)")
        checks.append(("Python Version", "PASS", py_str))
    else:
        console.print(f"  [red]✗[/red] Python {py_str} (required: 3.9+)")
        console.print("  [dim]Upgrade Python to continue[/dim]")
        checks.append(("Python Version", "FAIL", py_str))
        all_passed = False

    # Check 2: Required packages
    console.print("\n[bold]2. Required Packages[/bold]")
    required_packages = {
        "typer": "typer",
        "rich": "rich",
        "pydantic": "pydantic",
        "dotenv": "python-dotenv",
        "httpx": "httpx",
    }

    packages_installed = []
    packages_missing = []

    for import_name, pip_name in required_packages.items():
        spec = importlib.util.find_spec(import_name)
        if spec:
            packages_installed.append(pip_name)
            console.print(f"  [green]✓[/green] {pip_name}")
        else:
            packages_missing.append(pip_name)
            console.print(f"  [red]✗[/red] {pip_name} (not installed)")

    if packages_missing:
        console.print("\n  [yellow]Install missing packages:[/yellow]")
        console.print(f"  [dim]pip3 install {' '.join(packages_missing)}[/dim]")
        all_passed = False

    checks.append(("Required Packages", "PASS" if not packages_missing else "FAIL", f"{len(packages_installed)}/{len(required_packages)}"))

    # Check 3: Directory structure
    console.print("\n[bold]3. Directory Structure[/bold]")
    required_dirs = ["src", "src/core", "src/agents", "recipes", ".mekong"]
    cwd = Path.cwd()

    dirs_exist = []
    dirs_missing = []

    for dir_name in required_dirs:
        dir_path = cwd / dir_name
        if dir_path.exists() and dir_path.is_dir():
            dirs_exist.append(dir_name)
            console.print(f"  [green]✓[/green] {dir_name}/")
        else:
            dirs_missing.append(dir_name)
            console.print(f"  [yellow]⚠[/yellow] {dir_name}/ (missing)")

    checks.append(("Directory Structure", "PASS" if not dirs_missing else "WARN", f"{len(dirs_exist)}/{len(required_dirs)}"))

    # Check 4: Config files
    console.print("\n[bold]4. Configuration Files[/bold]")
    config_files = [
        ".env",
        "pyproject.toml",
        "src/config.py",
    ]

    configs_found = []
    configs_missing = []

    for config_file in config_files:
        config_path = cwd / config_file
        if config_path.exists():
            configs_found.append(config_file)
            console.print(f"  [green]✓[/green] {config_file}")
        else:
            configs_missing.append(config_file)
            console.print(f"  [yellow]⚠[/yellow] {config_file} (missing)")

    checks.append(("Config Files", "PASS" if not configs_missing else "WARN", f"{len(configs_found)}/{len(config_files)}"))

    # Check 5: Environment variables
    console.print("\n[bold]5. Environment Variables[/bold]")
    import os
    from dotenv import load_dotenv
    load_dotenv()

    required_env_vars = ["ANTHROPIC_BASE_URL", "ANTHROPIC_MODEL"]
    env_vars_set = []
    env_vars_missing = []

    for env_var in required_env_vars:
        value = os.getenv(env_var)
        if value:
            env_vars_set.append(env_var)
            console.print(f"  [green]✓[/green] {env_var}")
        else:
            env_vars_missing.append(env_var)
            console.print(f"  [red]✗[/red] {env_var} (not set)")

    checks.append(("Environment Variables", "PASS" if not env_vars_missing else "FAIL", f"{len(env_vars_set)}/{len(required_env_vars)}"))

    if env_vars_missing:
        console.print("\n  [yellow]Set missing env vars:[/yellow]")
        console.print("  [dim]Create or update .env file[/dim]")
        all_passed = False

    # Check 6: Network connectivity (API endpoint)
    console.print("\n[bold]6. API Endpoint Connectivity[/bold]")
    import httpx
    base_url = os.getenv("ANTHROPIC_BASE_URL", "")

    if base_url:
        try:
            response = httpx.get(f"{base_url}/health", timeout=2.0)
            if response.status_code == 200:
                console.print(f"  [green]✓[/green] {base_url} (reachable)")
                checks.append(("API Connectivity", "PASS", base_url))
            else:
                console.print(f"  [yellow]⚠[/yellow] {base_url} (status: {response.status_code})")
                checks.append(("API Connectivity", "WARN", base_url))
        except httpx.RequestError as e:
            console.print(f"  [red]✗[/red] {base_url} (unreachable: {e})")
            console.print("  [dim]Make sure Antigravity Proxy is running on port 9191[/dim]")
            checks.append(("API Connectivity", "FAIL", base_url))
            all_passed = False
    else:
        console.print("  [yellow]⚠[/yellow] ANTHROPIC_BASE_URL not set")
        checks.append(("API Connectivity", "WARN", "not configured"))

    # Summary table
    console.print("\n" + "=" * 60)
    console.print("[bold]Diagnostic Summary[/bold]")

    summary_table = Table(show_header=False)
    summary_table.add_column("Check", style="cyan")
    summary_table.add_column("Status", style="green")
    summary_table.add_column("Details", style="dim")

    for check_name, status, details in checks:
        status_style = {
            "PASS": "green",
            "WARN": "yellow",
            "FAIL": "red",
        }.get(status, "dim")
        summary_table.add_row(check_name, f"[{status_style}]{status}[/{status_style}]", details)

    console.print(summary_table)

    # Final verdict
    console.print("\n" + "=" * 60)
    if all_passed:
        console.print("[bold green]✅ All checks passed! System is healthy.[/bold green]")
    else:
        console.print("[bold red]❌ Some checks failed. Please fix issues above.[/bold red]")
        console.print("\n[dim]Run 'mekong config init' to set up configuration[/dim]")
        raise typer.Exit(1)


@app.command()
def info() -> None:
    """Show system information"""
    import platform
    import os

    console.print(
        Panel(
            Text("💻 System Information", style="bold blue"),
            border_style="blue",
        )
    )

    table = Table(title="System Info")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Platform", platform.platform())
    table.add_row("Python Version", f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    table.add_row("Python Executable", sys.executable)
    table.add_row("Working Directory", os.getcwd())
    table.add_row("System Encoding", sys.getdefaultencoding())

    console.print(table)


@app.command()
def deps() -> None:
    """List installed dependencies"""
    console.print(
        Panel(
            Text("📦 Installed Dependencies", style="bold green"),
            border_style="green",
        )
    )

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format=json"],
            capture_output=True,
            text=True,
            timeout=30,
        )

        import json
        packages = json.loads(result.stdout)

        table = Table(title=f"Python Packages ({len(packages)} installed)")
        table.add_column("Package", style="cyan")
        table.add_column("Version", style="green")

        # Sort by name
        packages.sort(key=lambda x: x["name"].lower())

        for pkg in packages:
            table.add_row(pkg["name"], pkg["version"])

        console.print(table)
    except Exception as e:
        console.print(f"[red]Error listing packages: {e}[/red]")


def main():
    """Entry point for doctor command"""
    app()


if __name__ == "__main__":
    app()
