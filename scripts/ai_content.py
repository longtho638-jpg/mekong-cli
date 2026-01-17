#!/usr/bin/env python3
"""
✍️ AI CONTENT GENERATOR - Automated Marketing Copy
===================================================
Generate marketing content from your products/services using AI.

Usage:
    python3 scripts/ai_content.py tweet <product>   # Generate tweet
    python3 scripts/ai_content.py email <product>   # Generate email copy
    python3 scripts/ai_content.py landing <product> # Landing page copy
    python3 scripts/ai_content.py all <product>     # Generate all content
"""

import sys
from datetime import datetime
from pathlib import Path

# Product catalog for content generation
PRODUCTS = {
    "agencyos": {
        "name": "AgencyOS Pro",
        "price": "$197",
        "tagline": "Run a $1M agency from your IDE",
        "features": ["AI Agent Workforce", "Binh Pháp Strategy", "Revenue Automation"],
        "audience": "Agency founders, freelancers, consultants",
    },
    "ai-skills": {
        "name": "AI Skills Pack",
        "price": "$27",
        "tagline": "10 premium AI skills for any IDE",
        "features": ["Multimodal AI", "Context Engineering", "Sequential Thinking"],
        "audience": "Developers, AI engineers",
    },
    "ghost-cto": {
        "name": "Ghost CTO Service",
        "price": "$5,000/mo",
        "tagline": "Technical leadership without the full-time cost",
        "features": [
            "Weekly velocity reports",
            "Architecture review",
            "Team mentoring",
        ],
        "audience": "Funded startups, SMEs",
    },
    "venture-architecture": {
        "name": "Venture Architecture",
        "price": "$10,000 + 5% equity",
        "tagline": "Build your startup on solid foundations",
        "features": ["Business model design", "Tech stack selection", "Moat analysis"],
        "audience": "Pre-seed/Seed founders",
    },
}


# Content Templates
def generate_tweet(product):
    """Generate tweet thread."""
    p = PRODUCTS.get(product, PRODUCTS["agencyos"])

    tweets = [
        f"🚀 Just launched: {p['name']}\n\n{p['tagline']}\n\nHere's what you get (thread) 🧵",
        f"Feature 1: {p['features'][0]}\n\nThis alone is worth 10x the price.",
        f"Feature 2: {p['features'][1]}\n\nMost people spend months figuring this out.",
        f"Feature 3: {p['features'][2] if len(p['features']) > 2 else 'And more...'}\n\nThis is the secret sauce.",
        f"The price? {p['price']}\n\nFrankly, it's underpriced.\n\n→ Link in bio",
    ]

    return tweets


def generate_email(product):
    """Generate email marketing copy."""
    p = PRODUCTS.get(product, PRODUCTS["agencyos"])

    email = f"""Subject: {p["tagline"]}

Hey {{{{first_name}}}},

I wanted to share something I've been working on...

{p["name"]} - {p["tagline"]}

Here's what makes it different:

✅ {p["features"][0]}
✅ {p["features"][1]}
{f"✅ {p['features'][2]}" if len(p["features"]) > 2 else ""}

Perfect for: {p["audience"]}

The investment: {p["price"]}

But here's the thing - this price won't last.

I'm keeping it low while I gather feedback from early adopters like you.

Ready to level up?

→ [Get {p["name"]} Now]

Cheers,
Bill

P.S. Reply to this email if you have any questions. I read every one.
"""
    return email


def generate_landing(product):
    """Generate landing page copy."""
    p = PRODUCTS.get(product, PRODUCTS["agencyos"])

    landing = f"""# {p["name"]}

## {p["tagline"]}

---

### The Problem

You're spending too much time on things that should be automated.
Your competitors are moving faster.
You need an edge.

### The Solution

{p["name"]} gives you:

- **{p["features"][0]}** - Skip the learning curve
- **{p["features"][1]}** - Proven methodology
- **{p["features"][2] if len(p["features"]) > 2 else "And more..."}** - Results from day one

### Who Is This For?

{p["audience"]}

### What's Included

✅ Complete source code
✅ Documentation
✅ Lifetime updates
✅ Community access

### The Investment

**{p["price"]}**

One-time payment. No subscriptions. No upsells.

[🚀 Get Started Now]

---

### 100% Satisfaction Guarantee

Try it for 30 days. If it's not for you, get a full refund. No questions asked.

---

*Built with 🏯 by AgencyOS*
"""
    return landing


def cmd_tweet(product):
    """Generate tweets."""
    tweets = generate_tweet(product)

    print("\n🐦 TWEET THREAD")
    print("=" * 50)

    for i, tweet in enumerate(tweets, 1):
        chars = len(tweet)
        status = "✅" if chars <= 280 else "⚠️ TOO LONG"
        print(f"\n[Tweet {i}] ({chars}/280) {status}")
        print("-" * 40)
        print(tweet)

    # Save to file
    output_file = Path(
        f"content_tweets_{product}_{datetime.now().strftime('%Y%m%d')}.txt"
    )
    with open(output_file, "w") as f:
        for i, tweet in enumerate(tweets, 1):
            f.write(f"=== Tweet {i} ===\n{tweet}\n\n")
    print(f"\n✅ Saved to: {output_file}")


def cmd_email(product):
    """Generate email copy."""
    email = generate_email(product)

    print("\n📧 EMAIL COPY")
    print("=" * 50)
    print(email)

    output_file = Path(
        f"content_email_{product}_{datetime.now().strftime('%Y%m%d')}.md"
    )
    with open(output_file, "w") as f:
        f.write(email)
    print(f"\n✅ Saved to: {output_file}")


def cmd_landing(product):
    """Generate landing page copy."""
    landing = generate_landing(product)

    print("\n🌐 LANDING PAGE COPY")
    print("=" * 50)
    print(landing[:500] + "...\n[truncated]")

    output_file = Path(
        f"content_landing_{product}_{datetime.now().strftime('%Y%m%d')}.md"
    )
    with open(output_file, "w") as f:
        f.write(landing)
    print(f"\n✅ Full copy saved to: {output_file}")


def cmd_all(product):
    """Generate all content types."""
    print(f"\n✍️ GENERATING ALL CONTENT FOR: {product.upper()}")
    print("=" * 60)

    cmd_tweet(product)
    cmd_email(product)
    cmd_landing(product)

    print("\n" + "=" * 60)
    print("✅ All content generated!")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("Products:", ", ".join(PRODUCTS.keys()))
        return

    cmd = sys.argv[1].lower()
    product = sys.argv[2].lower() if len(sys.argv) > 2 else "agencyos"

    if product not in PRODUCTS:
        print(f"Unknown product: {product}")
        print(f"Available: {', '.join(PRODUCTS.keys())}")
        return

    if cmd == "tweet":
        cmd_tweet(product)
    elif cmd == "email":
        cmd_email(product)
    elif cmd == "landing":
        cmd_landing(product)
    elif cmd == "all":
        cmd_all(product)
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
