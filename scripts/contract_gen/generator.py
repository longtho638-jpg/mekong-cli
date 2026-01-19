import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from .loader import load_lead
from .models import ContractTemplate
from .templates import TEMPLATES

logger = logging.getLogger("ContractGen")

# Colors (ANSI)
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

CONTRACTS_DIR = Path.home() / "mekong-cli/contracts"


def generate_markdown_content(
    template: ContractTemplate, lead: Dict[str, Any], date_str: str
) -> str:
    """Generates the Markdown content for the contract."""
    effective_date = datetime.now().strftime("%B %d, %Y")
    company_slug = lead.get("company", "CLIENT").replace(" ", "_").upper()

    # Use triple quotes for multi-line string to avoid quote escaping issues
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

    content += f"\n---\n\n{template.scope}\n\n---\n\n## Payment Terms\n\n1. **Due Date**: Payment due within 7 days of invoice.\n2. **Method**: Bank transfer or PayPal.\n3. **Late Payment**: 1.5% interest per month on overdue amounts.\n\n---\n\n## Confidentiality\n\nBoth parties agree to maintain confidentiality of all proprietary information\nshared during the engagement.\n\n---\n\n## Termination\n\nEither party may terminate this Agreement with 30 days written notice.\n\n---\n\n## Signatures\n\n**Provider**:  \nName: _________________________  \nDate: _________________________  \n\n**Client**:  \nName: _________________________  \nDate: _________________________\n\n---\n\n*Contract generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n"
    return content


def generate_contract(template_key: str, email: str) -> Optional[Path]:
    """Generate a contract for a lead."""
    template = TEMPLATES.get(template_key)
    if not template:
        logger.error(f"Unknown template: {template_key}")
        print(f"{RED}❌ Unknown template: {template_key}{RESET}")
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
