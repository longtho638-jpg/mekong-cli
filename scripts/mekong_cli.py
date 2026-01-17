#!/usr/bin/env python3
"""
🏯 MEKONG CLI - Unified Command Center
=======================================
One command to rule them all.

Usage:
    mekong                      # Show dashboard
    mekong daily                # Morning routine
    mekong revenue              # Revenue report
    mekong leads                # Lead pipeline
    mekong publish              # Publish products
    mekong content <product>    # Generate content
    mekong invoice <client> <amt> <desc>  # Create invoice
    mekong outreach             # Lead outreach
    mekong notify <message>     # Send notification
    mekong status               # System status
    mekong help                 # Show help

Alias Setup:
    echo 'alias mekong="python3 ~/mekong-cli/scripts/mekong_cli.py"' >> ~/.zshrc
    source ~/.zshrc
"""

import subprocess
import sys
from pathlib import Path

# Paths
SCRIPTS_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPTS_DIR.parent

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def run(script, args=None, show=True):
    """Run a script and return output."""
    cmd = [sys.executable, str(SCRIPTS_DIR / script)]
    if args:
        cmd.extend(args)

    if show:
        result = subprocess.run(cmd, cwd=PROJECT_DIR)
        return result.returncode == 0
    else:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_DIR)
        return result.stdout, result.returncode == 0


def header():
    print(f"""
{BOLD}{BLUE}╔══════════════════════════════════════════════════════════╗
║  🏯 MEKONG CLI - Revenue Automation Command Center       ║
╚══════════════════════════════════════════════════════════╝{RESET}
""")


def cmd_dashboard():
    """Show master dashboard."""
    run("master_dashboard.py")


def cmd_daily():
    """Run daily automation."""
    run("revenue_autopilot.py", ["daily"])


def cmd_revenue():
    """Show revenue report."""
    run("payment_hub.py", ["revenue"])


def cmd_leads():
    """Show leads pipeline."""
    run("outreach_cli.py", ["stats"])


def cmd_publish():
    """Batch publish products."""
    run("revenue_autopilot.py", ["publish"])


def cmd_content(product="agencyos"):
    """Generate marketing content."""
    run("ai_content.py", ["all", product])


def cmd_invoice(args):
    """Create invoice."""
    if len(args) < 3:
        print("Usage: mekong invoice <client> <amount> <description>")
        return
    run("invoice_generator.py", ["create"] + args)


def cmd_outreach():
    """Show outreach tools."""
    run("outreach_cli.py", ["list"])


def cmd_notify(message):
    """Send notification."""
    from notification_hub import send_notification

    send_notification("info", "Mekong CLI", message)


def cmd_status():
    """Show system status."""
    run("revenue_autopilot.py", ["status"])


def cmd_webhook():
    """Start webhook server."""
    run("gumroad_webhook.py")


def cmd_help():
    """Show help."""
    print(__doc__)
    print(f"""
{BOLD}Quick Commands:{RESET}
  {GREEN}mekong{RESET}              Dashboard overview
  {GREEN}mekong daily{RESET}        Run morning automation
  {GREEN}mekong revenue{RESET}      Check revenue
  {GREEN}mekong leads{RESET}        View lead pipeline
  {GREEN}mekong publish{RESET}      Publish to Gumroad
  {GREEN}mekong content{RESET}      Generate marketing copy
  {GREEN}mekong invoice{RESET}      Create invoice
  {GREEN}mekong status{RESET}       System health check

{YELLOW}Tip:{RESET} Add alias to ~/.zshrc for quick access
""")


def main():
    if len(sys.argv) < 2:
        header()
        cmd_dashboard()
        return

    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    commands = {
        "daily": cmd_daily,
        "revenue": lambda: cmd_revenue(),
        "leads": lambda: cmd_leads(),
        "publish": lambda: cmd_publish(),
        "content": lambda: cmd_content(args[0] if args else "agencyos"),
        "invoice": lambda: cmd_invoice(args),
        "outreach": lambda: cmd_outreach(),
        "status": lambda: cmd_status(),
        "webhook": lambda: cmd_webhook(),
        "help": lambda: cmd_help(),
        "dashboard": lambda: cmd_dashboard(),
    }

    if cmd in commands:
        header()
        commands[cmd]()
    else:
        print(f"Unknown command: {cmd}")
        cmd_help()


if __name__ == "__main__":
    main()
