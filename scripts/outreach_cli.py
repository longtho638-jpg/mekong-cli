#!/usr/bin/env python3
"""
Outreach CLI - Lead management and email outreach
Usage:
    python3 outreach_cli.py add <name> <email> <company>
    python3 outreach_cli.py list
    python3 outreach_cli.py draft <email>
    python3 outreach_cli.py send <email>
    python3 outreach_cli.py stats
"""

import json
import sys
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / ".mekong"
LEADS_FILE = DATA_DIR / "leads.json"


def load_leads() -> list:
    """Load leads from JSON file."""
    DATA_DIR.mkdir(exist_ok=True)
    if LEADS_FILE.exists():
        return json.loads(LEADS_FILE.read_text())
    return []


def save_leads(leads: list):
    """Save leads to JSON file."""
    DATA_DIR.mkdir(exist_ok=True)
    LEADS_FILE.write_text(json.dumps(leads, indent=2))


def cmd_add(name: str, email: str, company: str):
    """Add a new lead."""
    leads = load_leads()

    # Check if lead already exists
    for lead in leads:
        if lead.get("email") == email:
            print(f"⚠️ Lead {email} already exists")
            return

    lead = {
        "name": name,
        "email": email,
        "company": company,
        "status": "new",
        "added": datetime.now().isoformat(),
        "last_contact": None,
    }
    leads.append(lead)
    save_leads(leads)
    print(f"✅ Added lead: {name} <{email}> @ {company}")


def cmd_list():
    """List all leads."""
    leads = load_leads()
    if not leads:
        print("📭 No leads yet. Add some with: outreach_cli.py add <name> <email> <company>")
        return

    print("\n📋 LEAD PIPELINE")
    print("=" * 60)
    for i, lead in enumerate(leads, 1):
        status_emoji = {"new": "🆕", "contacted": "📧", "replied": "💬", "closed": "✅"}.get(
            lead["status"], "❓"
        )
        print(f"{i}. {status_emoji} {lead['name']} <{lead['email']}> @ {lead['company']}")
    print(f"\nTotal: {len(leads)} leads")


def cmd_draft(email: str):
    """Draft an outreach email for a lead."""
    leads = load_leads()
    lead = next((l for l in leads if l["email"] == email), None)

    if not lead:
        print(f"❌ Lead {email} not found")
        return

    # Generate email draft
    draft = f"""
Subject: Quick Question, {lead["name"]}

Hi {lead["name"]},

I noticed {lead["company"]} is doing great work. I help companies like yours with technical strategy and execution.

Quick question: Are you currently looking for a fractional CTO or technical advisor?

If so, I'd love to share how we've helped similar companies:
- 40% faster development cycles
- Zero-downtime deployments
- AI-powered automation

Happy to jump on a 15-min call if helpful.

Best,
[Your Name]
Ghost CTO @ Binh Pháp Venture Studio
"""

    print("\n📝 EMAIL DRAFT")
    print("=" * 60)
    print(draft)
    print("=" * 60)
    print(f"\n💾 Draft saved for {email}")


def cmd_send(email: str):
    """Mark a lead as contacted (simulated send)."""
    leads = load_leads()
    for lead in leads:
        if lead["email"] == email:
            lead["status"] = "contacted"
            lead["last_contact"] = datetime.now().isoformat()
            save_leads(leads)
            print(f"✅ Marked {email} as contacted")
            print("📧 In production, this would send via SendGrid/SMTP")
            return

    print(f"❌ Lead {email} not found")


def cmd_stats():
    """Show pipeline statistics."""
    leads = load_leads()

    stats = {"new": 0, "contacted": 0, "replied": 0, "closed": 0}
    for lead in leads:
        status = lead.get("status", "new")
        stats[status] = stats.get(status, 0) + 1

    print("\n📊 PIPELINE STATS")
    print("=" * 40)
    print(f"🆕 New:       {stats['new']}")
    print(f"📧 Contacted: {stats['contacted']}")
    print(f"💬 Replied:   {stats['replied']}")
    print(f"✅ Closed:    {stats['closed']}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📈 Total:     {len(leads)}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "add" and len(sys.argv) >= 5:
        cmd_add(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "list":
        cmd_list()
    elif cmd == "draft" and len(sys.argv) >= 3:
        cmd_draft(sys.argv[2])
    elif cmd == "send" and len(sys.argv) >= 3:
        cmd_send(sys.argv[2])
    elif cmd == "stats":
        cmd_stats()
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
