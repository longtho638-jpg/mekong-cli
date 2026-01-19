"""
👁️ Operations & Monitoring Commands
====================================

REFACTORED: This module now imports from split modules for better organization.

Module Structure:
- cli/commands/ops/network.py: Network diagnostics and optimization
- cli/commands/ops/monitoring.py: Health checks and quota monitoring
- cli/commands/ops/deployment.py: Deployment operations

All commands remain backward compatible.
"""

import typer

# Import split command modules using absolute imports to avoid circular dependency
# Since this file is now ops_commands.py, we can safely import from ops/ directory
import sys
from pathlib import Path

# Ensure cli is in path
cli_path = Path(__file__).parent.parent.parent
if str(cli_path) not in sys.path:
    sys.path.insert(0, str(cli_path))

from cli.commands.ops.deployment import deploy_backend_cmd
from cli.commands.ops.monitoring import (
    health_check_cmd,
    monitor_quota_cmd,
    watch_cmd,
    wow_check_cmd,
)
from cli.commands.ops.network import (
    network_bypass_cmd,
    network_optimize_cmd,
    network_scan_cmd,
    network_turbo_cmd,
)

ops_app = typer.Typer(help="👁️ Operations & Monitoring")


# Monitoring Commands
@ops_app.command("watch")
def watch():
    """👁️ Start the Empire Watcher."""
    watch_cmd()


@ops_app.command("notify")
def test_notify(message: str):
    """📧 Send a test notification."""
    from core.infrastructure.notifications import NotificationService

    notifier = NotificationService()
    notifier.send("Manual Alert", message, "info")


@ops_app.command("wow")
def check_wow():
    """✨ Run WOW Factor Analysis."""
    wow_check_cmd()


@ops_app.command("quota")
def monitor_quota(
    watch: bool = typer.Option(False, "--watch", "-w", help="Live monitoring mode"),
    fmt: str = typer.Option("full", "--format", "-f", help="Output format: full, compact, json")
):
    """📊 Monitor AI model quotas."""
    monitor_quota_cmd(watch=watch, fmt=fmt)


@ops_app.command("health")
def health_check():
    """🩺 Run System Health Check."""
    health_check_cmd()


# Network Commands
@ops_app.command("network-optimize")
def network_optimize(
    status_only: bool = typer.Option(False, "--status", help="Only show status without optimizing"),
    daemon: bool = typer.Option(False, "--daemon", help="Run in continuous daemon mode")
):
    """🌐 Optimize network connectivity (WARP/Tailscale)."""
    network_optimize_cmd(status_only=status_only, daemon=daemon)


@ops_app.command("network-turbo")
def network_turbo():
    """🚀 Run Viettel/SGN Turbo Mode optimization."""
    network_turbo_cmd()


@ops_app.command("network-scan")
def network_scan():
    """🔍 Scan WARP endpoints for lowest latency."""
    network_scan_cmd()


@ops_app.command("network-bypass")
def network_bypass():
    """🛡️ Show ISP Bypass Solutions (Manual)."""
    network_bypass_cmd()


# Deployment Commands
@ops_app.command("deploy")
def deploy_backend(
    service: str = typer.Option("agent-backend", help="Cloud Run Service Name"),
    region: str = typer.Option("asia-southeast1", help="GCP Region")
):
    """🚀 Deploy backend to Google Cloud Run."""
    deploy_backend_cmd(service=service, region=region)


# Utility Commands
@ops_app.command("secrets")
def generate_secrets():
    """🔐 Interactive secret generation (.env)."""
    from cli.commands.setup import generate_secrets as gen

    gen()
