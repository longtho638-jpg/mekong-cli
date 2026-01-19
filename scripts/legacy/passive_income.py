#!/usr/bin/env python3
"""
🤖 PASSIVE INCOME ENGINE - Full Auto Revenue System
====================================================
Complete automation for passive income: Affiliates, SEO, Gumroad optimization.

Usage:
    python3 scripts/passive_income.py setup      # Setup all systems
    python3 scripts/passive_income.py affiliate  # Manage affiliates
    python3 scripts/passive_income.py seo        # Generate SEO content
    python3 scripts/passive_income.py optimize   # Optimize Gumroad listings
    python3 scripts/passive_income.py status     # Check all systems
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
PASSIVE_FILE = CONFIG_DIR / "passive_income.json"
CONTENT_DIR = Path.home() / "mekong-cli/content/blog"
SCRIPTS_DIR = Path(__file__).parent

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

# Gumroad Products for optimization
PRODUCTS = {
    "vscode-starter": {
        "url": "https://billmentor.gumroad.com/l/wtehzm",
        "price": 0,
        "keywords": ["vscode", "starter", "developer", "ide", "config"],
    },
    "ai-skills": {
        "url": "https://billmentor.gumroad.com/l/wdkqtn",
        "price": 27,
        "keywords": ["ai", "claude", "cursor", "skills", "prompt"],
    },
    "agencyos-pro": {
        "url": "https://billmentor.gumroad.com/l/oxvdrj",
        "price": 197,
        "keywords": ["agency", "automation", "business", "saas"],
    },
    "agencyos-enterprise": {
        "url": "https://billmentor.gumroad.com/l/pvimm",
        "price": 497,
        "keywords": ["enterprise", "team", "multi-tenant", "white-label"],
    },
}

# SEO Blog Post Templates
SEO_TEMPLATES = {
    "listicle": """# {title}

{intro}

## 1. {point1}
{content1}

## 2. {point2}
{content2}

## 3. {point3}
{content3}

## 4. {point4}
{content4}

## 5. {point5}
{content5}

## Conclusion
{conclusion}

---
**Get the tools mentioned above:** [Download Here]({product_url})
""",
    "howto": """# How to {title}

{intro}

## Prerequisites
{prerequisites}

## Step 1: {step1_title}
{step1_content}

## Step 2: {step2_title}
{step2_content}

## Step 3: {step3_title}
{step3_content}

## Common Mistakes to Avoid
{mistakes}

## Next Steps
{next_steps}

---
**Want the complete toolkit?** [Get it here]({product_url})
""",
    "comparison": """# {product1} vs {product2}: Which is Better in {year}?

{intro}

## Quick Comparison

| Feature | {product1} | {product2} |
|:---|:---:|:---:|
| Price | {p1_price} | {p2_price} |
| Ease of Use | {p1_ease} | {p2_ease} |
| Features | {p1_features} | {p2_features} |

## {product1} Overview
{p1_overview}

## {product2} Overview
{p2_overview}

## Our Recommendation
{recommendation}

---
**Our top pick:** [Check it out]({product_url})
""",
}

# SEO Topics to auto-generate
SEO_TOPICS = [
    {
        "title": "10 VSCode Extensions Every Developer Needs in 2026",
        "template": "listicle",
        "product": "vscode-starter",
    },
    {
        "title": "Set Up Your Perfect VSCode Config in 5 Minutes",
        "template": "howto",
        "product": "vscode-starter",
    },
    {
        "title": "Best AI Coding Assistants: Claude vs Cursor vs Copilot",
        "template": "comparison",
        "product": "ai-skills",
    },
    {
        "title": "5 AI Prompt Patterns That 10x Your Productivity",
        "template": "listicle",
        "product": "ai-skills",
    },
    {
        "title": "Build an Agency Dashboard with AI in One Day",
        "template": "howto",
        "product": "agencyos-pro",
    },
    {
        "title": "How to Automate Your Agency Operations",
        "template": "howto",
        "product": "agencyos-pro",
    },
    {
        "title": "Top 7 Tools for Running a $1M Agency",
        "template": "listicle",
        "product": "agencyos-pro",
    },
    {
        "title": "Gumroad vs Lemonsqueezy for Digital Products",
        "template": "comparison",
        "product": "agencyos-pro",
    },
    {
        "title": "Complete Guide to AI-Assisted Development",
        "template": "howto",
        "product": "ai-skills",
    },
    {
        "title": "5 Revenue Automation Tools for Agencies",
        "template": "listicle",
        "product": "agencyos-enterprise",
    },
]


def load_data():
    if PASSIVE_FILE.exists():
        with open(PASSIVE_FILE) as f:
            return json.load(f)
    return {
        "affiliate_enabled": False,
        "seo_posts_generated": 0,
        "optimizations_done": [],
        "last_run": None,
    }


def save_data(data):
    CONFIG_DIR.mkdir(exist_ok=True)
    data["last_run"] = datetime.now().isoformat()
    with open(PASSIVE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def cmd_setup():
    """Setup all passive income systems."""
    print(f"\n{BOLD}🤖 PASSIVE INCOME ENGINE - FULL SETUP{RESET}")
    print("=" * 60)

    data = load_data()

    # 1. Affiliate Setup
    print(f"\n{CYAN}1. AFFILIATE PROGRAM{RESET}")
    print("   Gumroad has built-in affiliate feature.")
    print("   → Go to: https://app.gumroad.com/settings/affiliates")
    print("   → Enable 'Allow affiliates'")
    print("   → Set commission to 30-50%")
    data["affiliate_enabled"] = True
    print(f"   {GREEN}✅ Marked as enabled{RESET}")

    # 2. SEO Content
    print(f"\n{CYAN}2. SEO CONTENT SYSTEM{RESET}")
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"   → Content folder: {CONTENT_DIR}")
    print(f"   → {len(SEO_TOPICS)} topics ready to generate")
    print(f"   {GREEN}✅ Ready{RESET}")

    # 3. Gumroad Optimizer
    print(f"\n{CYAN}3. GUMROAD OPTIMIZER{RESET}")
    print(f"   → {len(PRODUCTS)} products to optimize")
    print(f"   {GREEN}✅ Ready{RESET}")

    save_data(data)

    print(f"\n{GREEN}{'=' * 60}{RESET}")
    print(f"{GREEN}✅ ALL SYSTEMS READY{RESET}")
    print("\nNext commands:")
    print("  passive_income.py seo       # Generate SEO content")
    print("  passive_income.py optimize  # Optimize listings")
    print("  passive_income.py status    # Check status")


def cmd_seo(count=5):
    """Generate SEO blog content."""
    print(f"\n{BOLD}📝 SEO CONTENT GENERATOR{RESET}")
    print("=" * 60)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    data = load_data()

    generated = 0
    for topic in SEO_TOPICS[:count]:
        title = topic["title"]
        slug = title.lower().replace(" ", "-").replace(":", "").replace("?", "")[:50]
        filepath = CONTENT_DIR / f"{slug}.md"

        if filepath.exists():
            print(f"  ⏭️  Already exists: {slug[:40]}...")
            continue

        product = PRODUCTS.get(topic["product"], PRODUCTS["agencyos-pro"])

        # Generate content (simplified - in production use AI API)
        if topic["template"] == "listicle":
            content = SEO_TEMPLATES["listicle"].format(
                title=title,
                intro=f"In this guide, we'll cover the essential tools and techniques for {title.lower()}.",
                point1="Getting Started",
                content1="First, you need to understand the basics...",
                point2="Core Concepts",
                content2="The main thing to focus on is...",
                point3="Advanced Techniques",
                content3="Once you've mastered the basics...",
                point4="Common Pitfalls",
                content4="Watch out for these mistakes...",
                point5="Best Practices",
                content5="To get the best results...",
                conclusion="Now you have everything you need to succeed.",
                product_url=product["url"],
            )
        elif topic["template"] == "howto":
            content = SEO_TEMPLATES["howto"].format(
                title=title.replace("How to ", ""),
                intro=f"This comprehensive guide will walk you through {title.lower()}.",
                prerequisites="- Basic understanding\n- Required tools",
                step1_title="Preparation",
                step1_content="Before we begin...",
                step2_title="Implementation",
                step2_content="Now let's do the main work...",
                step3_title="Verification",
                step3_content="Finally, let's verify everything works...",
                mistakes="1. Skipping steps\n2. Not testing",
                next_steps="Continue learning with our advanced guides.",
                product_url=product["url"],
            )
        else:  # comparison
            content = f"# {title}\n\nComparison article placeholder.\n\n[Get our tools]({product['url']})"

        with open(filepath, "w") as f:
            f.write(content)

        print(f"  ✅ Generated: {slug[:40]}...")
        generated += 1

    data["seo_posts_generated"] = data.get("seo_posts_generated", 0) + generated
    save_data(data)

    print(f"\n📊 Generated {generated} posts")
    print(f"   Total posts: {data['seo_posts_generated']}")
    print(f"   Folder: {CONTENT_DIR}")
    print("\n💡 Next: Deploy these to a blog (GitHub Pages, Vercel, Netlify)")


def cmd_optimize():
    """Generate optimized Gumroad listings."""
    print(f"\n{BOLD}🎯 GUMROAD LISTING OPTIMIZER{RESET}")
    print("=" * 60)

    for key, product in PRODUCTS.items():
        print(f"\n{CYAN}Product: {key}{RESET}")
        print(f"   URL: {product['url']}")
        print(f"   Price: ${product['price']}")
        print(f"   Keywords: {', '.join(product['keywords'])}")

        # Generate optimized description
        if product["price"] == 0:
            desc = f"""🎁 FREE: Perfect starter kit for developers

What you get:
✅ Professional configuration
✅ Curated recommendations
✅ Instant productivity boost

Keywords: {", ".join(product["keywords"])}

Download now - it's completely FREE!"""
        else:
            desc = f"""🚀 Premium toolkit for serious professionals

Value: ${product["price"] * 3}+ → Your price: ${product["price"]}

What's included:
✅ Complete source code
✅ Documentation
✅ Lifetime updates
✅ Community access

30-day money-back guarantee.

Keywords: {", ".join(product["keywords"])}"""

        print("\n   📝 Optimized Description:")
        print(f"   {'-' * 40}")
        for line in desc.split("\n")[:6]:
            print(f"      {line}")
        print("      ...")

    print(f"\n{GREEN}{'=' * 60}{RESET}")
    print("💡 Copy these descriptions to your Gumroad product pages")
    print("   → https://app.gumroad.com/products")


def cmd_affiliate():
    """Affiliate program management."""
    print(f"\n{BOLD}👥 AFFILIATE PROGRAM{RESET}")
    print("=" * 60)

    print(f"""
{CYAN}SETUP STEPS:{RESET}
1. Go to: https://app.gumroad.com/settings/affiliates
2. Enable 'Allow affiliates'
3. Set commission rate: 30-50% recommended

{CYAN}PROMOTE YOUR AFFILIATE PROGRAM:{RESET}
Share this message with potential affiliates:

---
"Join my affiliate program and earn 30% on every sale!

Products you can promote:
• VSCode Starter Pack (FREE lead magnet)
• AI Skills Pack ($27) → You earn $8.10/sale
• AgencyOS Pro ($197) → You earn $59.10/sale
• AgencyOS Enterprise ($497) → You earn $149.10/sale

Sign up: https://billmentor.gumroad.com/affiliates"
---

{CYAN}WHERE TO FIND AFFILIATES:{RESET}
• Twitter - DevTools influencers
• YouTube - Coding channels
• Discord - Developer communities
• Reddit - r/entrepreneur, r/SideProject
""")


def cmd_status():
    """Show passive income system status."""
    data = load_data()

    print(f"\n{BOLD}📊 PASSIVE INCOME STATUS{RESET}")
    print("=" * 60)

    print(f"\n{CYAN}SYSTEMS:{RESET}")
    print(f"   {'✅' if data.get('affiliate_enabled') else '❌'} Affiliate Program")
    print(
        f"   {'✅' if data.get('seo_posts_generated', 0) > 0 else '❌'} SEO Content ({data.get('seo_posts_generated', 0)} posts)"
    )
    print(f"   {'✅' if PRODUCTS else '❌'} Gumroad Products ({len(PRODUCTS)} listed)")

    print(f"\n{CYAN}TRAFFIC SOURCES:{RESET}")
    print("   🔍 Gumroad Discover: ACTIVE (products listed)")
    print(f"   📝 SEO/Blog: {data.get('seo_posts_generated', 0)} posts")
    print(
        f"   👥 Affiliates: {'Enabled' if data.get('affiliate_enabled') else 'Not enabled'}"
    )

    print(f"\n{CYAN}AUTOMATION LEVEL:{RESET}")
    auto_score = 0
    if data.get("affiliate_enabled"):
        auto_score += 33
    if data.get("seo_posts_generated", 0) >= 10:
        auto_score += 33
    if len(PRODUCTS) >= 4:
        auto_score += 34

    bar = "█" * (auto_score // 10) + "░" * (10 - auto_score // 10)
    print(f"   [{bar}] {auto_score}%")

    if data.get("last_run"):
        print(f"\n   Last run: {data['last_run'][:16]}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        cmd_status()
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        cmd_setup()
    elif cmd == "affiliate":
        cmd_affiliate()
    elif cmd == "seo":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        cmd_seo(count)
    elif cmd == "optimize":
        cmd_optimize()
    elif cmd == "status":
        cmd_status()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
