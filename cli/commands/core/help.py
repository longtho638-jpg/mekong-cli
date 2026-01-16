"""
Help command implementation.
"""

from typing import List
from cli.commands.base import BaseCommand
from cli.ui.help import print_help


class HelpCommand(BaseCommand):
    """Help command."""
    
    @property
    def description(self) -> str:
        return "Show help information"
    
    def execute(self, args: List[str]) -> None:
        print_help()