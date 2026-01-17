#!/usr/bin/env python3
"""
🤖 REVENUE AUTOPILOT - 1000% Automation Controller
===================================================
Single command to run ALL revenue operations from IDE.

Usage:
    python3 scripts/revenue_autopilot.py daily      # Run all daily tasks
    python3 scripts/revenue_autopilot.py weekly     # Run all weekly tasks
    python3 scripts/revenue_autopilot.py publish    # Batch publish products
    python3 scripts/revenue_autopilot.py report     # Generate all reports
    python3 scripts/revenue_autopilot.py status     # Check all systems
    python3 scripts/revenue_autopilot.py setup      # Configure credentials
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
SCRIPTS_DIR = Path(__file__).parent
CONFIG_DIR = Path.home() / ".mekong"
CREDENTIALS_FILE = CONFIG_DIR / "credentials.json"

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_header(text):
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}🤖 {text}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def print_status(ok, message):
    icon = f"{GREEN}✅{RESET}" if ok else f"{RED}❌{RESET}"
    print(f"   {icon} {message}")


def run_script(script_name, args=None):
    """Run a Python script and return success status."""
    cmd = [sys.executable, str(SCRIPTS_DIR / script_name)]
    if args:
        cmd.extend(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.returncode == 0, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)


def load_credentials():
    """Load credentials from secure storage."""
    # First try environment variables
    creds = {
        "gumroad": os.getenv("GUMROAD_ACCESS_TOKEN", ""),
        "paypal_client": os.getenv("PAYPAL_CLIENT_ID", ""),
        "paypal_secret": os.getenv("PAYPAL_CLIENT_SECRET", ""),
    }

    # Fallback to config file
    if CREDENTIALS_FILE.exists() and not any(creds.values()):
        with open(CREDENTIALS_FILE) as f:
            saved = json.load(f)
            creds.update(saved)

    return creds


def save_credentials(creds):
    """Save credentials to config file."""
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(CREDENTIALS_FILE, "w") as f:
        json.dump(creds, f, indent=2)
    os.chmod(CREDENTIALS_FILE, 0o600)  # Secure permissions
    print(f"   ✅ Credentials saved to {CREDENTIALS_FILE}")


def cmd_setup():
    """Interactive credential setup."""
    print_header("CREDENTIAL SETUP")

    print("Enter your API credentials (leave blank to skip):\n")

    gumroad = input("   Gumroad Access Token: ").strip()
    paypal_client = input("   PayPal Client ID: ").strip()
    paypal_secret = input("   PayPal Client Secret: ").strip()

    creds = {}
    if gumroad:
        creds["gumroad"] = gumroad
        os.environ["GUMROAD_ACCESS_TOKEN"] = gumroad
    if paypal_client:
        creds["paypal_client"] = paypal_client
        os.environ["PAYPAL_CLIENT_ID"] = paypal_client
    if paypal_secret:
        creds["paypal_secret"] = paypal_secret
        os.environ["PAYPAL_CLIENT_SECRET"] = paypal_secret

    if creds:
        save_credentials(creds)
        print("\n   ✅ Setup complete! Run 'autopilot status' to verify.")
    else:
        print("\n   ⚠️  No credentials entered.")


def cmd_status():
    """Check all systems status."""
    print_header("SYSTEM STATUS")

    creds = load_credentials()

    # Gumroad
    print("🛒 GUMROAD:")
    print_status(bool(creds.get("gumroad")), "API Token Configured")

    # PayPal
    print("\n💳 PAYPAL:")
    print_status(bool(creds.get("paypal_client")), "Client ID Configured")
    print_status(bool(creds.get("paypal_secret")), "Client Secret Configured")

    # Scripts
    print("\n📜 AUTOMATION SCRIPTS:")
    scripts = [
        "gumroad_publisher.py",
        "payment_hub.py",
        "ghost_cto.py",
        "strategic_consultant.py",
    ]
    for s in scripts:
        exists = (SCRIPTS_DIR / s).exists()
        print_status(exists, s)

    # Products folder
    products_dir = SCRIPTS_DIR.parent / "products"
    print("\n📦 PRODUCTS:")
    if products_dir.exists():
        zips = list(products_dir.glob("*.zip"))
        print_status(len(zips) > 0, f"{len(zips)} product archives found")
    else:
        print_status(False, "products/ folder not found")


def cmd_daily():
    """Run all daily automation tasks."""
    print_header(f"DAILY AUTOPILOT - {datetime.now().strftime('%Y-%m-%d')}")

    # Load credentials into environment
    creds = load_credentials()
    if creds.get("gumroad"):
        os.environ["GUMROAD_ACCESS_TOKEN"] = creds["gumroad"]
    if creds.get("paypal_client"):
        os.environ["PAYPAL_CLIENT_ID"] = creds["paypal_client"]
    if creds.get("paypal_secret"):
        os.environ["PAYPAL_CLIENT_SECRET"] = creds["paypal_secret"]

    tasks = [
        ("Sync Gumroad Products", "gumroad_publisher.py", ["--list"]),
        ("Payment Hub Status", "payment_hub.py", ["status"]),
        ("Revenue Check", "payment_hub.py", ["revenue"]),
    ]

    results = []
    for name, script, args in tasks:
        print(f"\n🔄 {name}...")
        ok, output = run_script(script, args)
        results.append((name, ok))
        if not ok:
            print(f"   {YELLOW}⚠️ Check logs{RESET}")

    # Summary
    print_header("DAILY SUMMARY")
    passed = sum(1 for _, ok in results if ok)
    for name, ok in results:
        print_status(ok, name)
    print(f"\n   📊 {passed}/{len(results)} tasks completed")


def cmd_weekly():
    """Run all weekly automation tasks."""
    print_header(f"WEEKLY AUTOPILOT - Week {datetime.now().isocalendar()[1]}")

    # Load credentials
    creds = load_credentials()
    if creds.get("gumroad"):
        os.environ["GUMROAD_ACCESS_TOKEN"] = creds["gumroad"]

    tasks = [
        ("Ghost CTO Report (7 days)", "ghost_cto.py", ["--days", "7"]),
        ("Batch Publish Products", "gumroad_publisher.py", ["--batch"]),
        ("Venture Portfolio Report", "payment_hub.py", ["venture"]),
    ]

    results = []
    for name, script, args in tasks:
        print(f"\n🔄 {name}...")
        ok, output = run_script(script, args)
        results.append((name, ok))
        if ok:
            # Show truncated output
            lines = output.strip().split("\n")[-5:]
            for line in lines:
                print(f"      {line}")

    # Summary
    print_header("WEEKLY SUMMARY")
    passed = sum(1 for _, ok in results if ok)
    for name, ok in results:
        print_status(ok, name)
    print(f"\n   📊 {passed}/{len(results)} tasks completed")


def cmd_publish():
    """Batch publish all products."""
    print_header("BATCH PUBLISH")

    creds = load_credentials()
    if not creds.get("gumroad"):
        print(f"   {RED}❌ Gumroad token not configured!{RESET}")
        print("   Run: python3 scripts/revenue_autopilot.py setup")
        return

    os.environ["GUMROAD_ACCESS_TOKEN"] = creds["gumroad"]
    ok, output = run_script("gumroad_publisher.py", ["--batch"])
    print(output)


def cmd_report():
    """Generate all reports."""
    print_header("REPORT GENERATION")

    reports = [
        ("Ghost CTO", "ghost_cto.py", ["--days", "7"]),
        ("Revenue P&L", "payment_hub.py", ["revenue"]),
        ("Venture Portfolio", "payment_hub.py", ["venture"]),
    ]

    for name, script, args in reports:
        print(f"\n📊 Generating {name}...")
        ok, output = run_script(script, args)
        if ok:
            print(f"   {GREEN}✅ Done{RESET}")
        else:
            print(f"   {RED}❌ Failed{RESET}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nCommands:")
        print("  setup   - Configure API credentials")
        print("  status  - Check all systems")
        print("  daily   - Run daily automation")
        print("  weekly  - Run weekly automation")
        print("  publish - Batch publish products")
        print("  report  - Generate all reports")
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        cmd_setup()
    elif cmd == "status":
        cmd_status()
    elif cmd == "daily":
        cmd_daily()
    elif cmd == "weekly":
        cmd_weekly()
    elif cmd == "publish":
        cmd_publish()
    elif cmd == "report":
        cmd_report()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
