#!/usr/bin/env python3
"""
📄 PROPOSAL GENERATOR - Auto-Create Service Proposals
=====================================================
Generates professional proposals for Ghost CTO / Venture services.
Outputs Markdown (ready for PDF conversion).

Usage:
    python3 scripts/proposal_generator.py ghost_cto <email>
    python3 scripts/proposal_generator.py venture <email>
    python3 scripts/proposal_generator.py list
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Config
PROPOSALS_DIR = Path.home() / "mekong-cli/proposals"
LEADS_FILE = Path.home() / ".mekong/leads.json"

# Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Proposal Templates
TEMPLATES = {
    "ghost_cto": {
        "title": "Ghost CTO Lite - Technical Oversight Service",
        "price": 3000,
        "deliverables": [
            "Weekly Engineering Velocity Reports",
            "Monthly Architecture Review",
            "On-demand Slack/Email support (response < 24h)",
            "Quarterly Tech Roadmap Planning",
            "Code Review Guidelines & Best Practices",
        ],
        "scope": "Fractional CTO services for growing startups. All the technical leadership, none of the full-time cost.",
        "duration": "Monthly retainer (cancel anytime with 30 days notice)",
    },
    "venture": {
        "title": "Venture Architecture - Technical Co-Founder Service",
        "price": 10000,
        "equity": "5%",
        "deliverables": [
            "Full Technical Architecture Design",
            "MVP Development Oversight (12 weeks)",
            "Hiring Support for First 3 Engineers",
            "Investor Technical Due Diligence Prep",
            "Weekly Strategy Calls",
        ],
        "scope": "For pre-seed/seed startups needing a technical co-founder without giving up 50% equity.",
        "duration": "3-month engagement + ongoing advisory",
    },
    "ai_setup": {
        "title": "AI Copilot Setup - Transform Your Dev Workflow",
        "price": 997,
        "deliverables": [
            "Cursor/Claude/Copilot Configuration",
            "Custom Prompt Library (50+ prompts)",
            "Team Training Session (2 hours)",
            "30-day Follow-up Support",
        ],
        "scope": "One-time setup to 10x your team's development velocity with AI tools.",
        "duration": "One-time engagement",
    },
}


def load_lead(email):
    """Load lead info from leads.json."""
    if not LEADS_FILE.exists():
        return None
    with open(LEADS_FILE) as f:
        leads = json.load(f)
    for l in leads:
        if l.get("email") == email:
            return l
    return None


def generate_proposal(template_key, email):
    """Generate a proposal for a lead."""
    template = TEMPLATES.get(template_key)
    if not template:
        print(f"{YELLOW}❌ Unknown template: {template_key}{RESET}")
        print(f"Available: {', '.join(TEMPLATES.keys())}")
        return

    lead = load_lead(email)
    if not lead:
        print(f"{YELLOW}⚠️ Lead not found: {email}. Using placeholder.{RESET}")
        lead = {"name": "Valued Client", "company": "Your Company", "email": email}

    # Create output dir
    PROPOSALS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate filename
    date_str = datetime.now().strftime("%Y%m%d")
    filename = f"{template_key}_{lead['company'].replace(' ', '_')}_{date_str}.md"
    filepath = PROPOSALS_DIR / filename

    # Build proposal
    proposal = f"""# {template["title"]}

**Prepared for**: {lead["name"]} @ {lead["company"]}  
**Date**: {datetime.now().strftime("%B %d, %Y")}  
**Valid Until**: {(datetime.now() + timedelta(days=14)).strftime("%B %d, %Y")}

---

## Overview

{template["scope"]}

---

## What You Get

"""
    for i, d in enumerate(template["deliverables"], 1):
        proposal += f"{i}. ✅ {d}\n"

    proposal += f"""
---

## Investment

| Item | Price |
|:-----|------:|
| **{template["title"]}** | **${template["price"]:,}{"/" + ("mo" if "Monthly" in template.get("duration", "") else "one-time")}** |
"""

    if template.get("equity"):
        proposal += f"| Equity Component | {template['equity']} |\n"

    proposal += f"""
**Duration**: {template["duration"]}

---

## Next Steps

1. Reply to this email with any questions.
2. Sign the agreement (I'll send a DocuSign).
3. First payment initiates the engagement.

---

## Payment

**Bank Transfer**: Available upon request.  
**Stripe/PayPal**: [Payment Link]

---

*This proposal is confidential and intended for {lead["company"]} only.*

---

**Questions?** Reply to this email or book a call: [calendly.com/billmentor](https://calendly.com/billmentor)

"""

    # Write file
    with open(filepath, "w") as f:
        f.write(proposal)

    print(f"\n{GREEN}✅ Proposal Generated!{RESET}")
    print(f"📄 File: {filepath}")
    print(f"💰 Service: {template['title']}")
    print(f"💵 Price: ${template['price']:,}")
    print(f"\n{CYAN}Next: Attach to email or convert to PDF.{RESET}")

    return filepath


def list_templates():
    print(f"\n{BOLD}📋 AVAILABLE PROPOSAL TEMPLATES{RESET}")
    print("=" * 50)
    for key, t in TEMPLATES.items():
        print(f"\n  🔹 {key}")
        print(f"     {t['title']}")
        print(f"     Price: ${t['price']:,}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        list_templates()
        return

    cmd = sys.argv[1].lower()

    if cmd == "list":
        list_templates()
    elif cmd in TEMPLATES:
        if len(sys.argv) < 3:
            print(f"Usage: proposal_generator.py {cmd} <email>")
            return
        email = sys.argv[2]
        generate_proposal(cmd, email)
    else:
        print(f"Unknown command: {cmd}")
        list_templates()


if __name__ == "__main__":
    main()
