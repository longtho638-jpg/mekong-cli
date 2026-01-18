#!/usr/bin/env python3
"""
🎯 SALES FUNNEL AUTOMATION - FREE → Email → Upsell Pipeline
=============================================================
Automate the entire sales funnel from FREE download to paid conversion.

Usage:
    python3 scripts/sales_funnel.py post      # Generate ready-to-post content
    python3 scripts/sales_funnel.py lead <email> <name>  # Add DM lead
    python3 scripts/sales_funnel.py upsell <email>       # Send upsell email
    python3 scripts/sales_funnel.py sequence             # Run full sequence
    python3 scripts/sales_funnel.py stats                # Conversion stats
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
FUNNEL_FILE = CONFIG_DIR / "sales_funnel.json"

# Product links
PRODUCTS = {
    "free": {
        "name": "VSCode Starter Pack",
        "price": 0,
        "url": "https://billmentor.gumroad.com/l/wtehzm",
        "type": "lead_magnet",
    },
    "low": {
        "name": "AI Skills Pack",
        "price": 27,
        "url": "https://billmentor.gumroad.com/l/wdkqtn",
        "type": "entry",
    },
    "mid": {
        "name": "AgencyOS Pro",
        "price": 197,
        "url": "https://billmentor.gumroad.com/l/oxvdrj",
        "type": "core",
    },
    "high": {
        "name": "AgencyOS Enterprise",
        "price": 497,
        "url": "https://billmentor.gumroad.com/l/pvimm",
        "type": "premium",
    },
}

# Ready-to-post content
POST_TEMPLATES = {
    "twitter": [
        """🎁 FREE: VSCode Starter Pack

What's inside:
✅ Pro keybindings
✅ Best extensions list
✅ AI-ready settings

Get it FREE: {free_url}

Like + RT to help others find this 🙏""",
        """I spent 100+ hours configuring my dev environment.

Now I'm giving it away FREE.

VSCode Starter Pack includes:
• Custom keybindings
• Extension recommendations  
• Optimized settings

Grab it: {free_url}

Reply "GOT IT" when you download 👇""",
        """Stop wasting time on VSCode setup.

I packaged my exact config:
→ Keybindings for 2x speed
→ Extensions that actually matter
→ Settings for AI coding

FREE download: {free_url}

DM me if you want the AI Skills Pack too ($27)""",
    ],
    "linkedin": """🚀 Helping developers save 10+ hours on setup

I've packaged my exact VSCode configuration:
• Optimized keybindings
• Curated extensions
• AI-ready settings

FREE download: {free_url}

If you're building with AI (Claude, Cursor, etc), I also have an AI Skills Pack - DM me.

#vscode #developer #productivity #ai""",
}

# Upsell email templates
UPSELL_TEMPLATES = {
    "day1": {
        "subject": "How's the VSCode Starter Pack working for you?",
        "body": """Hey {name},

Thanks for downloading the VSCode Starter Pack!

Quick question: Are you using AI assistants like Claude or Cursor?

If yes, I have something that'll 10x your productivity.

**AI Skills Pack** ($27) includes:
- 10 premium AI skills
- Multimodal analysis
- Context engineering patterns
- Sequential thinking frameworks

Early adopter price: $27 (normally $47)

Get it here: {low_url}

Let me know if you have any questions!

Best,
Bill

P.S. Reply to this email - I read every one.
""",
    },
    "day3": {
        "subject": "Building something bigger?",
        "body": """Hey {name},

Still enjoying the VSCode setup?

I noticed you downloaded the starter pack, so you're clearly serious about dev productivity.

If you're running or planning to run a business, **AgencyOS Pro** might be perfect for you.

It's my complete system for:
✅ Revenue automation
✅ Client management
✅ AI agent workforce
✅ Invoice + payment tracking

One-time: $197 (saves 100+ hours)

Check it out: {mid_url}

Questions? Just reply.

Bill
""",
    },
}


def load_funnel():
    if FUNNEL_FILE.exists():
        with open(FUNNEL_FILE) as f:
            return json.load(f)
    return {"leads": [], "emails_sent": [], "conversions": []}


def save_funnel(data):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(FUNNEL_FILE, "w") as f:
        json.dump(data, f, indent=2)


def cmd_post():
    """Generate ready-to-post content."""
    print("\n🐦 READY-TO-POST CONTENT")
    print("=" * 60)
    print("Copy and paste these directly:\n")

    free_url = PRODUCTS["free"]["url"]

    print("--- TWITTER OPTION 1 ---")
    print(POST_TEMPLATES["twitter"][0].format(free_url=free_url))
    print(f"\n[{len(POST_TEMPLATES['twitter'][0].format(free_url=free_url))} chars]\n")

    print("--- TWITTER OPTION 2 ---")
    print(POST_TEMPLATES["twitter"][1].format(free_url=free_url))
    print(f"\n[{len(POST_TEMPLATES['twitter'][1].format(free_url=free_url))} chars]\n")

    print("--- TWITTER OPTION 3 (with upsell hook) ---")
    print(POST_TEMPLATES["twitter"][2].format(free_url=free_url))
    print(f"\n[{len(POST_TEMPLATES['twitter'][2].format(free_url=free_url))} chars]\n")

    print("--- LINKEDIN ---")
    print(POST_TEMPLATES["linkedin"].format(free_url=free_url))

    print("\n" + "=" * 60)
    print("📋 Copy any of these and post NOW!")
    print("=" * 60)


def cmd_lead(email, name="Friend"):
    """Add a new lead from DM."""
    funnel = load_funnel()

    # Check duplicate
    if any(l["email"] == email for l in funnel["leads"]):
        print(f"⚠️ {email} already in funnel")
        return

    lead = {
        "email": email,
        "name": name,
        "source": "dm",
        "stage": "free_download",
        "added": datetime.now().isoformat(),
        "upsell_sent": None,
    }

    funnel["leads"].append(lead)
    save_funnel(funnel)

    print(f"✅ Added lead: {name} <{email}>")
    print(f"   Next: Run 'sales_funnel.py upsell {email}' tomorrow")


def cmd_upsell(email):
    """Send upsell email."""
    funnel = load_funnel()

    lead = next((l for l in funnel["leads"] if l["email"] == email), None)
    if not lead:
        print(f"❌ Lead {email} not found")
        return

    name = lead.get("name", "Friend")

    # Determine which upsell to send
    if not lead.get("upsell_sent"):
        template = UPSELL_TEMPLATES["day1"]
        lead["upsell_sent"] = "day1"
    else:
        template = UPSELL_TEMPLATES["day3"]
        lead["upsell_sent"] = "day3"

    subject = template["subject"]
    body = template["body"].format(
        name=name, low_url=PRODUCTS["low"]["url"], mid_url=PRODUCTS["mid"]["url"]
    )

    print(f"\n📧 UPSELL EMAIL FOR {email}")
    print("=" * 60)
    print(f"Subject: {subject}\n")
    print(body)
    print("=" * 60)

    # Open in mail client
    import urllib.parse

    mailto = f"mailto:{email}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"

    print("\n💡 Opening email client...")
    subprocess.run(["open", mailto])

    save_funnel(funnel)
    print("✅ Lead marked as upsell sent")


def cmd_sequence():
    """Show full automation sequence."""
    print("""
🎯 SALES FUNNEL SEQUENCE
========================

STEP 1: POST FREE CONTENT
  python3 scripts/sales_funnel.py post
  → Copy a tweet and post it

STEP 2: WHEN SOMEONE DMs/COMMENTS
  python3 scripts/sales_funnel.py lead "email@example.com" "John"
  → Adds them to your funnel

STEP 3: NEXT DAY - SEND UPSELL
  python3 scripts/sales_funnel.py upsell "email@example.com"
  → Opens email with $27 offer

STEP 4: DAY 3 - SEND BIGGER UPSELL
  python3 scripts/sales_funnel.py upsell "email@example.com"
  → Opens email with $197 offer

STEP 5: TRACK CONVERSIONS
  python3 scripts/sales_funnel.py stats
""")


def cmd_stats():
    """Show funnel statistics."""
    funnel = load_funnel()

    print("\n📊 FUNNEL STATS")
    print("=" * 40)

    total_leads = len(funnel["leads"])
    upselled = sum(1 for l in funnel["leads"] if l.get("upsell_sent"))

    print(f"  📧 Total Leads: {total_leads}")
    print(f"  📤 Upsells Sent: {upselled}")
    print(f"  💰 Conversions: {len(funnel.get('conversions', []))}")

    if total_leads > 0:
        print("\n  📋 Recent Leads:")
        for lead in funnel["leads"][-5:]:
            print(f"     • {lead['name']} <{lead['email']}> - {lead['stage']}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        cmd_sequence()
        return

    cmd = sys.argv[1].lower()

    if cmd == "post":
        cmd_post()
    elif cmd == "lead" and len(sys.argv) >= 3:
        email = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else "Friend"
        cmd_lead(email, name)
    elif cmd == "upsell" and len(sys.argv) >= 3:
        cmd_upsell(sys.argv[2])
    elif cmd == "sequence":
        cmd_sequence()
    elif cmd == "stats":
        cmd_stats()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
