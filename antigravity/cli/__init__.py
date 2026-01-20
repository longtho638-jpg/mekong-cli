"""
AntigravityKit CLI - The main command interface.

Commands:
- antigravity start           Bootstrap new agency
- antigravity client:add      Add new client
- antigravity content:generate Generate content ideas
- antigravity stats           Show dashboard stats

"De nhu an keo" - Easy as candy
"""

from antigravity.cli.app import main, route_command
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

__all__ = [
    # Main entry
    "main",
    "route_command",
    # Commands
    "cmd_start",
    "cmd_client_add",
    "cmd_content_generate",
    "cmd_stats",
    "cmd_vibe_code",
    "cmd_vibe_plan",
    "cmd_vibe_status",
    # Utils
    "print_banner",
    "print_help",
]

if __name__ == "__main__":
    main()
