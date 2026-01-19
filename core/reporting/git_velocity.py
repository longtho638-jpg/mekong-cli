"""
👻 Ghost CTO - Git Velocity Reporter
====================================
Generates engineering metrics from Git history.
"""

import subprocess
from datetime import datetime, timedelta
from typing import Any, Dict


class GitVelocityReporter:
    def _run_git(self, cmd: str) -> str:
        try:
            return subprocess.check_output(cmd, shell=True).decode("utf-8").strip()
        except Exception:
            return ""

    def generate_report(self, days: int = 7) -> Dict[str, Any]:
        since_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        # 1. Commit Count
        commit_count = self._run_git(f"git rev-list --count --since='{since_date}' HEAD")

        # 2. Files Changed
        stats = self._run_git(f"git diff --shortstat --since='{since_date}'")

        # 3. Active Contributors
        authors_raw = self._run_git(
            f"git log --since='{since_date}' --format='%aN' | sort | uniq -c | sort -nr"
        )

        commits = int(commit_count) if commit_count.isdigit() else 0

        # 4. Assessment
        if commits > 50:
            velocity = "🔥 BLAZING FAST"
        elif commits > 10:
            velocity = "✅ STEADY"
        else:
            velocity = "⚠️ LOW VELOCITY"

        return {
            "period_days": days,
            "since": since_date,
            "commits": commits,
            "stats": stats,
            "authors": authors_raw,
            "velocity_score": velocity,
        }

    def format_report(self, data: Dict[str, Any]) -> str:
        return f"""
👻 GHOST CTO REPORT (Last {data["period_days"]} days)
==================================================
📅 Since: {data["since"]}

🔨 Commits: {data["commits"]}
📂 Impact: {data["stats"]}
🚀 Score: {data["velocity_score"]}

👥 Active Engineers:
{data["authors"]}
"""
