#!/usr/bin/env python3
"""
🏯 MASTER DASHBOARD - Unified Business Command Center
======================================================
One view to rule them all. See entire business state at a glance.

Usage:
    python3 scripts/master_dashboard.py           # Full dashboard
    python3 scripts/master_dashboard.py revenue   # Revenue only
    python3 scripts/master_dashboard.py leads     # Leads only
    python3 scripts/master_dashboard.py today     # Today's summary
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
LEADS_FILE = CONFIG_DIR / "leads.json"
INVOICES_FILE = CONFIG_DIR / "invoices.json"
SCRIPTS_DIR = Path(__file__).parent

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"


def load_json(path):
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def run_script(script, args=None):
    cmd = [sys.executable, str(SCRIPTS_DIR / script)]
    if args:
        cmd.extend(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout
    except:
        return ""


def header(text, color=BLUE):
    width = 60
    print(f"\n{color}{BOLD}{'═' * width}{RESET}")
    print(f"{color}{BOLD}  {text}{RESET}")
    print(f"{color}{BOLD}{'═' * width}{RESET}")


def section(text):
    print(f"\n{CYAN}▶ {text}{RESET}")
    print(f"{DIM}{'─' * 56}{RESET}")


def metric(label, value, icon="📊"):
    print(f"  {icon} {label}: {BOLD}{value}{RESET}")


def progress_bar(current, total, width=20):
    if total == 0:
        return "░" * width
    filled = int(width * current / total)
    return "█" * filled + "░" * (width - filled)


def get_revenue_data():
    """Get revenue from payment hub."""
    # Load Gumroad credentials
    gumroad_json = CONFIG_DIR / "gumroad.json"
    if gumroad_json.exists():
        with open(gumroad_json) as f:
            data = json.load(f)
            os.environ["GUMROAD_ACCESS_TOKEN"] = data.get("access_token", "")

    # This would normally call the APIs, for now use mock/cached
    return {
        "monthly_revenue": 0,
        "pending_invoices": 0,
        "paid_invoices": 0,
    }


def dashboard_revenue():
    """Revenue section of dashboard."""
    section("💰 REVENUE")

    # Invoices
    invoices = load_json(INVOICES_FILE)
    pending = sum(i["amount"] for i in invoices if i.get("status") == "pending")
    paid = sum(i["amount"] for i in invoices if i.get("status") == "paid")

    metric("Paid (This Period)", f"${paid:,.2f}", "✅")
    metric("Pending Invoices", f"${pending:,.2f}", "⏳")
    metric("Total Pipeline", f"${paid + pending:,.2f}", "💵")

    # Goal Progress
    goal = 200000  # $200K target from plan
    current = paid
    pct = (current / goal * 100) if goal > 0 else 0
    bar = progress_bar(current, goal)
    print(f"\n  🎯 2026 Goal: [{bar}] {pct:.1f}%")
    print(f"     ${current:,.0f} / ${goal:,.0f}")


def dashboard_leads():
    """Leads section of dashboard."""
    section("📋 LEADS PIPELINE")

    leads = load_json(LEADS_FILE)

    stages = {
        "new": {"count": 0, "icon": "🆕"},
        "contacted": {"count": 0, "icon": "📧"},
        "replied": {"count": 0, "icon": "💬"},
        "meeting": {"count": 0, "icon": "📞"},
        "closed": {"count": 0, "icon": "✅"},
    }

    for lead in leads:
        stage = lead.get("stage", "new")
        if stage in stages:
            stages[stage]["count"] += 1

    for stage, data in stages.items():
        bar = "█" * data["count"] + "░" * (10 - data["count"])
        print(f"  {data['icon']} {stage:<10} [{bar}] {data['count']}")

    total = len(leads)
    closed = stages["closed"]["count"]
    rate = (closed / total * 100) if total > 0 else 0
    print(f"\n  📈 Conversion: {rate:.0f}% ({closed}/{total})")


def dashboard_products():
    """Products section of dashboard."""
    section("📦 PRODUCTS")

    products_dir = SCRIPTS_DIR.parent / "products"
    if products_dir.exists():
        zips = list(products_dir.glob("*.zip"))
        metric("Product Archives", len(zips), "📁")
    else:
        metric("Product Archives", 0, "📁")

    # Check Gumroad products (cached)
    metric("Gumroad Listed", "Check with: payment_hub.py products", "🛒")


def dashboard_automation():
    """Automation health section."""
    section("🤖 AUTOMATION STATUS")

    scripts = [
        ("revenue_autopilot.py", "Master Controller"),
        ("gumroad_publisher.py", "Product Publisher"),
        ("payment_hub.py", "Payment Hub"),
        ("ghost_cto.py", "CTO Reports"),
        ("outreach_cli.py", "Lead Outreach"),
        ("invoice_generator.py", "Invoicing"),
    ]

    for script, name in scripts:
        exists = (SCRIPTS_DIR / script).exists()
        status = f"{GREEN}✅{RESET}" if exists else f"{RED}❌{RESET}"
        print(f"  {status} {name}")

    # Check cron/launchd
    launchd_plist = Path.home() / "Library/LaunchAgents/com.mekong.autopilot.plist"
    if launchd_plist.exists():
        print(f"\n  {GREEN}✅ Scheduled automation ACTIVE{RESET}")
    else:
        print(f"\n  {YELLOW}⚠️ No scheduled automation{RESET}")
        print("     Run: scripts/setup_scheduler.py")


def dashboard_today():
    """Today's quick summary."""
    header(f"📅 TODAY: {datetime.now().strftime('%A, %B %d, %Y')}", MAGENTA)

    leads = load_json(LEADS_FILE)
    invoices = load_json(INVOICES_FILE)

    # Today's stats
    today = datetime.now().date().isoformat()

    new_leads = sum(1 for l in leads if l.get("added", "")[:10] == today)
    new_invoices = sum(1 for i in invoices if i.get("created", "")[:10] == today)

    print(f"  🆕 New Leads Today: {new_leads}")
    print(f"  📄 Invoices Created: {new_invoices}")

    # Pending actions
    pending_leads = sum(1 for l in leads if l.get("stage") == "new")
    pending_invoices = sum(1 for i in invoices if i.get("status") == "pending")

    print("\n  ⚡ ACTION NEEDED:")
    if pending_leads > 0:
        print(f"     📧 {pending_leads} leads to contact")
    if pending_invoices > 0:
        print(f"     💵 {pending_invoices} invoices pending payment")
    if pending_leads == 0 and pending_invoices == 0:
        print("     ✅ All caught up!")


def dashboard_full():
    """Full dashboard view."""
    header("🏯 MASTER DASHBOARD - SINH TỒN + ĐẾ CHẾ", BLUE)
    print(f"{DIM}   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")

    dashboard_revenue()
    dashboard_leads()
    dashboard_products()
    dashboard_automation()

    # Quick commands
    print(f"\n{DIM}{'─' * 60}{RESET}")
    print(
        f"{DIM}Quick: autopilot daily | outreach_cli.py stats | invoice_generator.py list{RESET}"
    )


def main():
    if len(sys.argv) < 2:
        dashboard_full()
        return

    cmd = sys.argv[1].lower()

    if cmd == "revenue":
        header("💰 REVENUE DASHBOARD")
        dashboard_revenue()
    elif cmd == "leads":
        header("📋 LEADS DASHBOARD")
        dashboard_leads()
    elif cmd == "today":
        dashboard_today()
    elif cmd == "products":
        header("📦 PRODUCTS DASHBOARD")
        dashboard_products()
    else:
        dashboard_full()


if __name__ == "__main__":
    main()
