#!/usr/bin/env python3
"""
🚀 PHASE 0 ACTIVATOR - Step-by-Step Revenue Machine Startup
============================================================
Interactive guided walkthrough to activate the revenue machine.

Usage:
    python3 scripts/phase0_activator.py          # Start guided walkthrough
    python3 scripts/phase0_activator.py step 1   # Jump to specific step
    python3 scripts/phase0_activator.py status   # Show progress
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
PROGRESS_FILE = CONFIG_DIR / "phase0_progress.json"
SCRIPTS_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPTS_DIR.parent

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
RESET = "\033[0m"
DIM = "\033[2m"

# Steps definition
STEPS = [
    {
        "id": 1,
        "name": "Build Products",
        "description": "Create sellable product packages from your codebase",
        "commands": [
            ("Scan for assets", ["python3", "scripts/product_factory.py", "scan"]),
            ("Build all products", ["python3", "scripts/product_factory.py", "build"]),
        ],
        "verify": "Check products/ folder for ZIP files",
    },
    {
        "id": 2,
        "name": "Publish to Gumroad",
        "description": "Get products live and ready to sell",
        "commands": [
            (
                "Check Gumroad status",
                ["python3", "scripts/revenue_autopilot.py", "status"],
            ),
            ("Batch publish", ["python3", "scripts/revenue_autopilot.py", "publish"]),
        ],
        "verify": "Visit gumroad.com and verify products are listed",
    },
    {
        "id": 3,
        "name": "Add First Leads",
        "description": "Populate your pipeline with warm prospects",
        "commands": [
            ("View current leads", ["python3", "scripts/outreach_cli.py", "list"]),
        ],
        "manual": "Add leads with: python3 scripts/outreach_cli.py add <name> <email> <company>",
        "verify": "Run outreach_cli.py list to see leads",
    },
    {
        "id": 4,
        "name": "Send Outreach",
        "description": "Contact your leads with personalized emails",
        "commands": [
            ("View lead stats", ["python3", "scripts/outreach_cli.py", "stats"]),
        ],
        "manual": "Draft: outreach_cli.py draft <email>\nSend: outreach_cli.py send <email>",
        "verify": "Check outreach_cli.py stats for contacted leads",
    },
    {
        "id": 5,
        "name": "Create First Invoice",
        "description": "Generate an invoice to get paid",
        "commands": [
            ("View invoice services", ["python3", "scripts/invoice_generator.py"]),
        ],
        "manual": "Create: python3 scripts/invoice_generator.py create 'Client' 2000 'Ghost CTO Lite'",
        "verify": "Check invoice_generator.py list",
    },
    {
        "id": 6,
        "name": "Activate Scheduler",
        "description": "Set up automatic daily operations",
        "commands": [
            ("Install scheduler", ["python3", "scripts/setup_scheduler.py", "install"]),
            ("Check status", ["python3", "scripts/setup_scheduler.py", "status"]),
        ],
        "verify": "Scheduler shows as LOADED",
    },
    {
        "id": 7,
        "name": "Launch Dashboard",
        "description": "See everything working together",
        "commands": [
            ("Full dashboard", ["python3", "scripts/master_dashboard.py"]),
            ("Today's view", ["python3", "scripts/master_dashboard.py", "today"]),
        ],
        "verify": "Dashboard shows revenue, leads, and automation status",
    },
]


def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"current_step": 1, "completed": [], "started": datetime.now().isoformat()}


def save_progress(progress):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


def header():
    print(f"""
{BOLD}{CYAN}╔══════════════════════════════════════════════════════════╗
║  🚀 PHASE 0 ACTIVATOR - Revenue Machine Startup          ║
╚══════════════════════════════════════════════════════════╝{RESET}
""")


def run_command(cmd, description):
    print(f"\n{BLUE}▶ {description}{RESET}")
    print(f"{DIM}  {' '.join(cmd)}{RESET}\n")

    input(f"{YELLOW}Press ENTER to run...{RESET}")

    result = subprocess.run(cmd, cwd=PROJECT_DIR)
    return result.returncode == 0


def execute_step(step_num):
    """Execute a specific step interactively."""
    step = next((s for s in STEPS if s["id"] == step_num), None)
    if not step:
        print(f"❌ Step {step_num} not found")
        return False

    progress = load_progress()

    print(f"\n{'═' * 60}")
    print(f"{BOLD}STEP {step['id']}: {step['name'].upper()}{RESET}")
    print(f"{'═' * 60}")
    print(f"\n{step['description']}\n")

    # Run commands
    for desc, cmd in step.get("commands", []):
        success = run_command(cmd, desc)
        if not success:
            print(
                f"{YELLOW}⚠️ Command may have had issues. Continue anyway? (y/n){RESET}"
            )
            if input().lower() != "y":
                return False

    # Show manual steps if any
    if "manual" in step:
        print(f"\n{YELLOW}📝 MANUAL ACTION REQUIRED:{RESET}")
        print(f"   {step['manual']}")
        input(f"\n{YELLOW}Press ENTER when done...{RESET}")

    # Verify
    print(f"\n{CYAN}✓ VERIFICATION:{RESET}")
    print(f"   {step['verify']}")

    confirm = input(f"\n{GREEN}Step complete? (y/n): {RESET}")
    if confirm.lower() == "y":
        if step_num not in progress["completed"]:
            progress["completed"].append(step_num)
        progress["current_step"] = step_num + 1
        save_progress(progress)
        print(f"\n{GREEN}✅ Step {step_num} completed!{RESET}")
        return True

    return False


def show_status():
    """Show current progress."""
    progress = load_progress()

    header()
    print(f"{BOLD}PROGRESS:{RESET}")
    print(f"{'─' * 40}")

    for step in STEPS:
        if step["id"] in progress["completed"]:
            status = f"{GREEN}✅{RESET}"
        elif step["id"] == progress["current_step"]:
            status = f"{YELLOW}▶{RESET}"
        else:
            status = f"{DIM}○{RESET}"

        print(f"  {status} Step {step['id']}: {step['name']}")

    completed = len(progress["completed"])
    total = len(STEPS)
    pct = (completed / total) * 100

    bar = "█" * completed + "░" * (total - completed)
    print(f"\n  [{bar}] {pct:.0f}% Complete")

    if completed == total:
        print(f"\n{GREEN}{BOLD}🎉 PHASE 0 FULLY ACTIVATED!{RESET}")
    else:
        print(f"\n{YELLOW}Next: Step {progress['current_step']}{RESET}")


def guided_walkthrough():
    """Interactive guided walkthrough."""
    header()

    progress = load_progress()
    current = progress["current_step"]

    print(f"Starting from Step {current}...\n")

    for step in STEPS:
        if step["id"] < current:
            continue
        if step["id"] in progress["completed"]:
            continue

        execute_step(step["id"])

        if step["id"] < len(STEPS):
            cont = input(f"\n{CYAN}Continue to next step? (y/n): {RESET}")
            if cont.lower() != "y":
                print("\n💡 Resume anytime with: python3 scripts/phase0_activator.py")
                return

    print(f"\n{GREEN}{BOLD}🎉 CONGRATULATIONS! PHASE 0 COMPLETE!{RESET}")
    print("Your revenue machine is now ACTIVE.\n")
    print("Daily command: mekong daily")
    print("Dashboard: mekong")


def main():
    if len(sys.argv) < 2:
        guided_walkthrough()
        return

    cmd = sys.argv[1].lower()

    if cmd == "status":
        show_status()
    elif cmd == "step" and len(sys.argv) > 2:
        step_num = int(sys.argv[2])
        execute_step(step_num)
    elif cmd == "reset":
        if PROGRESS_FILE.exists():
            PROGRESS_FILE.unlink()
        print("✅ Progress reset")
    else:
        print(f"Unknown command: {cmd}")
        print("Usage: phase0_activator.py [status|step N|reset]")


if __name__ == "__main__":
    main()
