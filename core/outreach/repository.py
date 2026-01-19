"""
Outreach Repository
===================
Persistence layer for leads and outreach tracking.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from core.config import get_settings


class OutreachRepository:
    def __init__(self):
        settings = get_settings()
        self.data_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.leads_file = self.data_dir / "leads.json"
        self._ensure_dir()

    def _ensure_dir(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def load_leads(self) -> List[Dict[str, Any]]:
        if self.leads_file.exists():
            try:
                with open(self.leads_file, "r") as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return []
        return []

    def save_leads(self, leads: List[Dict[str, Any]]):
        with open(self.leads_file, "w") as f:
            json.dump(leads, f, indent=2)

    def add_lead(self, lead: Dict[str, Any]):
        leads = self.load_leads()
        # Check duplicate by email
        if any(existing["email"] == lead["email"] for existing in leads):
            return False

        leads.append(lead)
        self.save_leads(leads)
        return True

    def update_lead(self, email: str, updates: Dict[str, Any]):
        leads = self.load_leads()
        updated = False
        for lead in leads:
            if lead["email"] == email:
                lead.update(updates)
                updated = True
                break

        if updated:
            self.save_leads(leads)
        return updated
