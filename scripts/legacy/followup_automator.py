#!/usr/bin/env python3
"""
🔄 FOLLOW-UP AUTOMATOR - Never Let a Lead Go Cold
=================================================
Schedules automated follow-up sequences for proposals.
Day 3: "Just checking in..."
Day 7: "Last chance before I move on..."

Usage:
    python3 scripts/followup_automator.py schedule <email>
    python3 scripts/followup_automator.py today       # Check what's due today
    python3 scripts/followup_automator.py list        # All scheduled follow-ups
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Config
FOLLOWUPS_FILE = Path.home() / ".mekong/followups.json"
LEADS_FILE = Path.home() / ".mekong/leads.json"

# Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Follow-up Templates
TEMPLATES = {
    "day3": {
        "subject": "Quick follow-up on my proposal",
        "body": """Hi {name},

Just wanted to follow up on the Ghost CTO proposal I sent earlier this week.

I know you're busy, so I'll keep this short:
- Any questions about the scope?
- Need me to clarify the pricing?
- Want to hop on a quick 15-min call?

Happy to adjust the proposal based on your needs.

Best,
Bill""",
    },
    "day7": {
        "subject": "Last check-in (no hard feelings either way)",
        "body": """Hi {name},

I sent over a Ghost CTO proposal last week and wanted to do one final check-in.

I totally understand if the timing isn't right or if it's not a fit.

Just let me know either way so I can:
✅ Move forward with next steps, OR
✅ Close the loop and maybe reconnect later

No pressure at all. Appreciate your time!

Best,
Bill""",
    },
    "day14": {
        "subject": "Closing the loop",
        "body": """Hi {name},

I'll keep this super short.

I sent a proposal for Ghost CTO services a couple weeks ago. Haven't heard back, so I'm going to assume the timing isn't right.

I'm marking this as closed for now, but feel free to reach out anytime if things change.

Wishing {company} all the best!

Bill""",
    },
}


def load_followups():
    if FOLLOWUPS_FILE.exists():
        with open(FOLLOWUPS_FILE) as f:
            return json.load(f)
    return []


def save_followups(data):
    FOLLOWUPS_FILE.parent.mkdir(exist_ok=True)
    with open(FOLLOWUPS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_lead(email):
    if not LEADS_FILE.exists():
        return None
    with open(LEADS_FILE) as f:
        leads = json.load(f)
    for l in leads:
        if l.get("email") == email:
            return l
    return None


def schedule_followups(email):
    """Schedule Day 3, Day 7, Day 14 follow-ups."""
    lead = load_lead(email)
    if not lead:
        print(f"{YELLOW}⚠️ Lead not found: {email}. Using placeholder.{RESET}")
        lead = {"name": "there", "company": "your company", "email": email}

    followups = load_followups()

    # Remove existing for this email
    followups = [f for f in followups if f["email"] != email]

    today = datetime.now()

    new_followups = [
        {
            "email": email,
            "name": lead.get("name", "there"),
            "company": lead.get("company", "your company"),
            "template": "day3",
            "due_date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "status": "pending",
        },
        {
            "email": email,
            "name": lead.get("name", "there"),
            "company": lead.get("company", "your company"),
            "template": "day7",
            "due_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
            "status": "pending",
        },
        {
            "email": email,
            "name": lead.get("name", "there"),
            "company": lead.get("company", "your company"),
            "template": "day14",
            "due_date": (today + timedelta(days=14)).strftime("%Y-%m-%d"),
            "status": "pending",
        },
    ]

    followups.extend(new_followups)
    save_followups(followups)

    print(f"\n{GREEN}✅ Follow-up Sequence Scheduled for {email}{RESET}")
    print("=" * 50)
    for f in new_followups:
        print(f"  📅 {f['due_date']} - {f['template'].upper()}")
    print(f"\n{CYAN}Run 'followup_automator.py today' to see what's due.{RESET}")


def check_today():
    """Show follow-ups due today."""
    followups = load_followups()
    today = datetime.now().strftime("%Y-%m-%d")

    due_today = [
        f for f in followups if f["due_date"] == today and f["status"] == "pending"
    ]

    print(f"\n{BOLD}📬 FOLLOW-UPS DUE TODAY ({today}){RESET}")
    print("=" * 50)

    if not due_today:
        print(f"  {GREEN}✅ Nothing due today. You're all caught up!{RESET}")
        return

    for f in due_today:
        template = TEMPLATES.get(f["template"], {})
        subject = template.get("subject", "Follow-up")
        body = template.get("body", "").format(name=f["name"], company=f["company"])

        print(f"\n{YELLOW}📧 {f['email']}{RESET}")
        print(f"   Subject: {subject}")
        print(f"   Template: {f['template']}")
        print(f"\n--- Draft ---\n{body[:200]}...\n")
        print(f"   {CYAN}→ Run: outreach_cli.py send {f['email']}{RESET}")


def list_all():
    """List all scheduled follow-ups."""
    followups = load_followups()

    print(f"\n{BOLD}📋 ALL SCHEDULED FOLLOW-UPS{RESET}")
    print("=" * 50)

    if not followups:
        print("  No follow-ups scheduled.")
        return

    # Sort by date
    followups.sort(key=lambda x: x["due_date"])

    for f in followups:
        status_icon = "⏳" if f["status"] == "pending" else "✅"
        print(f"  {status_icon} {f['due_date']} | {f['template']:<6} | {f['email']}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "schedule":
        if len(sys.argv) < 3:
            print("Usage: followup_automator.py schedule <email>")
            return
        schedule_followups(sys.argv[2])
    elif cmd == "today":
        check_today()
    elif cmd == "list":
        list_all()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
