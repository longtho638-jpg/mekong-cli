#!/usr/bin/env python3
"""
🚀 Core Commands - AgencyOS CLI
================================

Basic essential commands for AgencyOS operation.
"""

import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from rich.console import Console


def main(args: list):
    """Handle core commands."""
    console = Console()
    
    if not args:
        console.print("❌ Missing core command")
        console.print("Available: guide, scaffold, kanban")
        return
    
    command = args[0]
    
    if command == "guide":
        from cli.commands.core.guide import main as guide_main
        guide_main()
    elif command == "scaffold":
        from cli.commands.core.scaffold import main as scaffold_main
        scaffold_main(args[1:] if len(args) > 1 else [])
    elif command == "kanban":
        from cli.commands.core.kanban import main as kanban_main
        kanban_main()
    else:
        console.print(f"❌ Unknown core command: {command}")