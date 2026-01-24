"""
Example plugin demonstrating the Antigravity plugin architecture.

This is a simple "hello world" plugin that demonstrates how to:
- Extend the CCPlugin base class
- Register custom commands
- Handle lifecycle events
- Define plugin metadata
"""

import typer
from rich.console import Console

from antigravity.plugins.base import CCPlugin

console = Console()


class HelloPlugin(CCPlugin):
    """
    Example plugin that adds a 'hello' command to the CLI.

    This plugin demonstrates the basic structure and capabilities of
    the Antigravity plugin system.
    """

    # Plugin metadata
    name = "hello"
    version = "1.0.0"
    description = "Example plugin that adds a hello command"
    dependencies = []  # No dependencies

    def register_commands(self, app: typer.Typer) -> None:
        """
        Register the hello command with the application.

        Args:
            app: The Typer application instance
        """

        @app.command(name="hello")
        def hello(
            name: str = typer.Argument("World", help="Name to greet"),
            greeting: str = typer.Option(
                "Hello", "--greeting", "-g", help="Greeting to use"
            ),
            count: int = typer.Option(
                1, "--count", "-c", help="Number of times to greet"
            ),
            emoji: bool = typer.Option(
                False, "--emoji", "-e", help="Add emoji to greeting"
            ),
        ):
            """
            Say hello to someone!

            Example usage:
                mekong hello
                mekong hello Alice
                mekong hello Alice --greeting Hi --count 3
                mekong hello Alice --emoji
            """
            # Build the greeting message
            greeting_msg = f"{greeting}, {name}!"

            if emoji:
                greeting_msg = f"👋 {greeting_msg} ✨"

            # Print the greeting
            for i in range(count):
                if count > 1:
                    console.print(f"[cyan]{i + 1}.[/cyan] {greeting_msg}")
                else:
                    console.print(f"[bold green]{greeting_msg}[/bold green]")

            # Show plugin info
            if count == 1:
                console.print(
                    f"\n[dim]Powered by {self.name} plugin v{self.version}[/dim]"
                )

        @app.command(name="plugin-info")
        def plugin_info():
            """
            Display information about loaded plugins.

            Shows metadata for all available plugins in the system.
            """
            console.print("\n[bold cyan]🔌 Plugin System Information[/bold cyan]\n")
            console.print(f"Plugin Name: {self.name}")
            console.print(f"Version: {self.version}")
            console.print(f"Description: {self.description}")
            console.print(f"Dependencies: {', '.join(self.dependencies) or 'None'}")
            console.print(
                f"\n[dim]This is an example plugin demonstrating the plugin architecture.[/dim]"
            )

    def on_startup(self) -> None:
        """
        Hook called when the CLI starts.

        Performs any initialization needed by the plugin.
        """
        console.print(
            f"[dim]✓ {self.name} plugin v{self.version} loaded[/dim]", style="dim"
        )

    def on_shutdown(self) -> None:
        """
        Hook called when the CLI shuts down.

        Performs any cleanup needed by the plugin.
        """
        # In this simple plugin, we don't need to do any cleanup
        pass

    def validate(self) -> bool:
        """
        Validate that the plugin can function properly.

        Returns:
            True if plugin is properly configured
        """
        # For this simple plugin, we just check that metadata is set
        return bool(self.name and self.version and self.description)
