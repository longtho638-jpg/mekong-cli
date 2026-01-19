"""
Outreach Service
================
Business logic for lead outreach and templates.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from .repository import OutreachRepository
from .templates import TEMPLATES


class OutreachService:
    def __init__(self):
        self.repo = OutreachRepository()

    def add_lead(self, name: str, email: str, company: str) -> bool:
        lead = {
            "name": name,
            "email": email,
            "company": company,
            "stage": "new",
            "added": datetime.now().isoformat(),
            "last_contact": None,
            "notes": "",
        }
        return self.repo.add_lead(lead)

    def list_leads(self) -> List[Dict[str, Any]]:
        return self.repo.load_leads()

    def get_template(self, name: str) -> Optional[Dict[str, str]]:
        return TEMPLATES.get(name)

    def list_templates(self) -> List[str]:
        return list(TEMPLATES.keys())

    def generate_email(self, email: str, template_name: str) -> Optional[Dict[str, str]]:
        leads = self.repo.load_leads()
        lead = next((item for item in leads if item["email"] == email), None)

        if not lead:
            # Fallback for ad-hoc emails if lead not found (optional, but good for "quick_outreach")
            # For now, let's just return None to enforce lead usage, or maybe create a dummy lead?
            # Let's enforce lead existence for safety.
            return None

        template = self.get_template(template_name)
        if not template:
            return None

        # Safe formatting using default values if keys missing
        safe_lead = {k: v or "" for k, v in lead.items()}
        # Ensure 'company' and 'name' are at least strings
        if "company" not in safe_lead:
            safe_lead["company"] = "your company"
        if "name" not in safe_lead:
            safe_lead["name"] = "there"

        try:
            subject = template["subject"].format(**safe_lead)
            body = template["body"].format(**safe_lead)
        except KeyError as e:
            # If template uses keys not in lead, fallback
            subject = template["subject"]
            body = template["body"] + f"\n[System Note: Missing data for {e}]"

        return {
            "to": f"{lead['name']} <{lead['email']}>",
            "subject": subject,
            "body": body,
            "email_raw": lead["email"],
        }

    def mark_contacted(self, email: str):
        self.repo.update_lead(
            email, {"stage": "contacted", "last_contact": datetime.now().isoformat()}
        )

    def get_stats(self) -> Dict[str, Any]:
        leads = self.repo.load_leads()
        stages = {"new": 0, "contacted": 0, "replied": 0, "meeting": 0, "closed": 0}

        for lead in leads:
            stage = lead.get("stage", "new")
            stages[stage] = stages.get(stage, 0) + 1

        total = len(leads)
        closed = stages.get("closed", 0)
        conversion = (closed / total * 100) if total > 0 else 0

        return {"total": total, "stages": stages, "conversion_rate": conversion}
