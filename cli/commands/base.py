"""
Base command class for all CLI commands.
Defines the common interface and utilities.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from rich.console import Console
from cli.theme import get_theme


class BaseCommand(ABC):
    """Base class for all CLI commands."""
    
    def __init__(self):
        self.console = Console(theme=get_theme())
    
    @abstractmethod
    def execute(self, args: List[str]) -> None:
        """Execute the command with given arguments."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Command description for help."""
        pass
    
    def print_error(self, message: str) -> None:
        """Print error message."""
        self.console.print(f"❌ {message}")
    
    def print_success(self, message: str) -> None:
        """Print success message."""
        self.console.print(f"✅ {message}")
    
    def print_info(self, message: str) -> None:
        """Print info message."""
        self.console.print(f"ℹ️  {message}")