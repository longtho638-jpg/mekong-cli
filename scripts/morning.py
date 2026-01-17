#!/usr/bin/env python3
"""
🏯 Zero-Touch Morning Pipeline
==============================
Complete morning automation - runs everything with one command.

Usage: python3 scripts/morning.py
"""

import subprocess
from datetime import datetime


def run(cmd, silent=False):
    """Run command."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if not silent:
        print(result.stdout)
    return result.returncode == 0


def main():
    print("\n" + "=" * 60)
    print("🏯 ZERO-TOUCH MORNING PIPELINE")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    steps = [
        ("1️⃣  Git Pull", "git pull origin main 2>/dev/null || true"),
        (
            "2️⃣  Run Tests",
            "python3 -m pytest tests/test_wow.py -v --tb=short 2>&1 | tail -5",
        ),
        ("3️⃣  Product Stats", "python3 scripts/product_stats.py"),
        ("4️⃣  Generate Tweet", "python3 scripts/git_to_tweet.py"),
        ("5️⃣  Revenue Check", "python3 scripts/revenue_tracker.py"),
    ]

    for name, cmd in steps:
        print(f"\n{name}")
        print("-" * 40)
        run(cmd)

    print("\n" + "=" * 60)
    print("✅ MORNING PIPELINE COMPLETE")
    print("=" * 60)
    print("""
🔴 YOUR ACTIONS:
1. Review: marketing/drafts/tweet_20260117.md
2. Post Twitter thread (copy-paste)
3. Publish products to Gumroad (manual)
4. Add revenue: python3 scripts/revenue_tracker.py add 47 gumroad

🏯 Bất chiến nhi thắng
""")


if __name__ == "__main__":
    main()
