#!/usr/bin/env python3
"""
👻 Ghost CTO - Automated Dev Velocity Reporter
==============================================
Generates weekly engineering reports from Git activity.
Used for "Ghost CTO" retainers ($5K/mo) to prove oversight.

Usage:
    python3 scripts/ghost_cto.py --days 7
"""

import argparse
import subprocess
from datetime import datetime, timedelta


def run_git(cmd):
    try:
        return subprocess.check_output(cmd, shell=True).decode("strip")
    except:
        return ""


def generate_report(days=7):
    print(f"\n👻 GHOST CTO REPORT (Last {days} days)")
    print("=" * 50)

    # Range
    since_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    print(f"📅 Since: {since_date}\n")

    # 1. Commit Count
    commit_count = run_git(f"git rev-list --count --since='{since_date}' HEAD")
    print(f"🔨 Total Commits: {commit_count.strip()}")

    # 2. Files Changed
    stats = run_git(f"git diff --shortstat --since='{since_date}'")
    print(f"📂 Impact: {stats.strip()}")

    # 3. Active Contributors
    authors = run_git(
        f"git log --since='{since_date}' --format='%aN' | sort | uniq -c | sort -nr"
    )
    print("\n👥 Active Engineers:")
    print(authors)

    # 4. Assessment
    commits = int(commit_count.strip()) if commit_count.strip() else 0
    if commits > 50:
        velocity = "🔥 BLAZING FAST"
        notes = "Team is shipping aggressively. Ensure testing coverage keeps up."
    elif commits > 10:
        velocity = "✅ STEADY"
        notes = "Consistent progress. Good rhythm."
    else:
        velocity = "⚠️ LOW VELOCITY"
        notes = "Potential blockage or planning week. Investigate."

    print("\n" + "-" * 50)
    print(f"🚀 VELOCITY SCORE: {velocity}")
    print(f"📝 NOTE: {notes}")
    print("-" * 50 + "\n")

    # Save Report
    filename = f"cto_report_{datetime.now().strftime('%Y%m%d')}.md"
    with open(filename, "w") as f:
        f.write("# 👻 Weekly Engineering Report\n")
        f.write(f"**Period**: Last {days} days\n")
        f.write(f"**Velocity**: {velocity}\n\n")
        f.write("## 📊 key Metrics\n")
        f.write(f"- Commits: {commits}\n")
        f.write(f"- Contributors: \n```\n{authors}\n```\n")
        f.write(f"- Impact: {stats.strip()}\n\n")
        f.write("## 💡 CTO Recommendations\n")
        f.write("1. Review PR cycle time.\n")
        f.write("2. Ensure documentation aligns with new code.\n")

    print(f"✅ Saved to: {filename}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7, help="Days to look back")
    args = parser.parse_args()

    generate_report(args.days)
