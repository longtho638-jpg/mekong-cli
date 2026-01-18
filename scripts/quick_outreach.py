#!/usr/bin/env python3
"""
Quick Outreach - One-click lead management
Usage: python3 scripts/quick_outreach.py <name> <email> <company>
"""

import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent


def run_cmd(cmd: list[str]) -> bool:
    """Run command and return success status."""
    print(f"▶ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


def main():
    if len(sys.argv) < 4:
        print("Usage: python3 quick_outreach.py <name> <email> <company>")
        print("Example: python3 quick_outreach.py 'Alex' 'alex@techstart.com' 'TechStart'")
        sys.exit(1)

    name, email, company = sys.argv[1], sys.argv[2], sys.argv[3]

    print("\n🏯 QUICK OUTREACH - Emergency Revenue Sprint")
    print("=" * 50)

    # Step 1: Add lead
    print("\n📥 Step 1: Adding lead...")
    if not run_cmd(["python3", str(SCRIPTS_DIR / "outreach_cli.py"), "add", name, email, company]):
        print("⚠️ Lead may already exist, continuing...")

    # Step 2: Draft email
    print("\n📝 Step 2: Drafting email...")
    run_cmd(["python3", str(SCRIPTS_DIR / "outreach_cli.py"), "draft", email])

    # Step 3: Show stats
    print("\n📊 Step 3: Current pipeline stats...")
    run_cmd(["python3", str(SCRIPTS_DIR / "outreach_cli.py"), "stats"])

    print("\n✅ Outreach ready! To send:")
    print(f"   python3 scripts/outreach_cli.py send {email}")
    print("\n🏯 Binh Pháp: Không đánh mà thắng!")


if __name__ == "__main__":
    main()
