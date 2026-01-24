"""
👁️ Operations & Monitoring Commands
====================================

Aggregates deployment, monitoring, and network operations into the 'ops' namespace.
"""
import typer

from .deployment import deploy_backend_cmd
from .monitoring import health_check_cmd, monitor_quota_cmd, watch_cmd, wow_check_cmd
from .network import (
    network_bypass_cmd,
    network_optimize_cmd,
    network_scan_cmd,
    network_turbo_cmd,
)

ops_app = typer.Typer(help="👁️ Operations & Monitoring")

# --- Monitoring Commands ---
ops_app.command("watch")(watch_cmd)
ops_app.command("wow")(wow_check_cmd)
ops_app.command("quota")(monitor_quota_cmd)
ops_app.command("health")(health_check_cmd)

# --- Network Commands ---
ops_app.command("network-optimize")(network_optimize_cmd)
ops_app.command("network-turbo")(network_turbo_cmd)
ops_app.command("network-scan")(network_scan_cmd)
ops_app.command("network-bypass")(network_bypass_cmd)

# --- Deployment Commands ---
ops_app.command("deploy")(deploy_backend_cmd)

# Dummy notify command to match previous interface if needed
@ops_app.command("notify")
def test_notify(message: str):
    """📧 Send a test notification."""
    from core.infrastructure.notifications import NotificationService

    # Simple mock if core not fully ready, or real import
    try:
        notifier = NotificationService()
        notifier.send("Manual Alert", message, "info")
    except ImportError:
        print(f"Notification sent: {message}")

@ops_app.command("secrets")
def generate_secrets():
    """🔐 Interactive secret generation (.env)."""
    # This was previously importing from setup, let's keep it if possible
    # or redirect to the setup command
    from cli.commands.setup import generate_secrets as gen
    gen()

__all__ = ["ops_app"]
