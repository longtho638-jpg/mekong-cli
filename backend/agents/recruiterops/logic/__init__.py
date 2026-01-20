"""
Outreach Agent Facade.
"""
from typing import Dict

from .engine import RecruiterOutreachEngine
from .models import OutreachCampaign, OutreachStatus, SequenceStep


class OutreachAgent(RecruiterOutreachEngine):
    """Refactored Recruiter Outreach Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Outreach"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_campaigns": len(self.campaigns), "sent": len([c for c in self.campaigns.values() if c.status != OutreachStatus.DRAFT])}

__all__ = ['OutreachAgent', 'OutreachStatus', 'SequenceStep', 'OutreachCampaign']
