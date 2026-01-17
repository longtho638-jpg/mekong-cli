#!/usr/bin/env python3
"""
📝 Git-to-Tweet Generator
=========================
Generates Twitter thread from recent git commits.
Part of the Agentic Overlord Content Engine.

Usage: python3 scripts/git_to_tweet.py
"""

import subprocess
from datetime import datetime
from pathlib import Path


def get_recent_commits(n=5):
    """Get recent commits."""
    result = subprocess.run(
        ["git", "log", f"-{n}", "--pretty=format:%h|%s|%ci"],
        capture_output=True,
        text=True,
    )
    commits = []
    for line in result.stdout.strip().split("\n"):
        if line:
            parts = line.split("|")
            if len(parts) >= 3:
                commits.append(
                    {"hash": parts[0], "message": parts[1], "date": parts[2]}
                )
    return commits


def generate_tweet(commit):
    """Generate tweet from commit."""
    msg = commit["message"]
    emoji = "🏯"

    if "feat:" in msg or "feat(" in msg:
        emoji = "🚀"
    elif "fix:" in msg or "fix(" in msg:
        emoji = "🐛→✅"
    elif "docs:" in msg:
        emoji = "📝"
    elif "test" in msg.lower():
        emoji = "🧪"
    elif "chore:" in msg:
        emoji = "🧹"

    # Clean up message
    clean_msg = (
        msg.replace("🏯 ", "")
        .replace("🚀 ", "")
        .replace("feat: ", "")
        .replace("fix: ", "")
    )

    return f"{emoji} Just shipped: {clean_msg}\n\n#buildinpublic #agencyos"


def main():
    print("📝 GIT-TO-TWEET GENERATOR")
    print("=" * 50)

    commits = get_recent_commits(5)

    print(f"\n📊 Found {len(commits)} recent commits\n")

    drafts_dir = Path("marketing/drafts")
    drafts_dir.mkdir(parents=True, exist_ok=True)

    today = datetime.now().strftime("%Y%m%d")
    draft_file = drafts_dir / f"tweet_{today}.md"

    content = f"""# 🐦 Twitter Thread Draft - {datetime.now().strftime("%Y-%m-%d")}

> Auto-generated from git commits. Review and approve during Overlord Shift.

---

## Thread (5 tweets)

"""

    for i, commit in enumerate(commits, 1):
        tweet = generate_tweet(commit)
        content += f"""### Tweet {i}

{tweet}

---

"""

    content += """
## CTA Tweet

🏯 Building a $1M agency, one commit at a time.

Follow along: @billmentor

#buildinpublic #agencyos #shipeveryday
"""

    draft_file.write_text(content)
    print(f"✅ Draft saved: {draft_file}")
    print("\n📝 Preview:\n")

    for commit in commits[:3]:
        print(generate_tweet(commit))
        print()


if __name__ == "__main__":
    main()
