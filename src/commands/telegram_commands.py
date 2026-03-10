"""
Telegram Commands - Remote commander bot commands
"""

import typer
import asyncio
from rich.console import Console
from rich.panel import Panel

app = typer.Typer(help="Telegram: remote commander bot")
console = Console()


@app.command(name="start")
def telegram_start() -> None:
    """Start Telegram bot in foreground (blocking)."""

    # Get token from env
    import os
    token_val = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")

    if not token_val:
        console.print(
            Panel(
                "[bold red]MEKONG_TELEGRAM_TOKEN not set![/bold red]\n\n"
                "Set it before starting:\n"
                "  [cyan]export MEKONG_TELEGRAM_TOKEN='your-bot-token'[/cyan]",
                title="Telegram Bot",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)

    try:
        from src.core.telegram_bot import MekongBot
    except ImportError:
        console.print("[red]python-telegram-bot not installed.[/red]")
        console.print("[dim]pip install python-telegram-bot[/dim]")
        raise typer.Exit(code=1)

    bot = MekongBot(token=token_val)
    console.print("[green]Starting Telegram bot...[/green]")

    async def run():
        """Start the Telegram bot and keep it running until interrupted."""
        await bot.start()
        try:
            while bot.is_running():
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            await bot.stop()

    asyncio.run(run())


@app.command(name="status")
def telegram_status() -> None:
    """Check Telegram bot configuration status."""
    import os

    token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
    configured = bool(token)
    status_style = "green" if configured else "red"

    token_display = '*' * 8 + token[-4:] if token else 'not set'

    console.print(
        Panel(
            f"[bold]Configured:[/bold] [{status_style}]{configured}[/{status_style}]\n"
            f"[bold]Token:[/bold] {token_display}",
            title="Telegram Bot Status",
            border_style=status_style,
        )
    )
