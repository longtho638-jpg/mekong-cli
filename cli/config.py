"""
CLI Config Shim
===============
Redirects to cli.commands modules.
"""

from cli.commands.vibe import setup_vibe, vibes_cmd
from cli.commands.mcp import setup_mcp, install_mcp
from cli.commands.setup import generate_secrets