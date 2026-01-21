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
        elif command == "check":
            self._handle_check(args)
        elif command == "daemon":
            self._handle_daemon(args)
        elif command == "recover":
            self._handle_recover(args)
        elif command == "check-sync":
            self._handle_check_sync(args)
        elif command == "automation":
            self._handle_automation(args)
        else:
            self._show_help()

    def _handle_recover(self, args):
        """Recovery operations."""
        from antigravity.mcp_servers.recovery_server.handlers import RecoveryHandler
        handler = RecoveryHandler()

        if args.auto:
            print("🚀 Running auto-recovery...")
            result = asyncio.run(handler.auto_recover_all())
            print(result.get("message"))
            for sys_name, action in result.get("actions", {}).items():
                print(f"  {sys_name}: {action}")
        elif args.system:
            print(f"🚀 Recovering system: {args.system}...")
            success = asyncio.run(handler.run_recovery(args.system))
            print("✅ Success" if success else "❌ Failed")

    def _handle_check_sync(self, args):
        """Check FE-BE sync."""
        from antigravity.mcp_servers.sync_server.handlers import SyncHandler
        handler = SyncHandler()
        print("🔍 Checking FE-BE Sync...")
        report = handler.generate_report()
        print(f"   FE APIs: {report['fe_count']}")
        print(f"   BE Endpoints: {report['be_count']}")
        print(f"   Status: {report['status']}")

    def _handle_automation(self, args):
        """Automation operations."""
        from antigravity.mcp_servers.workflow_server.handlers import WorkflowEngineHandler
        handler = WorkflowEngineHandler()

        if args.action == "run":
            print(f"⚙️ Running workflow: {args.name}...")
            asyncio.run(handler.execute_workflow(args.name))
            print("✅ Done")
        elif args.action == "list":
            workflows = handler.list_workflows()
            print("\n📋 WORKFLOWS")
            for wf in workflows:
                status = "✅ Active" if wf["active"] else "⏸️ Paused"
                print(f"  {wf['name']} [{wf['id']}] - {status}")

    def _handle_revenue(self, args):
        """Revenue operations."""
        action = args.action if hasattr(args, "action") else "run"

        if action == "daemon":
            from antigravity.mcp_servers.solo_revenue_server.handlers import SoloRevenueHandler

            daemon = SoloRevenueHandler()
            asyncio.run(daemon.run_all_immediate())
        else:
            try:
                from antigravity.mcp_servers.revenue_server.handlers import RevenueAgentHandler

                agent = RevenueAgentHandler()
                agent.run_cycle()
            except ImportError:
                print("📊 Running revenue check...")
                self._quick_revenue_check()

    def _handle_leads(self, args):
        """Lead operations."""
        action = args.action if hasattr(args, "action") else "list"

        if action == "stats":
            from antigravity.mcp_servers.marketing_server.handlers import MarketingHandler
            handler = MarketingHandler()
            result = asyncio.run(handler.lead_pipeline())
            print(f"📊 Lead Stats: {result.get('total', 0)} total, {result.get('hot', 0)} hot")
            return

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
        from antigravity.mcp_servers.marketing_server.handlers import MarketingHandler
        handler = MarketingHandler()

        topic = args.topic if hasattr(args, "topic") and args.topic else "AI Marketing"
        print(f"📝 Generating content for: {topic}...")

        result = asyncio.run(handler.content_pipeline(topic))
        print(f"   ✅ Article: {result.get('article_words', 0)} words")
        print(f"   ✅ SEO Score: {result.get('seo_score', 0)}/100")
        print(f"   ✅ Social: {len(result.get('social_posts', []))} posts ready")

    def _handle_client(self, args):
        """Client operations."""
        action = args.action if hasattr(args, "action") else "list"

        if action == "onboard":
            from antigravity.mcp_servers.agency_server.handlers import AgencyHandler
            handler = AgencyHandler()

            name = args.name if hasattr(args, "name") else "New Client"
            print(f"🤝 Onboarding {name}...")

            result = asyncio.run(handler.onboard_client(name))
            print(f"   📄 Contract: {result.get('contract_path')}")
            print(f"   💰 Invoice: {result.get('invoice_path')}")
            print(f"   🌐 Portal: {result.get('portal_url')}")
            print(f"   ✅ {name} onboarded!")

    def _handle_report(self, args):
        """Generate report."""
        from antigravity.mcp_servers.revenue_server.handlers import RevenueAgentHandler
        handler = RevenueAgentHandler()

        report = handler.get_report()

        print("\n" + "=" * 60)
        print("  🏯 MEKONG CLI - DAILY REPORT")
        print(f"  {report.get('timestamp')}")
        print("=" * 60)

        print("\n📊 PIPELINE:")
        print(f"   Total Revenue: ${report.get('total_revenue', 0.0):,.2f}")
        print(f"   Leads Nurtured: {report.get('leads_nurtured', 0)}")
        print(f"   Emails Sent: {report.get('emails_sent', 0)}")
        print(f"   Content Generated: {report.get('content_generated', 0)}")

        print(f"\n🎯 GOAL: {report.get('progress_percent', 0.0):.2f}% of $1M")
        print("=" * 60)

    def _handle_status(self, args):
        """System status."""
        from antigravity.mcp_servers.commander_server.handlers import CommanderHandler
        handler = CommanderHandler()

        if hasattr(args, "system") and args.system:
            result = asyncio.run(handler.check_system(args.system))
            print(f"System: {args.system}")
            print(f"Status: {result.get('status')}")
            print(f"Message: {result.get('message')}")
            return

        print("\n🏯 MEKONG CLI STATUS")
        print("=" * 40)

        statuses = asyncio.run(handler.full_status())
        handler.print_dashboard(statuses)

    def _handle_check(self, args):
        """Security and quality checks."""
        from antigravity.mcp_servers.security_server.handlers import SecurityHandler
        handler = SecurityHandler()

        print("\n🛡️ SECURITY CHECK")
        print("=" * 40)

        if args.ruff:
            result = asyncio.run(handler.check_ruff())
            print(f"Ruff: {result.status} - {result.message}")
        elif args.typescript:
            result = asyncio.run(handler.check_typescript())
            print(f"TypeScript: {result.status} - {result.message}")
        elif args.pytest:
            result = asyncio.run(handler.check_pytest())
            print(f"Pytest: {result.status} - {result.message}")
        else:
            results = asyncio.run(handler.run_all_gates(dry_run=args.dry_run))
            for res in results:
                print(f"  {res['name']}: {res['status']} - {res['message']}")

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
    content_parser = subparsers.add_parser("content", help="Content generation")
    content_parser.add_argument("action", nargs="?", default="create")
    content_parser.add_argument("--topic", help="Topic for content")

    # Client
    client_parser = subparsers.add_parser("client", help="Client operations")
    client_parser.add_argument("action", nargs="?", default="list", choices=["onboard", "list"])
    client_parser.add_argument("--name", default="New Client")

    # Report
    subparsers.add_parser("report", help="Daily report")

    # Status
    status_parser = subparsers.add_parser("status", help="System status")
    status_parser.add_argument("--system", help="Check specific system")
    status_parser.add_argument("--watch", action="store_true", help="Watch mode")

    # Check
    check_parser = subparsers.add_parser("check", help="Security and quality checks")
    check_parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    check_parser.add_argument("--ruff", action="store_true", help="Ruff only")
    check_parser.add_argument("--typescript", action="store_true", help="TypeScript only")
    check_parser.add_argument("--pytest", action="store_true", help="Pytest only")

    # Recover
    recover_parser = subparsers.add_parser("recover", help="Auto-recovery")
    recover_parser.add_argument("--auto", action="store_true", help="Auto-recover all")
    recover_parser.add_argument("--system", help="Recover specific system")

    # Sync
    subparsers.add_parser("check-sync", help="Check FE-BE sync")

    # Automation
    auto_parser = subparsers.add_parser("automation", help="Automation workflows")
    auto_parser.add_argument("action", choices=["run", "list"])
    auto_parser.add_argument("name", nargs="?", help="Workflow name")

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
