"""
AI Content Service
==================
Generates marketing content (Tweets, Emails, Landing Pages) from templates.
"""

from typing import Dict, List

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


class ContentService:
    def get_products(self) -> Dict[str, Dict]:
        return PRODUCTS

    def generate_tweet(self, product: str) -> List[str]:
        p = PRODUCTS.get(product, PRODUCTS["agencyos"])
        return [
            f"🚀 Just launched: {p['name']}\n\n{p['tagline']}\n\nHere's what you get (thread) 🧵",
            f"Feature 1: {p['features'][0]}\n\nThis alone is worth 10x the price.",
            f"Feature 2: {p['features'][1]}\n\nMost people spend months figuring this out.",
            f"Feature 3: {p['features'][2] if len(p['features']) > 2 else 'And more...'}\n\nThis is the secret sauce.",
            f"The price? {p['price']}\n\nFrankly, it's underpriced.\n\n→ Link in bio",
        ]

    def generate_email(self, product: str) -> str:
        p = PRODUCTS.get(product, PRODUCTS["agencyos"])
        return f"""Subject: {p["tagline"]} 

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

    def generate_landing(self, product: str) -> str:
        p = PRODUCTS.get(product, PRODUCTS["agencyos"])
        return f"""# {p["name"]} 

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
