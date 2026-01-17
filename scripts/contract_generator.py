#!/usr/bin/env python3
"""
📜 CONTRACT GENERATOR - Auto-Generate Service Agreements
========================================================
Creates professional service contracts for Ghost CTO, Venture Architecture,
and AI Setup engagements. Auto-populates from leads.json.

Usage:
    python3 scripts/contract_generator.py ghost_cto <email>
    python3 scripts/contract_generator.py venture <email>
    python3 scripts/contract_generator.py ai_setup <email>
    python3 scripts/contract_generator.py list
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Config
CONTRACTS_DIR = Path.home() / "mekong-cli/contracts"
LEADS_FILE = Path.home() / ".mekong/leads.json"

# Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Contract Templates
TEMPLATES = {
    "ghost_cto": {
        "title": "Ghost CTO Lite Service Agreement",
        "price": 3000,
        "term": "Monthly (cancel with 30 days notice)",
        "scope": """
## Scope of Services

The Provider agrees to deliver the following services:

### 1. Weekly Engineering Velocity Reports
- Commit analysis and PR metrics
- Cycle time tracking
- Bottleneck identification

### 2. Monthly Architecture Review
- Codebase health assessment
- Technical debt prioritization
- Scalability recommendations

### 3. On-Demand Support
- Slack/Email response within 24 hours
- Up to 5 hours of direct support per month
- Emergency escalation for critical issues

### 4. Quarterly Tech Roadmap
- Strategic planning session
- OKR alignment
- Resource planning recommendations
""",
    },
    "venture": {
        "title": "Venture Architecture Agreement",
        "price": 10000,
        "equity": "5%",
        "term": "3-month engagement + ongoing advisory",
        "scope": """
## Scope of Services

### Phase 1: Discovery (Week 1-2)
- Technical due diligence
- Architecture assessment
- Team capability evaluation

### Phase 2: Design (Week 3-4)
- System architecture design
- Technology stack recommendation
- Scalability planning

### Phase 3: Implementation Oversight (Week 5-12)
- Sprint planning support
- Code review guidance
- Hiring support for first 3 engineers

### Phase 4: Ongoing Advisory
- Monthly advisory calls
- Investor technical prep
- Exit readiness assessment
""",
    },
    "ai_setup": {
        "title": "AI Copilot Setup Agreement",
        "price": 997,
        "term": "One-time engagement",
        "scope": """
## Scope of Services

### Deliverables

1. **AI Tool Configuration**
   - Cursor IDE setup and optimization
   - Claude/GPT integration
   - Custom prompt library (50+ prompts)

2. **Team Training**
   - 2-hour hands-on workshop
   - Best practices documentation
   - Prompt engineering guide

3. **Post-Setup Support**
   - 30 days of email support
   - Access to private Slack channel
   - 1 follow-up call at Day 14
""",
    },
}


def load_lead(email: str) -> dict:
    """Load lead info from leads.json."""
    if not LEADS_FILE.exists():
        return None
    with open(LEADS_FILE) as f:
        leads = json.load(f)
    for lead in leads:
        if lead.get("email") == email:
            return lead
    return None


def generate_contract(template_key: str, email: str) -> Path:
    """Generate a contract for a lead."""
    template = TEMPLATES.get(template_key)
    if not template:
        print(f"{YELLOW}❌ Unknown template: {template_key}{RESET}")
        print(f"Available: {', '.join(TEMPLATES.keys())}")
        return None

    lead = load_lead(email)
    if not lead:
        print(f"{YELLOW}⚠️ Lead not found: {email}. Using placeholder.{RESET}")
        lead = {"name": "[CLIENT NAME]", "company": "[COMPANY]", "email": email}

    # Create output dir
    CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate filename
    date_str = datetime.now().strftime("%Y%m%d")
    company_slug = lead.get("company", "client").replace(" ", "_")
    filename = f"{template_key}_{company_slug}_{date_str}.md"
    filepath = CONTRACTS_DIR / filename

    # Build contract
    effective_date = datetime.now().strftime("%B %d, %Y")
    end_date = (datetime.now() + timedelta(days=365)).strftime("%B %d, %Y")

    contract = f"""# {template["title"]}

**Contract Number**: CON-{date_str}-{company_slug.upper()[:4]}

---

## Parties

**Provider**: Binh Pháp Venture Studio  
**Client**: {lead["name"]}  
**Company**: {lead.get("company", "N/A")}  
**Email**: {lead["email"]}

---

## Effective Date

This Agreement is effective as of **{effective_date}**.

---

## Term

{template["term"]}

---

## Investment

| Service | Price |
|:--------|------:|
| {template["title"]} | **${template["price"]:,}** |
"""

    if template.get("equity"):
        contract += f"| Equity Component | {template['equity']} |\n"

    contract += f"""
---

{template["scope"]}

---

## Payment Terms

1. **Due Date**: Payment due within 7 days of invoice.
2. **Method**: Bank transfer or PayPal.
3. **Late Payment**: 1.5% interest per month on overdue amounts.

---

## Confidentiality

Both parties agree to maintain confidentiality of all proprietary information
shared during the engagement.

---

## Termination

Either party may terminate this Agreement with 30 days written notice.

---

## Signatures

**Provider**:  
Name: _________________________  
Date: _________________________

**Client**:  
Name: _________________________  
Date: _________________________

---

*Contract generated on {datetime.now().strftime("%Y-%m-%d %H:%M")}*
"""

    # Write file
    with open(filepath, "w") as f:
        f.write(contract)

    print(f"\n{GREEN}✅ Contract Generated!{RESET}")
    print(f"📄 File: {filepath}")
    print(f"💼 Service: {template['title']}")
    print(f"💵 Price: ${template['price']:,}")
    print(f"\n{CYAN}Next: Review and send to client for signature.{RESET}")

    return filepath


def list_templates():
    """List available contract templates."""
    print(f"\n{BOLD}📜 AVAILABLE CONTRACT TEMPLATES{RESET}")
    print("=" * 50)
    for key, template in TEMPLATES.items():
        print(f"\n  🔹 {key}")
        print(f"     {template['title']}")
        print(f"     Price: ${template['price']:,}")
        print(f"     Term: {template['term']}")


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
            print(f"Usage: contract_generator.py {cmd} <email>")
            return
        email = sys.argv[2]
        generate_contract(cmd, email)
    else:
        print(f"Unknown command: {cmd}")
        list_templates()


if __name__ == "__main__":
    main()
