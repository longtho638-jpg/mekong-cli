"""
Proposal Service
================
Generate service proposals.
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict
from core.outreach.repository import OutreachRepository
from core.config import get_settings

TEMPLATES = {
    "ghost_cto": {
        "title": "Ghost CTO Lite",
        "price": 3000,
        "scope": "Fractional CTO services for growing startups.",
        "duration": "Monthly retainer",
        "deliverables": [
            "Weekly Engineering Velocity Reports",
            "Monthly Architecture Review",
            "On-demand Support"
        ]
    },
    "venture": {
        "title": "Venture Architecture",
        "price": 10000,
        "equity": "5%",
        "scope": "Technical Co-Founder Service.",
        "duration": "3-month engagement",
        "deliverables": [
            "Technical Architecture Design",
            "MVP Development Oversight",
            "Hiring Support"
        ]
    },
}

class ProposalService:
    def __init__(self):
        settings = get_settings()
        self.proposals_dir = Path.home() / settings.LICENSE_DIR_NAME / "proposals"
        self.proposals_dir.mkdir(parents=True, exist_ok=True)
        self.outreach_repo = OutreachRepository()

    def generate_proposal(self, template_key: str, email: str) -> Optional[str]:
        template = TEMPLATES.get(template_key)
        if not template:
            return None

        # Load lead from repository
        leads = self.outreach_repo.load_leads()
        lead = next((l for l in leads if l["email"] == email), None)
        
        if not lead:
            lead = {"name": "Client", "company": "Your Company", "email": email}

        date_str = datetime.now().strftime("%Y%m%d")
        company_safe = lead["company"].replace(" ", "_")
        filename = f"{template_key}_{company_safe}_{date_str}.md"
        filepath = self.proposals_dir / filename

        content = f"# {template['title']}\n\n**Prepared for**: {lead['name']} @ {lead['company']}\n**Date**: {datetime.now().strftime('%B %d, %Y')}\n\n---\n\n## Overview\n{template['scope']}\n\n## Deliverables\n"
        for d in template['deliverables']:
            content += f"- {d}\n"

        content += f"\n---\n## Investment\n**${template['price']:,}** {template.get('duration', '')}\n"
        if template.get("equity"):
            content += f"**Equity**: {template['equity']}\n"

        with open(filepath, "w") as f:
            f.write(content)
            
        return str(filepath)

    def list_templates(self):
        return TEMPLATES
