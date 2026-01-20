"""
Nonprofit Marketing Engine logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import (
    CampaignStatus,
    CampaignType,
    DonationCampaign,
    NonprofitCategory,
    NonprofitClient,
)

logger = logging.getLogger(__name__)

class NonprofitEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, NonprofitClient] = {}
        self.campaigns: Dict[str, DonationCampaign] = {}

    def add_client(
        self, name: str, category: NonprofitCategory, mission: str, monthly_retainer: float = 0.0
    ) -> NonprofitClient:
        """Register a new non-profit client."""
        if not name:
            raise ValueError("Client name required")

        client = NonprofitClient(
            id=f"NPO-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            category=category,
            mission=mission,
            monthly_retainer=monthly_retainer,
        )
        self.clients[client.id] = client
        logger.info(f"Nonprofit client added: {name} ({category.value})")
        return client

    def create_campaign(
        self, client_id: str, name: str, campaign_type: CampaignType, goal: float
    ) -> Optional[DonationCampaign]:
        """Launch a new marketing campaign for a client."""
        if client_id not in self.clients:
            logger.error(f"Client {client_id} not found")
            return None

        campaign = DonationCampaign(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            name=name,
            campaign_type=campaign_type,
            goal=goal,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=90),
        )
        self.campaigns[campaign.id] = campaign
        self.clients[client_id].campaigns.append(campaign.id)

        logger.info(f"Campaign created: {name} (Goal: ${goal:,.0f})")
        return campaign

    def update_campaign_progress(self, campaign_id: str, raised: float, donors: int) -> bool:
        """Update fundraising metrics for a campaign."""
        if campaign_id not in self.campaigns:
            return False

        camp = self.campaigns[campaign_id]
        camp.raised = raised
        camp.donors = donors
        camp.status = CampaignStatus.ACTIVE

        client = self.clients.get(camp.client_id)
        if client:
            client.total_raised = sum(
                c.raised for c in self.campaigns.values() if c.client_id == client.id
            )

        logger.info(f"Campaign {camp.name} updated: ${raised:,.0f} raised")
        return True
