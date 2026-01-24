"""
Base plugin protocol for Antigravity CLI plugin system.

This module defines the CCPlugin abstract base class that all plugins must inherit from.
Plugins can register custom commands, handle lifecycle events, and extend the CLI functionality.
"""

from abc import ABC, abstractmethod
from typing import Optional

import typer


class CCPlugin(ABC):
    """
    Base class for Antigravity CLI plugins.

    All plugins must inherit from this class and implement the abstract methods.
    Plugins can register new Typer commands, hook into lifecycle events, and
    extend the core functionality of the CLI.

    Attributes:
        name: Unique identifier for the plugin
        version: Semantic version string (e.g., "1.0.0")
        description: Brief description of the plugin's functionality
        dependencies: Optional list of plugin names this plugin depends on

    Example:
        >>> class MyPlugin(CCPlugin):
        ...     name = "my-plugin"
        ...     version = "1.0.0"
        ...     description = "My custom plugin"
        ...
        ...     def register_commands(self, app: typer.Typer):
        ...         @app.command()
        ...         def hello():
        ...             print("Hello from my plugin!")
        ...
        ...     def on_startup(self):
        ...         print("Plugin starting...")
        ...
        ...     def on_shutdown(self):
        ...         print("Plugin shutting down...")
    """

    # Plugin metadata (must be set by subclass)
    name: str = ""
    version: str = ""
    description: str = ""
    dependencies: list[str] = []

    def __init__(self):
        """Initialize the plugin instance."""
        if not self.name:
            raise ValueError(f"Plugin {self.__class__.__name__} must define 'name' attribute")
        if not self.version:
            raise ValueError(f"Plugin {self.name} must define 'version' attribute")

    @abstractmethod
    def register_commands(self, app: typer.Typer) -> None:
        """
        Register commands with the Typer application.

        This method is called during plugin initialization to register all
        CLI commands provided by this plugin.

        Args:
            app: The Typer application instance to register commands with

        Example:
            >>> def register_commands(self, app: typer.Typer):
            ...     @app.command()
            ...     def my_command(name: str = "World"):
            ...         '''My custom command'''
            ...         print(f"Hello {name}!")
        """
        pass

    def on_startup(self) -> None:
        """
        Hook called when the CLI application starts.

        Override this method to perform initialization tasks such as:
        - Loading configuration
        - Connecting to databases
        - Initializing resources
        - Validating environment

        This method is called after all plugins are loaded but before
        any commands are executed.
        """
        pass

    def on_shutdown(self) -> None:
        """
        Hook called when the CLI application is shutting down.

        Override this method to perform cleanup tasks such as:
        - Closing database connections
        - Saving state
        - Releasing resources
        - Cleanup operations

        This method is called after command execution completes.
        """
        pass

    def validate(self) -> bool:
        """
        Validate plugin configuration and dependencies.

        Override this method to implement custom validation logic.
        Return False if the plugin cannot function properly.

        Returns:
            True if plugin is properly configured, False otherwise
        """
        return True

    def get_info(self) -> dict:
        """
        Get plugin metadata information.

        Returns:
            Dictionary containing plugin metadata
        """
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "dependencies": self.dependencies,
            "class": self.__class__.__name__,
        }

    def __repr__(self) -> str:
        """String representation of the plugin."""
        return f"<{self.__class__.__name__}(name={self.name}, version={self.version})>"
