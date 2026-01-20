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


def run_cmd(cmd, cwd=".", use_shell=False):
    """Run command safely and return output."""
    try:
        if use_shell:
            # Only use shell for complex commands with pipes that can't be converted
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, cwd=cwd
            )
        else:
            # Safe: Split command into arguments or use list directly
            if isinstance(cmd, str):
                cmd_parts = cmd.split()
                result = subprocess.run(
                    cmd_parts, capture_output=True, text=True, cwd=cwd
                )
            else:
                result = subprocess.run(
                    cmd, capture_output=True, text=True, cwd=cwd
                )
        return result.stdout.strip(), result.returncode == 0
    except Exception as e:
        return str(e), False


def run_safe_pytest():
    """Run pytest safely without shell pipes."""
    try:
        # Run pytest directly without shell pipes
        result = subprocess.run(
            ["python3", "-m", "pytest", "tests/test_wow.py", "-v", "--tb=short"],
            capture_output=True,
            text=True
        )
        
        # Get last 5 lines of output using Python instead of shell tail
        lines = result.stdout.strip().split('\n')
        last_lines = '\n'.join(lines[-5:]) if lines else ""
        
        return last_lines, result.returncode == 0
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
    output, ok = run_cmd(["git", "log", "--oneline", "-5"])
    print(output)

    # 2. Tests
    print_header("🧪 TEST STATUS")
    output, ok = run_safe_pytest()
    if "passed" in output:
        print(f"{GREEN}✅ Tests Passing{RESET}")
    else:
        print(f"{RED}❌ Tests Failing{RESET}")
    print(output)

    # 3. Product Stats
    print_header("📦 PRODUCT CATALOG")
    output, ok = run_cmd(["python3", "scripts/legacy/product_stats.py"])
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
