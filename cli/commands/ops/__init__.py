"""
Operations command modules - split from monolithic ops.py.

Main CLI app is in ops_commands.py to avoid import conflicts.
"""
from .deployment import deploy_backend_cmd
from .monitoring import health_check_cmd, monitor_quota_cmd, watch_cmd, wow_check_cmd
from .network import (
    network_bypass_cmd,
    network_optimize_cmd,
    network_scan_cmd,
    network_turbo_cmd,
)

# Import ops_app from the main commands file
import sys
from pathlib import Path

# Load ops_commands module
import importlib.util
ops_commands_path = Path(__file__).parent.parent / "ops_commands.py"
spec = importlib.util.spec_from_file_location("ops_commands", ops_commands_path)
ops_commands = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ops_commands)

# Export ops_app for backward compatibility
ops_app = ops_commands.ops_app

__all__ = [
    # Typer app
    "ops_app",
    # Monitoring
    "watch_cmd",
    "monitor_quota_cmd",
    "health_check_cmd",
    "wow_check_cmd",
    # Network
    "network_optimize_cmd",
    "network_turbo_cmd",
    "network_scan_cmd",
    "network_bypass_cmd",
    # Deployment
    "deploy_backend_cmd",
]
