"""
Outreach Agent engine logic.
"""

import random
from datetime import datetime
from typing import Dict, List

from .models import OutreachCampaign, OutreachStatus, SequenceStep


class RecruiterOutreachEngine:
    def __init__(self):
        self.campaigns: Dict[str, OutreachCampaign] = {}

    def create_campaign(self, name: str, email: str, job: str) -> OutreachCampaign:
        cid = f"outreach_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        campaign = OutreachCampaign(
            id=cid, candidate_name=name, candidate_email=email, job_title=job
        )
        self.campaigns[cid] = campaign
        return campaign

    def send(self, campaign_id: str) -> OutreachCampaign:
        if campaign_id not in self.campaigns:
            raise ValueError("Campaign not found")
        c = self.campaigns[campaign_id]
        c.status = OutreachStatus.SENT
        c.sent_at = datetime.now()
        return c
