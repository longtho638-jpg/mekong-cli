"""
Command Router for CLI commands.
Handles command routing and execution.
"""

from typing import List, Optional
from cli.core.command_registry import registry
from cli.ui.help import print_help


class CommandRouter:
    """Router for CLI commands."""
    
    def __init__(self):
        # Ensure all commands are registered
        from cli.core.commands import register_commands
        register_commands()
    
    def execute(self, command: str, args: List[str]) -> None:
        """Execute a command with given arguments."""
        # Try to get registered command
        command_class = registry.get(command)
        
        if command_class:
            try:
                cmd_instance = command_class()
                cmd_instance.execute(args)
            except Exception as e:
                print(f"❌ Error executing command: {e}")
        else:
            # Fallback to legacy commands (if needed)
            self._handle_legacy_command(command, args)
    
    def _handle_legacy_command(self, command: str, args: List[str]) -> None:
        """Handle legacy commands not yet migrated."""
        legacy_commands = {
            "help": self._show_help,
            "onboard": self._onboard_legacy,
            # Add other legacy commands as needed
        }
        
        if command in legacy_commands:
            legacy_commands[command](args)
        else:
            print(f"❌ Unknown command: {command}")
            print_help()
    
    def _show_help(self, args: List[str]) -> None:
        """Show help information."""
        print_help()
    
    def _onboard_legacy(self, args: List[str]) -> None:
        """Legacy onboarding handler."""
        try:
            from cli.handlers.onboard import OnboardHandler
            handler = OnboardHandler()
            handler.execute(args)
        except ImportError:
            print("❌ Onboarding handler not found.")