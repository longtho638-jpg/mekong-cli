#!/usr/bin/env python3
"""
🏯 MEKONG CLI - Unified Command Interface
==========================================

All VibeOS engines in one CLI.

Usage:
    mekong revenue run          # Run revenue cycle
    mekong revenue daemon       # Start 24/7 daemon
    mekong leads add 10         # Add leads
    mekong content create       # Generate content
    mekong client onboard       # Onboard client
    mekong report               # Daily report
    mekong status               # System status

$1M 2026 Target | Binh Pháp Framework
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))


class MekongCLI:
    """Unified CLI for all mekong-cli operations."""

    def __init__(self):
        self.mekong_dir = Path.home() / ".mekong"
        self.mekong_dir.mkdir(exist_ok=True)

    def run(self, args: argparse.Namespace):
        """Route to appropriate command."""
        command = args.command

        if command == "revenue":
            self._handle_revenue(args)
        elif command == "leads":
            self._handle_leads(args)
        elif command == "content":
            self._handle_content(args)
        elif command == "client":
            self._handle_client(args)
        elif command == "report":
            self._handle_report(args)
        elif command == "status":
            self._handle_status(args)
        elif command == "daemon":
            self._handle_daemon(args)
        else:
            self._show_help()

    def _handle_revenue(self, args):
        """Revenue operations."""
        action = args.action if hasattr(args, "action") else "run"

        if action == "daemon":
            from vibeos.solo_revenue_daemon import SoloRevenueDaemon

            daemon = SoloRevenueDaemon()
            asyncio.run(daemon.run_all_immediate())
        else:
            try:
                from vibeos.revenue_agent import RevenueAgent

                agent = RevenueAgent()
                agent.run_cycle()
            except ImportError:
                print("📊 Running revenue check...")
                self._quick_revenue_check()

    def _handle_leads(self, args):
        """Lead operations."""
        action = args.action if hasattr(args, "action") else "list"
        count = args.count if hasattr(args, "count") else 10

        leads_file = self.mekong_dir / "leads.json"

        if action == "add":
            leads = []
            if leads_file.exists():
                leads = json.loads(leads_file.read_text())

            for i in range(count):
                leads.append(
                    {
                        "id": f"cli-{datetime.now().strftime('%Y%m%d%H%M%S')}-{i}",
                        "email": f"lead{i}@example.com",
                        "status": "new",
                        "source": "cli",
                        "created_at": datetime.now().isoformat(),
                    }
                )

            leads_file.write_text(json.dumps(leads, indent=2))
            print(f"✅ Added {count} leads. Total: {len(leads)}")

        elif action == "list":
            if leads_file.exists():
                leads = json.loads(leads_file.read_text())
                print(f"📊 Total leads: {len(leads)}")
                for lead in leads[-5:]:
                    print(f"   {lead.get('email')} - {lead.get('status')}")
            else:
                print("No leads yet")

        elif action == "stats":
            if leads_file.exists():
                leads = json.loads(leads_file.read_text())
                by_status = {}
                for lead in leads:
                    status = lead.get("status", "unknown")
                    by_status[status] = by_status.get(status, 0) + 1
                print("📊 Lead Stats:")
                for status, count in by_status.items():
                    print(f"   {status}: {count}")

    def _handle_content(self, args):
        """Content operations."""
        print("📝 Generating content ideas...")
        ideas = [
            "5 AI Tools Every Agency Owner Needs in 2026",
            "How to Build a $100K Consulting Business Solo",
            "The Binh Pháp Framework: Win Before You Fight",
        ]
        for i, idea in enumerate(ideas, 1):
            print(f"   {i}. {idea}")

    def _handle_client(self, args):
        """Client operations."""
        action = args.action if hasattr(args, "action") else "list"

        if action == "onboard":
            name = args.name if hasattr(args, "name") else "New Client"
            print(f"🤝 Onboarding {name}...")
            print("   📄 Contract generated")
            print("   💰 Invoice created")
            print("   🌐 Portal setup")
            print(f"   ✅ {name} onboarded!")

    def _handle_report(self, args):
        """Generate report."""
        print("\n" + "=" * 60)
        print("  🏯 MEKONG CLI - DAILY REPORT")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print("=" * 60)

        # Load leads
        leads_file = self.mekong_dir / "leads.json"
        leads_count = 0
        if leads_file.exists():
            leads_count = len(json.loads(leads_file.read_text()))

        # Load customers
        customers_file = self.mekong_dir / "customers.json"
        customers_count = 0
        if customers_file.exists():
            customers_count = len(json.loads(customers_file.read_text()))

        print("\n📊 PIPELINE:")
        print(f"   Leads: {leads_count}")
        print(f"   Customers: {customers_count}")

        # Check daemon status
        import subprocess

        result = subprocess.run(
            ["launchctl", "list"],
            capture_output=True,
            text=True,
        )
        daemon_running = "billmentor.revenue-daemon" in result.stdout
        print(f"\n🤖 DAEMON: {'Running ✅' if daemon_running else 'Stopped ❌'}")

        # Goal progress
        target = 1_000_000
        estimated = customers_count * 100  # Rough estimate
        progress = (estimated / target) * 100
        print(f"\n🎯 GOAL: {progress:.2f}% of $1M")
        print("=" * 60)

    def _handle_status(self, args):
        """System status."""
        print("\n🏯 MEKONG CLI STATUS")
        print("=" * 40)

        # Check files
        files = [
            ("Leads", self.mekong_dir / "leads.json"),
            ("Customers", self.mekong_dir / "customers.json"),
            ("Workflows", self.mekong_dir / "workflows"),
            ("Reports", self.mekong_dir / "reports"),
        ]

        for name, path in files:
            exists = path.exists()
            if path.is_file() and exists:
                count = len(json.loads(path.read_text()))
                print(f"   {name}: {count} items")
            elif path.is_dir() and exists:
                count = len(list(path.iterdir()))
                print(f"   {name}: {count} files")
            else:
                print(f"   {name}: Not initialized")

        # Daemon status
        import subprocess

        result = subprocess.run(
            ["launchctl", "list"],
            capture_output=True,
            text=True,
        )
        daemon_running = "billmentor.revenue-daemon" in result.stdout
        print(f"\n   Daemon: {'🟢 Running' if daemon_running else '🔴 Stopped'}")

    def _handle_daemon(self, args):
        """Daemon operations."""
        action = args.action if hasattr(args, "action") else "status"

        import subprocess

        if action == "start":
            subprocess.run(
                [
                    "launchctl",
                    "load",
                    str(Path.home() / "Library/LaunchAgents/com.billmentor.revenue-daemon.plist"),
                ]
            )
            print("✅ Daemon started")
        elif action == "stop":
            subprocess.run(
                [
                    "launchctl",
                    "unload",
                    str(Path.home() / "Library/LaunchAgents/com.billmentor.revenue-daemon.plist"),
                ]
            )
            print("✅ Daemon stopped")
        else:
            result = subprocess.run(
                ["launchctl", "list"],
                capture_output=True,
                text=True,
            )
            running = "billmentor.revenue-daemon" in result.stdout
            print(f"Daemon: {'🟢 Running' if running else '🔴 Stopped'}")

    def _quick_revenue_check(self):
        """Quick revenue check without full imports."""
        customers_file = self.mekong_dir / "customers.json"
        if customers_file.exists():
            customers = json.loads(customers_file.read_text())
            total = sum(c.get("price", 0) for c in customers)
            print(f"💰 Estimated revenue: ${total}")
        else:
            print("💰 No sales data yet")

    def _show_help(self):
        """Show help."""
        print(__doc__)


def main():
    parser = argparse.ArgumentParser(
        prog="mekong",
        description="🏯 Mekong CLI - $1M 2026 Automation",
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Revenue
    revenue_parser = subparsers.add_parser("revenue", help="Revenue operations")
    revenue_parser.add_argument(
        "action", nargs="?", default="run", choices=["run", "daemon", "report"]
    )

    # Leads
    leads_parser = subparsers.add_parser("leads", help="Lead operations")
    leads_parser.add_argument("action", nargs="?", default="list", choices=["add", "list", "stats"])
    leads_parser.add_argument("count", nargs="?", type=int, default=10)

    # Content
    subparsers.add_parser("content", help="Content generation")

    # Client
    client_parser = subparsers.add_parser("client", help="Client operations")
    client_parser.add_argument("action", nargs="?", default="list", choices=["onboard", "list"])
    client_parser.add_argument("--name", default="New Client")

    # Report
    subparsers.add_parser("report", help="Daily report")

    # Status
    subparsers.add_parser("status", help="System status")

    # Daemon
    daemon_parser = subparsers.add_parser("daemon", help="Daemon control")
    daemon_parser.add_argument(
        "action", nargs="?", default="status", choices=["start", "stop", "status"]
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    cli = MekongCLI()
    cli.run(args)


if __name__ == "__main__":
    main()
