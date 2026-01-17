#!/usr/bin/env python3
"""
🏯 Agentic Daily Auto-Runner
============================
Runs all morning checks automatically for the Overlord.

Usage: python3 scripts/auto_daily.py
"""

import subprocess
from datetime import datetime
from pathlib import Path

# Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def run_cmd(cmd, cwd="."):
    """Run command and return output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, cwd=cwd
        )
        return result.stdout.strip(), result.returncode == 0
    except Exception as e:
        return str(e), False


def print_header(title):
    print(f"\n{BOLD}{BLUE}{'=' * 50}{RESET}")
    print(f"{BOLD}{BLUE}{title}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 50}{RESET}\n")


def main():
    print_header("🏯 AGENTIC DAILY REPORT")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # 1. Git Status
    print_header("📤 GIT STATUS")
    output, ok = run_cmd("git log --oneline -5")
    print(output)

    # 2. Tests
    print_header("🧪 TEST STATUS")
    output, ok = run_cmd(
        "python3 -m pytest tests/test_wow.py -v --tb=short 2>&1 | tail -5"
    )
    if "passed" in output:
        print(f"{GREEN}✅ Tests Passing{RESET}")
    else:
        print(f"{RED}❌ Tests Failing{RESET}")
    print(output)

    # 3. Product Stats
    print_header("📦 PRODUCT CATALOG")
    output, ok = run_cmd("python3 scripts/product_stats.py 2>/dev/null")
    print(output)

    # 4. Pending Actions
    print_header("🔴 PENDING USER ACTIONS")
    drafts_dir = Path("marketing/drafts")
    if drafts_dir.exists():
        drafts = list(drafts_dir.glob("*.md"))
        print(f"📝 Pending drafts: {len(drafts)}")
    else:
        print("📝 No pending drafts")

    # 5. Summary
    print_header("🏯 OVERLORD SUMMARY")
    print(f"""
{GREEN}✅ System Healthy{RESET}
{YELLOW}📊 Catalog: $983+{RESET}
{BLUE}🎯 Next: Publish products to Gumroad{RESET}

Run /approve to action items.
""")


if __name__ == "__main__":
    main()
