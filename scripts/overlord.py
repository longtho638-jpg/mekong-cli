#!/usr/bin/env python3
"""
🏯 Overlord Command Center
==========================
Master command for all Agentic Overlord operations.

Usage:
    python3 scripts/overlord.py daily     # Morning report
    python3 scripts/overlord.py tweet     # Generate tweets
    python3 scripts/overlord.py revenue   # Revenue dashboard
    python3 scripts/overlord.py products  # Product stats
    python3 scripts/overlord.py test      # Run tests
    python3 scripts/overlord.py ship      # Full ship pipeline
"""

import subprocess
import sys

BOLD = "\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def run(cmd, show=True):
    """Run command and return output."""
    if show:
        print(f"{BLUE}▶ {cmd}{RESET}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip(), result.returncode == 0


def cmd_daily():
    """Morning dashboard."""
    run("python3 scripts/auto_daily.py", show=False)
    output, _ = run("python3 scripts/auto_daily.py", show=False)
    print(output)


def cmd_tweet():
    """Generate tweets from commits."""
    output, _ = run("python3 scripts/git_to_tweet.py", show=False)
    print(output)


def cmd_revenue():
    """Show revenue dashboard."""
    output, _ = run("python3 scripts/revenue_tracker.py", show=False)
    print(output)


def cmd_products():
    """Show product stats."""
    output, _ = run("python3 scripts/product_stats.py", show=False)
    print(output)


def cmd_test():
    """Run test suite."""
    output, ok = run(
        "python3 -m pytest tests/test_wow.py -v --tb=short 2>&1 | tail -5", show=False
    )
    if ok and "passed" in output:
        print(f"{GREEN}✅ Tests Passing{RESET}")
    else:
        print(f"{YELLOW}⚠️ Check tests{RESET}")
    print(output)


def cmd_ship():
    """Full ship pipeline: test → commit → push."""
    print(f"\n{BOLD}🏯 SHIP PIPELINE{RESET}\n")

    # 1. Tests
    print("1️⃣ Running tests...")
    output, ok = run(
        "python3 -m pytest tests/test_wow.py -v --tb=short 2>&1 | tail -3", show=False
    )
    if "passed" in output:
        print(f"   {GREEN}✅ Tests passed{RESET}")
    else:
        print(f"   {YELLOW}⚠️ Tests need attention{RESET}")
        print(output)
        return

    # 2. Git status
    print("2️⃣ Checking git status...")
    output, _ = run("git status --short", show=False)
    if not output:
        print("   📦 Nothing to commit")
        return
    print(f"   📝 {len(output.split(chr(10)))} files changed")

    # 3. Generate tweet
    print("3️⃣ Generating content...")
    run("python3 scripts/git_to_tweet.py > /dev/null 2>&1", show=False)
    print("   🐦 Tweet draft ready")

    # 4. Summary
    print(f"\n{GREEN}✅ Ready to ship!{RESET}")
    print("\nRun: git add -A && git commit -m 'message' && git push")


def cmd_help():
    """Show help."""
    print(f"""
{BOLD}🏯 OVERLORD COMMAND CENTER{RESET}

{BLUE}Commands:{RESET}
  daily     Morning dashboard
  tweet     Generate tweets
  revenue   Revenue dashboard  
  products  Product stats
  test      Run tests
  ship      Full ship pipeline
  help      This help

{YELLOW}Example:{RESET}
  python3 scripts/overlord.py daily
""")


def main():
    commands = {
        "daily": cmd_daily,
        "tweet": cmd_tweet,
        "revenue": cmd_revenue,
        "products": cmd_products,
        "test": cmd_test,
        "ship": cmd_ship,
        "help": cmd_help,
    }

    if len(sys.argv) < 2:
        cmd_help()
        return

    cmd = sys.argv[1]
    if cmd in commands:
        commands[cmd]()
    else:
        print(f"Unknown command: {cmd}")
        cmd_help()


if __name__ == "__main__":
    main()
