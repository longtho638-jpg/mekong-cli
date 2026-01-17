#!/usr/bin/env python3
"""
📜 CONTRACT GENERATOR - Auto-Generate Service Agreements
========================================================
Creates professional service contracts for Ghost CTO, Venture Architecture,
and AI Setup engagements. Auto-populates from leads.json.

Alignment:
    - Binh Pháp Venture Studio Standards
    - Antigravity/Mekong Architecture

Usage:
    python3 scripts/contract_generator.py generate <template_key> <email>
    python3 scripts/contract_generator.py list
"""

import argparse
import json
import logging
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, List, Any

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ContractGen")

# Constants
CONTRACTS_DIR = Path.home() / "mekong-cli/contracts"
# Search paths for leads, prioritizing new architecture
LEAD_SOURCES = [
    Path.home() / ".antigravity/crm/leads.json",
    Path.home() / ".mekong/leads.json",
    Path("data/leads.json"),  # Local project data
]

# Colors (ANSI)
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"


@dataclass
class ContractTemplate:
    """Defines the structure for a service contract template."""
    key: str
    title: str
    price: int
    term: str
    scope: str
    equity: Optional[str] = None

    @property
    def formatted_price(self) -> str:
        return f"${self.price:,}"


# Contract Templates Definitions
# TODO: Load these from a dynamic config or database in the future.
TEMPLATES: Dict[str, ContractTemplate] = {
    "ghost_cto": ContractTemplate(
        key="ghost_cto",
        title="Ghost CTO Lite Service Agreement",
        price=3000,
        term="Monthly (cancel with 30 days notice)",
        scope="""
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
    ),
    "venture": ContractTemplate(
        key="venture",
        title="Venture Architecture Agreement",
        price=10000,
        equity="5%",
        term="3-month engagement + ongoing advisory",
        scope="""
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
    ),
    "ai_setup": ContractTemplate(
        key="ai_setup",
        title="AI Copilot Setup Agreement",
        price=997,
        term="One-time engagement",
        scope="""
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
    ),
}


def load_lead(email: str) -> Optional[Dict[str, Any]]:
    """
    Load lead info from multiple potential sources.
    Prioritizes Antigravity CRM, then Legacy Mekong, then local data.
    """
    for source_path in LEAD_SOURCES:
        if source_path.exists():
            try:
                with open(source_path, "r", encoding="utf-8") as f:
                    leads = json.load(f)
                    
                # Handle both list of leads and dict of leads keyed by email/id
                if isinstance(leads, list):
                    for lead in leads:
                        if isinstance(lead, dict) and lead.get("email") == email:
                            logger.info(f"Lead found in {source_path}")
                            return lead
                elif isinstance(leads, dict):
                     # Check if it's a direct key or values list
                     if email in leads:
                         return leads[email]
                     # Search values
                     for lead in leads.values():
                         if isinstance(lead, dict) and lead.get("email") == email:
                             return lead

            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON from {source_path}")
            except Exception as e:
                logger.warning(f"Error reading {source_path}: {e}")

    return None


def generate_markdown_content(template: ContractTemplate, lead: Dict[str, Any], date_str: str) -> str:
    """Generates the Markdown content for the contract."""
    effective_date = datetime.now().strftime("%B %d, %Y")
    company_slug = lead.get("company", "CLIENT").replace(" ", "_").upper()
    
    content = f"""# {template.title}

**Contract Number**: CON-{date_str}-{company_slug[:4]}

---

## Parties

**Provider**: Binh Pháp Venture Studio  
**Client**: {lead.get("name", "Valued Client")}  
**Company**: {lead.get("company", "N/A")}  
**Email**: {lead.get("email", "N/A")}

---

## Effective Date

This Agreement is effective as of **{effective_date}**.

---

## Term

{template.term}

---

## Investment

| Service | Price |
|:--------|------:|
| {template.title} | **{template.formatted_price}** |
"""

    if template.equity:
        content += f"| Equity Component | {template.equity} |\n"

    content += f"""
---

{template.scope}

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
    return content


def generate_contract(template_key: str, email: str) -> Optional[Path]:
    """Generate a contract for a lead."""
    template = TEMPLATES.get(template_key)
    if not template:
        logger.error(f"Unknown template: {template_key}")
        print(f"{RED}❌ Unknown template: {template_key}{RESET}")
        list_templates()
        return None

    lead = load_lead(email)
    if not lead:
        print(f"{YELLOW}⚠️ Lead not found: {email}. Using placeholder data.{RESET}")
        lead = {"name": "[CLIENT NAME]", "company": "[COMPANY]", "email": email}

    try:
        # Create output dir
        CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)

        # Generate filename
        date_str = datetime.now().strftime("%Y%m%d")
        company_slug = lead.get("company", "client").replace(" ", "_").lower()
        filename = f"{template_key}_{company_slug}_{date_str}.md"
        filepath = CONTRACTS_DIR / filename

        # Build contract content
        contract_content = generate_markdown_content(template, lead, date_str)

        # Write file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(contract_content)

        print(f"\n{GREEN}✅ Contract Generated Successfully!{RESET}")
        print(f"📄 File:    {filepath}")
        print(f"💼 Service: {template.title}")
        print(f"💵 Price:   {template.formatted_price}")
        if template.equity:
            print(f"📈 Equity:  {template.equity}")
        print(f"\n{CYAN}Next Steps: Review the markdown file and export to PDF/Docx.{RESET}")

        return filepath

    except Exception as e:
        logger.error(f"Failed to generate contract: {e}")
        print(f"{RED}❌ Error generating contract: {e}{RESET}")
        return None


def list_templates():
    """List available contract templates."""
    print(f"\n{BOLD}📜 AVAILABLE CONTRACT TEMPLATES{RESET}")
    print("=" * 60)
    print(f"{'Key':<15} | {'Price':<10} | {'Title'}")
    print("-" * 60)
    for key, template in TEMPLATES.items():
        print(f"{CYAN}{key:<15}{RESET} | {template.formatted_price:<10} | {template.title}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Contract Generator - Binh Pháp Venture Studio",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List Command
    subparsers.add_parser("list", help="List available contract templates")

    # Generate Command
    gen_parser = subparsers.add_parser("generate", help="Generate a new contract")
    gen_parser.add_argument("template", help="Template key (e.g., ghost_cto, venture)")
    gen_parser.add_argument("email", help="Client email address to lookup in CRM")

    # Compatibility shim for old usage: python script.py <template> <email>
    if len(sys.argv) > 1 and sys.argv[1] not in ["list", "generate", "-h", "--help"]:
        # If the first arg is a template key, assume legacy mode
        if sys.argv[1] in TEMPLATES:
            args = argparse.Namespace(command="generate", template=sys.argv[1], email=sys.argv[2] if len(sys.argv) > 2 else None)
            if not args.email:
                 print(f"{RED}❌ Error: Email is required for legacy mode.{RESET}")
                 print(f"Usage: {sys.argv[0]} {sys.argv[1]} <email>")
                 sys.exit(1)
        else:
             args = parser.parse_args()
    else:
        args = parser.parse_args()

    if args.command == "list":
        list_templates()
    elif args.command == "generate":
        generate_contract(args.template, args.email)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
