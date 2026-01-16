#!/usr/bin/env python3
"""
🎯 Development Commands - AgencyOS CLI
====================================

Development and building commands.
"""

import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from rich.console import Console

def main(args: list):
    """Handle development commands."""
    console = Console()
    
    if not args:
        console.print("❌ Missing development command")
        console.print("Available: binh-phap, cook, ship, test")
        return
    
    command = args[0]
    
    if command == "binh-phap":
        from cli.commands.development.binh_phap import main as binh_phap_main
        binh_phap_main(args[1:] if len(args) > 1 else [])
    elif command == "cook":
        from cli.commands.development.cook import main as cook_main
        cook_main(args[1:] if len(args) > 1 else [])
    elif command == "ship":
        from cli.commands.development.ship import main as ship_main
        ship_main()
    elif command == "test":
        from cli.commands.development.test import main as test_main
        test_main(args[1:] if len(args) > 1 else [])
    else:
        console.print(f"❌ Unknown development command: {command}")