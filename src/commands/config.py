"""
Mekong CLI Config Command - Manage environment variables and API keys
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm
from pathlib import Path
import os
from dotenv import load_dotenv, set_key

app = typer.Typer(name="config", help="Manage environment variables and API keys")
console = Console()

# Default env file path
ENV_FILE = Path.cwd() / ".env"


@app.command()
def init() -> None:
    """Initialize .env file with required variables"""
    console.print(
        Panel(
            "🔧 Mekong CLI Configuration Setup",
            border_style="cyan",
        )
    )

    # Create .env if not exists
    if not ENV_FILE.exists():
        ENV_FILE.touch()
        console.print("[green]✓[/green] Created .env file")

    # Required variables
    required_vars = {
        "ANTHROPIC_BASE_URL": "http://localhost:9191",
        "ANTHROPIC_MODEL": "gemini-3-pro-high",
        "MEKONG_API_TOKEN": "",
        "MEKONG_TELEGRAM_TOKEN": "",
    }

    # Load existing env
    load_dotenv(ENV_FILE)

    console.print("\n[bold]Configure required environment variables:[/bold]\n")

    for var_name, default_value in required_vars.items():
        current_value = os.getenv(var_name, "")

        if current_value:
            console.print(f"[dim]{var_name} = {mask_value(current_value)} (already set)[/dim]")
            if Confirm.ask(f"  Update {var_name}?", default=False):
                new_value = Prompt.ask(f"  Enter {var_name}", default=default_value)
                set_key(str(ENV_FILE), var_name, new_value)
                console.print(f"[green]✓[/green] Updated {var_name}")
        else:
            new_value = Prompt.ask(f"  Enter {var_name}", default=default_value)
            set_key(str(ENV_FILE), var_name, new_value)
            console.print(f"[green]✓[/green] Set {var_name}")

    console.print(
        Panel(
            "[green]Configuration initialized![/green]\n\n"
            "Run [bold]mekong status health[/bold] to verify setup",
            border_style="green",
        )
    )


def mask_value(value: str, visible_chars: int = 4) -> str:
    """Mask sensitive value showing only last few chars"""
    if not value:
        return "(empty)"
    if len(value) <= visible_chars:
        return "*" * len(value)
    return "*" * (len(value) - visible_chars) + value[-visible_chars:]


@app.command()
def show() -> None:
    """Show current configuration (masked)"""
    load_dotenv(ENV_FILE)

    console.print(
        Panel(
            "🔐 Current Configuration",
            border_style="blue",
        )
    )

    # Key variables to show
    key_vars = [
        "ANTHROPIC_BASE_URL",
        "ANTHROPIC_MODEL",
        "ANTHROPIC_API_KEY",
        "MEKONG_API_TOKEN",
        "MEKONG_TELEGRAM_TOKEN",
        "OPENAI_API_KEY",
        "GOOGLE_API_KEY",
    ]

    table = Table(title="Environment Variables")
    table.add_column("Variable", style="cyan")
    table.add_column("Value (masked)", style="green")
    table.add_column("Source", style="dim")

    for var_name in key_vars:
        value = os.getenv(var_name, "")
        if value:
            source = "local" if os.getenv(f"LOCAL_{var_name}") else "system"
            table.add_row(var_name, mask_value(value), source)
        else:
            table.add_row(var_name, "[red](not set)[/red]", "-")

    console.print(table)

    # Show env file path
    console.print(f"\n[bold]Env file:[/bold] {ENV_FILE.absolute()}")
    if ENV_FILE.exists():
        console.print("[green]✓ exists[/green]")
    else:
        console.print("[yellow]⚠ does not exist - run 'mekong config init'[/yellow]")


@app.command()
def get(key: str) -> None:
    """Get a specific config value"""
    load_dotenv(ENV_FILE)

    value = os.getenv(key, "")
    if not value:
        console.print(f"[yellow]'{key}' is not set[/yellow]")
    else:
        # Check if it looks like a secret
        is_secret = "key" in key.lower() or "token" in key.lower() or "secret" in key.lower()

        if is_secret:
            console.print(f"[bold]{key}:[/bold] {mask_value(value)}")
            if Confirm.ask("Show full value?", default=False):
                console.print(f"[dim]{value}[/dim]")
        else:
            console.print(f"[bold]{key}:[/bold] {value}")


@app.command()
def set(key: str, value: str) -> None:
    """Set a config value"""
    if not ENV_FILE.exists():
        ENV_FILE.touch()
        console.print(f"[green]✓[/green] Created {ENV_FILE}")

    set_key(str(ENV_FILE), key, value)
    console.print(f"[green]✓[/green] Set {key} = {mask_value(value) if 'key' in key.lower() or 'token' in key.lower() else value}")


@app.command()
def unset(key: str) -> None:
    """Remove a config value"""
    from dotenv import dotenv_values

    if not ENV_FILE.exists():
        console.print("[yellow].env file does not exist[/yellow]")
        return

    # Read all vars
    env_vars = dotenv_values(str(ENV_FILE))

    if key not in env_vars:
        console.print(f"[yellow]'{key}' not found in .env[/yellow]")
        return

    # Remove and rewrite
    del env_vars[key]

    # Clear file
    ENV_FILE.write_text("")

    # Rewrite without the key
    for k, v in env_vars.items():
        set_key(str(ENV_FILE), k, v or "")

    console.print(f"[green]✓[/green] Unset {key}")


@app.command()
def validate() -> None:
    """Validate configuration and check for issues"""
    load_dotenv(ENV_FILE)

    console.print(
        Panel(
            "🔍 Configuration Validation",
            border_style="yellow",
        )
    )

    issues = []
    warnings = []

    # Required vars
    required = ["ANTHROPIC_BASE_URL", "ANTHROPIC_MODEL"]
    for var in required:
        if not os.getenv(var):
            issues.append(f"Missing required: {var}")

    # Optional but recommended
    recommended = ["MEKONG_API_TOKEN"]
    for var in recommended:
        if not os.getenv(var):
            warnings.append(f"Recommended but not set: {var}")

    # URL format validation
    base_url = os.getenv("ANTHROPIC_BASE_URL", "")
    if base_url and not base_url.startswith(("http://", "https://")):
        issues.append("ANTHROPIC_BASE_URL must start with http:// or https://")

    # Model name validation
    model = os.getenv("ANTHROPIC_MODEL", "")
    if model and " " in model:
        warnings.append("Model name contains spaces - this may cause issues")

    # Report
    if not issues and not warnings:
        console.print("[bold green]✅ Configuration is valid![/bold green]")
        return

    if issues:
        console.print(f"[bold red]❌ {len(issues)} critical issue(s):[/bold red]")
        for issue in issues:
            console.print(f"  • {issue}")

    if warnings:
        console.print(f"\n[yellow]⚠️  {len(warnings)} warning(s):[/yellow]")
        for warning in warnings:
            console.print(f"  • {warning}")

    if issues:
        raise typer.Exit(1)


@app.command()
def export(output: str = typer.Option(None, "--output", "-o", help="Output file path")) -> None:
    """Export configuration to file (excluding secrets)"""
    load_dotenv(ENV_FILE)

    # Non-secret vars to export
    public_vars = [
        "ANTHROPIC_BASE_URL",
        "ANTHROPIC_MODEL",
        "MEKONG_DEBUG",
        "MEKONG_LOG_LEVEL",
    ]

    lines = ["# Mekong CLI Configuration Export", f"# Generated: {Path.cwd()}", ""]

    for var in public_vars:
        value = os.getenv(var, "")
        if value:
            lines.append(f"{var}={value}")

    content = "\n".join(lines)

    if output:
        output_path = Path(output)
        output_path.write_text(content)
        console.print(f"[green]✓[/green] Exported to {output}")
    else:
        console.print("[bold]Configuration Export:[/bold]")
        console.print(content)


def main():
    """Entry point for config subcommands"""
    app()


if __name__ == "__main__":
    app()
