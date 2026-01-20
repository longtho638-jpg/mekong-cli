"""
AntigravityKit CLI Application.

Main entry point and command routing for the CLI.
"""

import sys

from antigravity.cli.commands import (
    cmd_client_add,
    cmd_content_generate,
    cmd_start,
    cmd_stats,
    cmd_vibe_code,
    cmd_vibe_plan,
    cmd_vibe_status,
)
from antigravity.cli.utils import print_banner, print_help


def route_command(command: str, args: list) -> None:
    """Route command to appropriate handler.

    Args:
        command: The command name (lowercase)
        args: Additional arguments from sys.argv
    """
    if command == "start":
        cmd_start()
    elif command == "client:add":
        name = args[0] if args else "New Client"
        cmd_client_add(name)
    elif command == "content:generate":
        count = int(args[0]) if args else 30
        cmd_content_generate(count)
    elif command == "stats":
        cmd_stats()
    elif command == "vibe:code":
        plan_path = args[0] if args else None
        cmd_vibe_code(plan_path)
    elif command == "vibe:plan":
        title = args[0] if args else "New Feature"
        cmd_vibe_plan(title)
    elif command == "vibe:status":
        cmd_vibe_status()
    elif command == "help":
        print_help()
    else:
        print(f"   Unknown command: {command}")
        print_help()


def main():
    """Main AntigravityKit CLI entry point."""
    print_banner()

    if len(sys.argv) < 2:
        print_help()
        return

    command = sys.argv[1].lower()
    args = sys.argv[2:]

    route_command(command, args)


if __name__ == "__main__":
    main()
