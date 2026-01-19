#!/usr/bin/env python3
"""
📅 SOCIAL SCHEDULER - Automated Content Calendar
=================================================
Schedule and auto-post content across social platforms.

Usage:
    python3 scripts/social_scheduler.py generate      # Generate week's content
    python3 scripts/social_scheduler.py queue         # View queue
    python3 scripts/social_scheduler.py post          # Post next scheduled
    python3 scripts/social_scheduler.py auto          # Auto-post all ready
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
QUEUE_FILE = CONFIG_DIR / "social_queue.json"
SCRIPTS_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPTS_DIR.parent

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

# Content templates for each day
DAILY_THEMES = {
    0: {"theme": "Motivation Monday", "product": "agencyos", "type": "inspiration"},
    1: {"theme": "Tutorial Tuesday", "product": "ai-skills", "type": "educational"},
    2: {"theme": "Wisdom Wednesday", "product": "ghost-cto", "type": "tip"},
    3: {"theme": "Throwback Thursday", "product": "agencyos", "type": "story"},
    4: {
        "theme": "Feature Friday",
        "product": "venture-architecture",
        "type": "feature",
    },
    5: {"theme": "Spotlight Saturday", "product": "ai-skills", "type": "showcase"},
    6: {"theme": "Strategy Sunday", "product": "ghost-cto", "type": "strategy"},
}

# Quick tweet templates
TEMPLATES = {
    "inspiration": [
        "🏯 Binh Pháp says: 'Không đánh mà thắng mới là giỏi nhất.'\n\nBuilding a business is the same. Automate → Scale → Win.\n\n{cta}",
        "The best founders I know don't work 80hr weeks.\n\nThey build SYSTEMS that work for them.\n\n{cta}",
    ],
    "educational": [
        "Quick AI skill tip:\n\n1. Define clear context\n2. Use sequential thinking\n3. Verify outputs\n\nThis alone saves 5hrs/week.\n\n{cta}",
        "Most devs prompt wrong.\n\nInstead of: 'Write a function'\nTry: 'Write a function that X, considering Y, returning Z'\n\n{cta}",
    ],
    "tip": [
        "Ghost CTO tip:\n\nTrack these 3 metrics weekly:\n• Velocity (commits/sprint)\n• Cycle time (PR to merge)\n• Bug ratio\n\n{cta}",
        "Your team's velocity isn't about speed.\n\nIt's about PREDICTABILITY.\n\nConsistent delivery > heroic pushes.\n\n{cta}",
    ],
    "feature": [
        "Just shipped: {feature}\n\nThis helps {audience} do {benefit}.\n\nCheck it out → {cta}",
        "New feature alert 🚀\n\n{feature}\n\nBuilt because you asked.\n\n{cta}",
    ],
    "story": [
        "3 years ago I was billing hourly.\nNow my systems bill while I sleep.\n\nThe secret? Automation first.\n\n{cta}",
    ],
    "showcase": [
        "What 10 AI skills can do:\n\n✅ Multimodal analysis\n✅ Context engineering\n✅ Sequential thinking\n\nAll in one pack.\n\n{cta}",
    ],
    "strategy": [
        "Sunday strategy:\n\nThis week, focus on ONE thing.\n\nNot 10 tasks. Not 5 priorities.\n\nONE. THING.\n\n{cta}",
    ],
}

CTA_OPTIONS = [
    "🔗 Link in bio",
    "DM 'READY' for details",
    "Reply and I'll send you the link",
]


def load_queue():
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE) as f:
            return json.load(f)
    return []


def save_queue(queue):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=2)


def generate_tweet(theme_data):
    """Generate a tweet based on theme."""
    import random

    templates = TEMPLATES.get(theme_data["type"], TEMPLATES["inspiration"])
    template = random.choice(templates)
    cta = random.choice(CTA_OPTIONS)

    tweet = template.format(
        cta=cta,
        feature="Venture Architecture",
        audience="founders",
        benefit="build on solid foundations",
    )

    return tweet


def cmd_generate():
    """Generate a week's worth of content."""
    print(f"\n{BOLD}📅 GENERATING WEEKLY CONTENT{RESET}")
    print("=" * 50)

    queue = load_queue()
    today = datetime.now()

    for i in range(7):
        date = today + timedelta(days=i)
        weekday = date.weekday()
        theme_data = DAILY_THEMES[weekday]

        # Check if already queued for this date
        date_str = date.strftime("%Y-%m-%d")
        if any(q["date"] == date_str for q in queue):
            print(f"  ⏭️  {date_str} - Already queued")
            continue

        tweet = generate_tweet(theme_data)

        entry = {
            "id": f"tw_{date_str}",
            "date": date_str,
            "time": "09:00",  # Default morning post
            "theme": theme_data["theme"],
            "product": theme_data["product"],
            "content": tweet,
            "platform": "twitter",
            "status": "queued",
            "created": datetime.now().isoformat(),
        }

        queue.append(entry)
        print(f"  ✅ {date_str} - {theme_data['theme']}")

    save_queue(queue)
    print(f"\n📊 Queue now has {len(queue)} items")


def cmd_queue():
    """Show content queue."""
    queue = load_queue()

    print(f"\n{BOLD}📅 CONTENT QUEUE{RESET}")
    print("=" * 60)

    if not queue:
        print("  Empty. Run: social_scheduler.py generate")
        return

    statuses = {"queued": "⏳", "posted": "✅", "failed": "❌"}

    for item in sorted(queue, key=lambda x: x["date"])[:10]:
        icon = statuses.get(item["status"], "❓")
        print(f"  {icon} {item['date']} {item['time']} - {item['theme']}")
        print(f"     {item['content'][:50]}...")
        print()


def cmd_post():
    """Post next queued item."""
    queue = load_queue()

    # Find next queued item
    today = datetime.now().strftime("%Y-%m-%d")
    ready = [q for q in queue if q["status"] == "queued" and q["date"] <= today]

    if not ready:
        print("  ⏳ No posts ready. Check queue.")
        return

    item = ready[0]

    print(f"\n{BOLD}🐦 POSTING...{RESET}")
    print(f"  Theme: {item['theme']}")
    print(f"  Content:\n{item['content']}\n")

    # Try to post via twitter_poster
    # For now, just open for manual posting
    tweet_file = PROJECT_DIR / "marketing/drafts" / f"tweet_{item['date']}.md"
    tweet_file.parent.mkdir(parents=True, exist_ok=True)
    with open(tweet_file, "w") as f:
        f.write(f"### Tweet 1\n\n{item['content']}")

    # Mark as posted
    item["status"] = "posted"
    item["posted_at"] = datetime.now().isoformat()
    save_queue(queue)

    print(f"  ✅ Saved to: {tweet_file}")
    print("  💡 Run: python3 scripts/twitter_poster.py --post")


def cmd_auto():
    """Auto-post all ready items."""
    queue = load_queue()
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%H:%M")

    ready = [
        q
        for q in queue
        if q["status"] == "queued" and q["date"] <= today and q["time"] <= now
    ]

    if not ready:
        print("  ⏳ No posts ready right now.")
        return

    print(f"\n{BOLD}🤖 AUTO-POSTING {len(ready)} items...{RESET}")

    for item in ready:
        print(f"  📤 {item['theme']}...")
        item["status"] = "posted"
        item["posted_at"] = datetime.now().isoformat()

    save_queue(queue)
    print("\n  ✅ Done!")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("Commands: generate, queue, post, auto")
        return

    cmd = sys.argv[1].lower()

    if cmd == "generate":
        cmd_generate()
    elif cmd == "queue":
        cmd_queue()
    elif cmd == "post":
        cmd_post()
    elif cmd == "auto":
        cmd_auto()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
