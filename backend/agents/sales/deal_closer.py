"""
Deal Closer Agent - Pipeline & Opportunity Management
Tracks deals through stages and automates follow-ups.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


class DealStage(Enum):
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


@dataclass
class Deal:
    """Sales deal/opportunity"""

    id: str
    lead_id: str
    title: str
    value: float  # USD
    stage: DealStage = DealStage.DISCOVERY
    probability: int = 10  # 0-100%
    expected_close: Optional[datetime] = None
    notes: List[str] = field(default_factory=list)
    follow_ups: List[datetime] = field(default_factory=list)
    created_at: datetime = None
    closed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.expected_close is None:
            self.expected_close = datetime.now() + timedelta(days=30)


class DealCloserAgent:
    """
    Deal Closer Agent - Quản lý Pipeline

    Responsibilities:
    - Track deals through stages
    - Calculate probability
    - Schedule follow-ups
    - Win/loss analysis
    """

    # Stage probabilities
    STAGE_PROBABILITY = {
        DealStage.DISCOVERY: 10,
        DealStage.PROPOSAL: 30,
        DealStage.NEGOTIATION: 60,
        DealStage.CLOSED_WON: 100,
        DealStage.CLOSED_LOST: 0,
    }

    def __init__(self):
        self.name = "Deal Closer"
        self.status = "ready"
        self.deals_db: Dict[str, Deal] = {}

    def create_deal(
        self, lead_id: str, title: str, value: float, expected_close: Optional[datetime] = None
    ) -> Deal:
        """Create a deal from qualified lead"""
        deal_id = f"deal_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        deal = Deal(
            id=deal_id, lead_id=lead_id, title=title, value=value, expected_close=expected_close
        )

        self.deals_db[deal_id] = deal
        return deal

    def update_stage(self, deal_id: str, new_stage: DealStage) -> Deal:
        """Update deal stage"""
        if deal_id not in self.deals_db:
            raise ValueError(f"Deal not found: {deal_id}")

        deal = self.deals_db[deal_id]
        deal.stage = new_stage
        deal.probability = self.STAGE_PROBABILITY[new_stage]
        deal.notes.append(f"Stage updated to {new_stage.value}")

        if new_stage in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]:
            deal.closed_at = datetime.now()

        return deal

    def schedule_followup(self, deal_id: str, days: int = 3) -> Deal:
        """Schedule a follow-up"""
        if deal_id not in self.deals_db:
            raise ValueError(f"Deal not found: {deal_id}")

        deal = self.deals_db[deal_id]
        followup_date = datetime.now() + timedelta(days=days)
        deal.follow_ups.append(followup_date)
        deal.notes.append(f"Follow-up scheduled for {followup_date.date()}")

        return deal

    def get_pipeline(self) -> Dict[str, List[Deal]]:
        """Get deals grouped by stage"""
        pipeline = {stage.value: [] for stage in DealStage}

        for deal in self.deals_db.values():
            pipeline[deal.stage.value].append(deal)

        return pipeline

    def get_forecast(self) -> Dict:
        """Get revenue forecast"""
        open_deals = [
            d
            for d in self.deals_db.values()
            if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        ]

        weighted_value = sum(d.value * d.probability / 100 for d in open_deals)
        total_value = sum(d.value for d in open_deals)

        won_deals = [d for d in self.deals_db.values() if d.stage == DealStage.CLOSED_WON]
        won_value = sum(d.value for d in won_deals)

        return {
            "pipeline_value": total_value,
            "weighted_forecast": weighted_value,
            "closed_won": won_value,
            "open_deals": len(open_deals),
            "win_rate": len(won_deals) / len(self.deals_db) * 100 if self.deals_db else 0,
        }


# Demo
if __name__ == "__main__":
    agent = DealCloserAgent()

    print("🤝 Deal Closer Agent Demo\n")

    # Create deals
    deal1 = agent.create_deal(lead_id="lead_001", title="TechVN Agency Setup", value=2000)

    deal2 = agent.create_deal(lead_id="lead_002", title="Marketing Hub", value=5000)

    # Update stages
    agent.update_stage(deal1.id, DealStage.PROPOSAL)
    agent.update_stage(deal2.id, DealStage.NEGOTIATION)
    agent.schedule_followup(deal2.id, days=2)

    print(f"📋 Deal 1: {deal1.title}")
    print(f"   Value: ${deal1.value} | Stage: {deal1.stage.value} | Prob: {deal1.probability}%")

    print(f"\n📋 Deal 2: {deal2.title}")
    print(f"   Value: ${deal2.value} | Stage: {deal2.stage.value} | Prob: {deal2.probability}%")

    # Pipeline
    print("\n📊 Pipeline:")
    pipeline = agent.get_pipeline()
    for stage, deals in pipeline.items():
        if deals:
            print(f"   {stage}: {len(deals)} deals")

    # Forecast
    print("\n💰 Forecast:")
    forecast = agent.get_forecast()
    print(f"   Pipeline: ${forecast['pipeline_value']}")
    print(f"   Weighted: ${forecast['weighted_forecast']:.0f}")
