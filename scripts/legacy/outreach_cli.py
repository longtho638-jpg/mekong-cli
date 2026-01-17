#!/usr/bin/env python3
"""
📧 OUTREACH CLI - Automated Lead Outreach Engine
=================================================
Generate and track personalized outreach emails for retainer acquisition.

Usage:
    python3 scripts/outreach_cli.py add <name> <email> [company]  # Add lead
    python3 scripts/outreach_cli.py list                          # List leads
    python3 scripts/outreach_cli.py draft <email>                 # Draft email
    python3 scripts/outreach_cli.py send <email>                  # Send email
    python3 scripts/outreach_cli.py stats                         # View stats
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
LEADS_FILE = CONFIG_DIR / "leads.json"
TEMPLATES_DIR = Path(__file__).parent / "templates"

# Email Templates
TEMPLATES = {
    "ghost_cto": {
        "subject": "Quick question about {company}'s engineering velocity",
        "body": """Hi {name},

I noticed {company} is growing fast. Congrats!

Quick question: How are you tracking your engineering team's velocity and output?

I've been helping startups like yours with "Ghost CTO" services - basically fractional technical oversight without the full-time cost.

Here's a sample of what I provide weekly:
- Dev velocity reports (commits, PRs, cycle time)
- Technical debt identification
- Architecture recommendations

Would you be open to a 15-min call to see if this could help {company}?

Best,
Bill

P.S. I've attached a sample CTO report from a similar-sized team.
""",
    },
    "strategy_session": {
        "subject": "Binh Pháp Strategy Session for {company}",
        "body": """Hi {name},

I came across {company} and was impressed by what you're building.

I specialize in strategic consulting for startups using the "Binh Pháp" framework (applying Sun Tzu's Art of War to modern business strategy).

I'm offering a complimentary 30-min strategy session where we'll:
- Analyze your competitive moat
- Identify strategic vulnerabilities
- Map your path to market dominance

Would you be interested in scheduling a session this week?

Best,
Bill

🏯 AgencyOS
""",
    },
}


def load_leads():
    if LEADS_FILE.exists():
        with open(LEADS_FILE) as f:
            return json.load(f)
    return []


def save_leads(leads):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2)


def cmd_add(args):
    """Add a new lead."""
    if len(args) < 2:
        print("Usage: outreach_cli.py add <name> <email> [company]")
        return

    name = args[0]
    email = args[1]
    company = args[2] if len(args) > 2 else "Your Company"

    leads = load_leads()

    # Check duplicate
    if any(l["email"] == email for l in leads):
        print(f"⚠️  Lead {email} already exists")
        return

    lead = {
        "name": name,
        "email": email,
        "company": company,
        "stage": "new",  # new → contacted → replied → meeting → closed
        "added": datetime.now().isoformat(),
        "last_contact": None,
        "notes": "",
    }

    leads.append(lead)
    save_leads(leads)
    print(f"✅ Added lead: {name} <{email}> @ {company}")


def cmd_list():
    """List all leads."""
    leads = load_leads()

    if not leads:
        print("📋 No leads yet. Add one with: outreach_cli.py add <name> <email>")
        return

    print(f"\n📋 LEADS ({len(leads)} total)")
    print("=" * 60)

    stages = {
        "new": "🆕",
        "contacted": "📧",
        "replied": "💬",
        "meeting": "📞",
        "closed": "✅",
    }

    for lead in leads:
        stage_icon = stages.get(lead["stage"], "❓")
        print(f"  {stage_icon} {lead['name']} <{lead['email']}> @ {lead['company']}")
        print(f"      Stage: {lead['stage']} | Added: {lead['added'][:10]}")

    print()


def cmd_draft(args):
    """Draft an outreach email."""
    if len(args) < 1:
        print("Usage: outreach_cli.py draft <email> [template]")
        return

    email = args[0]
    template_name = args[1] if len(args) > 1 else "ghost_cto"

    leads = load_leads()
    lead = next((l for l in leads if l["email"] == email), None)

    if not lead:
        print(f"❌ Lead {email} not found")
        return

    template = TEMPLATES.get(template_name)
    if not template:
        print(f"❌ Template '{template_name}' not found")
        print(f"   Available: {', '.join(TEMPLATES.keys())}")
        return

    subject = template["subject"].format(**lead)
    body = template["body"].format(**lead)

    print("\n📧 DRAFT EMAIL")
    print("=" * 60)
    print(f"To: {lead['name']} <{lead['email']}>")
    print(f"Subject: {subject}")
    print("-" * 60)
    print(body)
    print("=" * 60)
    print("\n💡 To send: outreach_cli.py send {email}")


def cmd_send(args):
    """Send email (opens in default mail client)."""
    if len(args) < 1:
        print("Usage: outreach_cli.py send <email> [template]")
        return

    email = args[0]
    template_name = args[1] if len(args) > 1 else "ghost_cto"

    leads = load_leads()
    lead = next((l for l in leads if l["email"] == email), None)

    if not lead:
        print(f"❌ Lead {email} not found")
        return

    template = TEMPLATES.get(template_name)
    subject = template["subject"].format(**lead)
    body = template["body"].format(**lead)

    # URL encode for mailto
    import urllib.parse

    mailto = f"mailto:{email}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"

    # Open default mail client
    print(f"📧 Opening email client for {email}...")
    subprocess.run(["open", mailto])

    # Update lead stage
    lead["stage"] = "contacted"
    lead["last_contact"] = datetime.now().isoformat()
    save_leads(leads)

    print("✅ Email drafted. Lead marked as 'contacted'")


def cmd_stats():
    """Show outreach statistics."""
    leads = load_leads()

    print("\n📊 OUTREACH STATS")
    print("=" * 40)

    stages = {"new": 0, "contacted": 0, "replied": 0, "meeting": 0, "closed": 0}
    for lead in leads:
        stages[lead.get("stage", "new")] = stages.get(lead.get("stage", "new"), 0) + 1

    icons = {
        "new": "🆕",
        "contacted": "📧",
        "replied": "💬",
        "meeting": "📞",
        "closed": "✅",
    }

    for stage, count in stages.items():
        bar = "█" * count + "░" * (10 - count)
        print(f"  {icons[stage]} {stage:<10} [{bar}] {count}")

    total = len(leads)
    closed = stages.get("closed", 0)
    rate = (closed / total * 100) if total > 0 else 0

    print(f"\n  📈 Conversion Rate: {rate:.1f}% ({closed}/{total})")
    print()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    if cmd == "add":
        cmd_add(args)
    elif cmd == "list":
        cmd_list()
    elif cmd == "draft":
        cmd_draft(args)
    elif cmd == "send":
        cmd_send(args)
    elif cmd == "stats":
        cmd_stats()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
