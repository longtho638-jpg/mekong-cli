"""
Command Registry for CLI modules.
Handles dynamic command discovery and registration.
"""

from typing import Dict, Type, List, Optional
from cli.commands.base import BaseCommand


class CommandRegistry:
    """Registry for managing CLI commands."""
    
    def __init__(self):
        self._commands: Dict[str, Type[BaseCommand]] = {}
    
    def register(self, name: str, command_class: Type[BaseCommand]) -> None:
        """Register a command."""
        self._commands[name] = command_class
    
    def get(self, name: str) -> Optional[Type[BaseCommand]]:
        """Get command by name."""
        return self._commands.get(name)
    
    def list_commands(self) -> List[str]:
        """List all registered commands."""
        return list(self._commands.keys())
    
    def is_registered(self, name: str) -> bool:
        """Check if command is registered."""
        return name in self._commands


# Global registry instance
registry = CommandRegistry()