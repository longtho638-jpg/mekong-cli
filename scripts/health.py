#!/usr/bin/env python3
"""
🩺 Health Check
===============
Verifies all systems are operational.

Usage: python3 scripts/health.py
"""

import subprocess
import sys
from pathlib import Path

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def check(name, condition):
    """Check a condition."""
    status = f"{GREEN}✅{RESET}" if condition else f"{RED}❌{RESET}"
    print(f"  {status} {name}")
    return condition


def main():
    print("\n🩺 HEALTH CHECK")
    print("=" * 40)

    all_ok = True

    # 1. Git - Fixed: Use argument list instead of shell=True
    result = subprocess.run(["git", "status"], capture_output=True)
    all_ok &= check("Git repository", result.returncode == 0)

    # 2. Python - Fixed: Use argument list instead of shell=True
    result = subprocess.run(["python3", "--version"], capture_output=True)
    all_ok &= check("Python 3", result.returncode == 0)

    # 3. Tests - Fixed: Replace shell pipe with Python processing
    result = subprocess.run(
        ["python3", "-m", "pytest", "tests/test_wow.py", "-v", "--tb=short"],
        capture_output=True,
        text=True
    )
    # Check if tests passed using Python instead of shell grep
    tests_passed = result.returncode == 0 and "passed" in result.stdout
    all_ok &= check("Tests passing", tests_passed)
    all_ok &= check("Tests passing", result.returncode == 0)

    # 4. Scripts
    scripts = [
        "scripts/overlord.py",
        "scripts/auto_daily.py",
        "scripts/git_to_tweet.py",
        "scripts/revenue_tracker.py",
        "scripts/product_stats.py",
    ]
    for script in scripts:
        all_ok &= check(f"{Path(script).name}", Path(script).exists())

    # 5. Products
    products = list(Path("products").glob("*.zip"))
    all_ok &= check(f"Products ({len(products)} ZIPs)", len(products) >= 5)

    # 6. Marketing
    drafts = list(Path("marketing/drafts").glob("*.md"))
    all_ok &= check(f"Tweet drafts ({len(drafts)})", len(drafts) >= 1)

    print("=" * 40)
    if all_ok:
        print(f"{GREEN}✅ ALL SYSTEMS OPERATIONAL{RESET}\n")
    else:
        print(f"{YELLOW}⚠️ SOME ISSUES DETECTED{RESET}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
