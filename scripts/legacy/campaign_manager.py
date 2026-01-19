#!/usr/bin/env python3
"""
📣 CAMPAIGN MANAGER - AI Marketing Director
===========================================
Generates complete 7-Day Product Launch Campaigns.
Outputs content for Twitter, LinkedIn, Email, and Blog.

Usage:
    python3 scripts/campaign_manager.py launch <product_slug> [product_url]
    python3 scripts/campaign_manager.py list

Example:
    mekong campaign launch "admin-dashboard-pro" "https://gum.co/demo"
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Paths
CONTENT_DIR = Path.home() / "mekong-cli/content/campaigns"
QUEUE_FILE = Path.home() / ".mekong/social_queue.json"

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
RESET = "\033[0m"

# Campaign Templates
CAMPAIGN_STRUCTURE = [
    {
        "day": 1,
        "phase": "TEASER",
        "channels": ["twitter", "linkedin"],
        "template": """# 🤫 Something big is coming...

I've been working on a secret project for the last 2 months. 
It's going to change how {audience} handle {pain_point}.

Revealing everything tomorrow at 9AM.

Turn on notifications 🔔

#{hashtag} #buildinpublic""",
    },
    {
        "day": 2,
        "phase": "LAUNCH",
        "channels": ["twitter_thread", "email", "linkedin", "devto"],
        "template": """# 🚀 {product_name} is LIVE!

Finally, the ultimate solution for {pain_point} is here.

Stop wasting time on {old_way}. 
Start {benefit} today.

👉 Get it here: {url}

🧵 THREAD: What's inside? 👇

1/ {feature_1}
{feature_1_desc}

2/ {feature_2}
{feature_2_desc}

3/ {feature_3}
{feature_3_desc}

🎁 Launch Discount: 20% OFF for the first 24h.
Code: LAUNCH20

{url}
""",
    },
    {
        "day": 3,
        "phase": "SOCIAL PROOF",
        "channels": ["twitter"],
        "template": """🤯 Blown away by the response to {product_name}!

"Best investment I made this year." - Early User

We're trending on {platform}! 📈

If you haven't grabbed it yet, the Launch Price ends soon.

👉 {url}

#{hashtag}""",
    },
    {
        "day": 4,
        "phase": "EDUCATION",
        "channels": ["blog", "twitter_thread"],
        "template": """# How to {solve_problem} in 2026

Most people struggle with {pain_point}. Here is the 3-step framework to fix it.

## Step 1: {feature_1}
...

## Step 2: {feature_2}
...

## Step 3: {feature_3}
...

---
Want to automate this? Check out {product_name}: {url}
""",
    },
    {
        "day": 5,
        "phase": "FAQ",
        "channels": ["twitter", "email"],
        "template": """❓ Common questions about {product_name}

Q: Who is this for?
A: {audience} who want to {benefit}.

Q: Do I get lifetime updates?
A: YES! 

Q: Is there a refund policy?
A: 30-day money-back guarantee. Zero risk.

👉 Join {user_count} others: {url}
""",
    },
    {
        "day": 6,
        "phase": "LAST CALL",
        "channels": ["twitter", "email"],
        "template": """⚠️ Price increasing tomorrow!

You have 24 hours left to get {product_name} at the Launch Price.

Don't miss out on:
✅ {feature_1}
✅ {feature_2}
✅ {feature_3}

Lock it in now:
👉 {url}
""",
    },
    {
        "day": 7,
        "phase": "CLOSING",
        "channels": ["twitter", "linkedin"],
        "template": """🚪 Doors closing on Launch Offer.

Thank you to everyone who supported the launch of {product_name}! ❤️

We are now focused on serving our new customers.

If you're still on the fence, this is your last chance for the bonus package.

👉 {url}
""",
    },
]

# Product Definitions (Knowledge Base)
PRODUCT_DB = {
    "admin-dashboard-pro": {
        "name": "Admin Dashboard Pro",
        "audience": "Agency Owners & Solopreneurs",
        "pain_point": "messy spreadsheets and blind operations",
        "old_way": "manual tracking",
        "benefit": "managing your empire with real-time data",
        "solve_problem": "Scale Your Agency Operations",
        "feature_1": "Real-time Revenue Tracking",
        "feature_1_desc": "See exactly how much money you made today, straight from the CLI logs.",
        "feature_2": "Kanban CRM",
        "feature_2_desc": "Visualize your leads pipeline. Never lose a deal again.",
        "feature_3": "Content Calendar",
        "feature_3_desc": "See what's queued for Twitter & LinkedIn in one view.",
        "hashtag": "AgencyOS",
        "platform": "Gumroad",
        "user_count": "50+",
        "url": "https://billmentor.gumroad.com/l/admin-dashboard-pro",
    },
    "ai-skills-pack": {
        "name": "AI Skills Pack",
        "audience": "Developers",
        "pain_point": "getting left behind by AI",
        "old_way": "ignoring AI tools",
        "benefit": "coding 10x faster",
        "solve_problem": "Master AI Coding",
        "feature_1": "Claude Prompts",
        "feature_1_desc": "Copy-paste prompts for architecture, refactoring, and testing.",
        "feature_2": "Cursor Config",
        "feature_2_desc": "The exact settings for maximum AI velocity.",
        "feature_3": "Agent Workflows",
        "feature_3_desc": "How to build your own AI employees.",
        "hashtag": "AICoding",
        "platform": "ProductHunt",
        "user_count": "100+",
        "url": "https://billmentor.gumroad.com/l/ai-skills",
    },
}


def create_campaign(slug, url=None):
    product = PRODUCT_DB.get(slug)

    # Fallback / Generic
    if not product:
        print(
            f"{YELLOW}⚠️ Product '{slug}' not found in DB. Using generic template.{RESET}"
        )
        product = {
            "name": slug.replace("-", " ").title(),
            "audience": "Pro Users",
            "pain_point": "inefficiency",
            "old_way": "the hard way",
            "benefit": "saving time",
            "solve_problem": "Succeed",
            "feature_1": "Core Feature A",
            "feature_1_desc": "It does X better.",
            "feature_2": "Core Feature B",
            "feature_2_desc": "It optimizes Y.",
            "feature_3": "Core Feature C",
            "feature_3_desc": "It automates Z.",
            "hashtag": "Launch",
            "platform": "the internet",
            "user_count": "many",
            "url": url or "https://gumroad.com",
        }

    if url:
        product["url"] = url

    # Map for template compatibility (Fix for KeyError)
    product["product_name"] = product["name"]

    # Create folder
    campaign_dir = CONTENT_DIR / slug
    campaign_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n🚀 GENERATING CAMPAIGN: {product['name']}")
    print(f"📂 Output: {campaign_dir}")
    print("=" * 60)

    generated_files = []

    for day in CAMPAIGN_STRUCTURE:
        content = day["template"].format(**product)
        filename = f"day{day['day']}_{day['phase'].lower()}.md"
        filepath = campaign_dir / filename

        with open(filepath, "w") as f:
            f.write(
                f"---\ntitle: {day['phase']} - {product['name']}\ndate: {datetime.now().strftime('%Y-%m-%d')}\n---\n\n"
            )
            f.write(content)

        print(f"  ✅ Day {day['day']} ({day['phase']}): {filename}")
        generated_files.append(filepath)

    print(f"\n{GREEN}✨ Campaign Generated Successfully!{RESET}")
    print(
        f"To broadcast Day 1: mekong broadcast content/campaigns/{slug}/day1_teaser.md"
    )


def schedule_campaign(slug, start_date=None):
    """Auto-schedule campaign to Social Queue."""
    campaign_dir = CONTENT_DIR / slug
    if not campaign_dir.exists():
        print(f"{RED}❌ Campaign not found: {slug}{RESET}")
        print("Run 'launch' first.")
        return

    # Load Queue
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE) as f:
            try:
                queue = json.load(f)
            except Exception:
                queue = []
    else:
        queue = []

    # Calculate dates
    if not start_date:
        start_date = datetime.now() + timedelta(days=1)  # Start tomorrow
    else:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")

    print(f"\n📅 SCHEDULING CAMPAIGN: {slug}")
    print(f"   Start Date: {start_date.strftime('%Y-%m-%d')}")
    print("=" * 60)

    # Process files
    scheduled_count = 0
    files = sorted(list(campaign_dir.glob("day*.md")))

    if not files:
        print(f"{YELLOW}⚠️ No campaign files found.{RESET}")
        return

    for i, file_path in enumerate(files):
        # Extract content (naive parsing)
        with open(file_path) as f:
            raw_content = f.read()
            # Remove frontmatter
            if raw_content.startswith("---"):
                try:
                    _, frontmatter, content = raw_content.split("---", 2)
                    content = content.strip()
                except Exception:
                    content = raw_content
            else:
                content = raw_content

        post_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")

        # Check collision
        if any(q["date"] == post_date for q in queue):
            print(f"  ⏭️  {post_date} - Busy, appending to queue anyway.")

        entry = {
            "id": f"s_{slug}_{post_date}",
            "date": post_date,
            "time": "09:00",
            "theme": f"Launch Day {i + 1}",
            "product": slug,
            "content": content,
            "platform": "twitter",  # Default to Twitter for queue
            "status": "queued",
            "created": datetime.now().isoformat(),
        }

        queue.append(entry)
        print(f"  ✅ {post_date}: Day {i + 1} Queued")
        scheduled_count += 1

    # Save
    QUEUE_FILE.parent.mkdir(exist_ok=True)
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=2)

    print(f"\n{GREEN}✨ {scheduled_count} posts added to Social Queue!{RESET}")
    print("   Run 'mekong daily' to auto-post when the day comes.")


def list_products():
    print("\n📦 PRODUCT DATABASE")
    print("=" * 40)
    for key, p in PRODUCT_DB.items():
        print(f"  🔹 {key:<25} | {p['name']}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "launch":
        if len(sys.argv) < 3:
            print("Usage: campaign_manager.py launch <product_slug> [url]")
            return
        slug = sys.argv[2]
        url = sys.argv[3] if len(sys.argv) > 3 else None
        create_campaign(slug, url)
    elif cmd == "schedule":
        if len(sys.argv) < 3:
            print(
                "Usage: campaign_manager.py schedule <product_slug> [start_date YYYY-MM-DD]"
            )
            return
        slug = sys.argv[2]
        date = sys.argv[3] if len(sys.argv) > 3 else None
        schedule_campaign(slug, date)
    elif cmd == "list":
        list_products()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
