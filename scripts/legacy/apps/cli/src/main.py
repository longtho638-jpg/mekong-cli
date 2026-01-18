#!/usr/bin/env python3
"""
🏯 AgencyOS Command Processor
===========================

Modular command system replacing monolithic CLI main.py.
Supports .claude workflow integration and agent orchestration.
"""

import sys
from pathlib import Path
from typing import Dict, Optional

from rich.console import Console

# Use centralized import system
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Simple theme fallback
def get_theme():
    return None

class CommandProcessor:
    """Processes commands using modular architecture."""
    
    def __init__(self):
        self.console = Console()
        self.commands_dir = Path(__file__).parent / "commands"
        self._commands_cache = {}
    
    def load_command(self, command_name: str) -> Optional[Dict]:
        """Load command definition from command files."""
        if command_name in self._commands_cache:
            return self._commands_cache[command_name]
        
        # Search in command directories
        search_dirs = ["core", "development", "strategy", "mcp", "agents"]
        
        for search_dir in search_dirs:
            command_file = self.commands_dir / search_dir / f"{command_name}.py"
            if command_file.exists():
                try:
                    # Import command module
                    module_path = f"apps.cli.src.commands.{search_dir}.{command_name}"
                    module = __import__(module_path, fromlist=['main'])
                    
                    command_info = {
                        'module': module,
                        'file': command_file,
                        'category': search_dir
                    }
                    
                    self._commands_cache[command_name] = command_info
                    return command_info
                    
                except ImportError as e:
                    self.console.print(f"❌ Error loading command {command_name}: {e}")
                    continue
        
        return None
    
    def execute_command(self, command_name: str, args: list = None) -> bool:
        """Execute a command with given arguments."""
        if args is None:
            args = []
        
        # Load command
        command_info = self.load_command(command_name)
        
        if not command_info:
            self.console.print(f"❌ Unknown command: {command_name}")
            self.print_help()
            return False
        
        try:
            # Execute command's main function
            if hasattr(command_info['module'], 'main'):
                command_info['module'].main(args)
            else:
                self.console.print(f"❌ Command {command_name} missing main function")
                return False
                
        except Exception as e:
            self.console.print(f"❌ Error executing {command_name}: {e}")
            return False
        
        return True
    
    def print_help(self):
        """Print available commands."""
        from rich.table import Table
        
        table = Table(
            title="[bold white]📚 AVAILABLE COMMANDS[/bold white]",
            border_style="panel.border",
            box=None,
            header_style="bold secondary",
        )
        
        table.add_column("Command", style="command")
        table.add_column("Description", style="white")
        
        # Core commands
        table.add_row("", "")
        table.add_row("[bold secondary]🚀 START HERE[/bold secondary]", "")
        table.add_row("guide", "Hướng dẫn sử dụng cho người mới")
        table.add_row("scaffold", "Tạo bản vẽ kiến trúc (Architecture)")
        table.add_row("kanban", "Quản lý task và agent")
        
        # Development commands
        table.add_row("", "")
        table.add_row("[bold secondary]🎯 CORE COMMANDS[/bold secondary]", "")
        table.add_row("binh-phap", "Phân tích chiến lược dự án")
        table.add_row("cook", "Xây dựng tính năng (AI Agent)")
        table.add_row("ship", "Deploy sản phẩm")
        
        # Utilities
        table.add_row("", "")
        table.add_row("[bold secondary]⚡ UTILITIES[/bold secondary]", "")
        table.add_row("proposal", "Tạo Proposal khách hàng")
        table.add_row("content", "Tạo Content Marketing")
        table.add_row("invoice", "Tạo Invoice")
        
        self.console.print(table)
        self.console.print("\n[dim]Usage: agencyos [command][/dim]")
    
    def print_banner(self):
        """Print main banner."""
        banner_text = """
[bold primary]╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏯 AGENCY OS - COMMAND CENTER                          ║
║                                                           ║
║   The One-Person Unicorn Operating System                ║
║   "Không đánh mà thắng" - Win Without Fighting           ║
║                                                           ║
║   🌐 agencyos.network                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝[/bold primary]
        """
        self.console.print(banner_text)

def main():
    """Main entry point for AgencyOS CLI."""
    processor = CommandProcessor()
    
    # Parse arguments
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    if not args:
        processor.print_banner()
        processor.print_help()
        return
    
    command = args[0]
    command_args = args[1:] if len(args) > 1 else []
    
    # Handle help
    if command in ["help", "--help", "-h"]:
        processor.print_help()
        return
    
    # Execute command
    success = processor.execute_command(command, command_args)
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()