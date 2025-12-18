"""
Deal Manager Agent - Deal Lifecycle & Closing
Manages the entire deal lifecycle from creation to close.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class DealStage(Enum):
    DISCOVERY = "discovery"
    DEMO = "demo"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    VERBAL_COMMIT = "verbal_commit"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class DealPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Deal:
    """Sales deal"""
    id: str
    name: str
    company: str
    value: float
    stage: DealStage = DealStage.DISCOVERY
    priority: DealPriority = DealPriority.MEDIUM
    probability: float = 10.0
    close_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def weighted_value(self) -> float:
        return self.value * (self.probability / 100)


# Stage probabilities
STAGE_PROBABILITIES = {
    DealStage.DISCOVERY: 10,
    DealStage.DEMO: 25,
    DealStage.PROPOSAL: 50,
    DealStage.NEGOTIATION: 75,
    DealStage.VERBAL_COMMIT: 90,
    DealStage.CLOSED_WON: 100,
    DealStage.CLOSED_LOST: 0
}


class DealManagerAgent:
    """
    Deal Manager Agent - Quản lý Deals
    
    Responsibilities:
    - Create and track deals
    - Manage deal stages
    - Generate proposals
    - Track close dates
    """
    
    def __init__(self):
        self.name = "Deal Manager"
        self.status = "ready"
        self.deals: Dict[str, Deal] = {}
        
    def create_deal(
        self,
        name: str,
        company: str,
        value: float,
        close_days: int = 30,
        priority: DealPriority = DealPriority.MEDIUM
    ) -> Deal:
        """Create new deal"""
        deal_id = f"deal_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        deal = Deal(
            id=deal_id,
            name=name,
            company=company,
            value=value,
            priority=priority,
            close_date=datetime.now() + timedelta(days=close_days),
            probability=STAGE_PROBABILITIES[DealStage.DISCOVERY]
        )
        
        self.deals[deal_id] = deal
        return deal
    
    def advance_stage(self, deal_id: str, stage: DealStage) -> Deal:
        """Move deal to next stage"""
        if deal_id not in self.deals:
            raise ValueError(f"Deal not found: {deal_id}")
            
        deal = self.deals[deal_id]
        deal.stage = stage
        deal.probability = STAGE_PROBABILITIES.get(stage, deal.probability)
        
        return deal
    
    def close_won(self, deal_id: str) -> Deal:
        """Mark deal as won"""
        return self.advance_stage(deal_id, DealStage.CLOSED_WON)
    
    def close_lost(self, deal_id: str, reason: str = "") -> Deal:
        """Mark deal as lost"""
        deal = self.advance_stage(deal_id, DealStage.CLOSED_LOST)
        deal.notes = reason
        return deal
    
    def get_pipeline(self) -> Dict[str, List[Deal]]:
        """Get deals grouped by stage"""
        pipeline = {}
        for stage in DealStage:
            if stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]:
                pipeline[stage.value] = [d for d in self.deals.values() if d.stage == stage]
        return pipeline
    
    def get_forecast(self) -> Dict:
        """Get revenue forecast"""
        active = [d for d in self.deals.values() 
                  if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
        won = [d for d in self.deals.values() if d.stage == DealStage.CLOSED_WON]
        
        return {
            "pipeline_value": sum(d.value for d in active),
            "weighted_value": sum(d.weighted_value for d in active),
            "closed_won": sum(d.value for d in won),
            "deal_count": len(active)
        }
    
    def get_stats(self) -> Dict:
        """Get deal statistics"""
        deals = list(self.deals.values())
        won = [d for d in deals if d.stage == DealStage.CLOSED_WON]
        lost = [d for d in deals if d.stage == DealStage.CLOSED_LOST]
        
        win_rate = len(won) / (len(won) + len(lost)) * 100 if (won or lost) else 0
        
        return {
            "total_deals": len(deals),
            "won": len(won),
            "lost": len(lost),
            "win_rate": f"{win_rate:.0f}%",
            **self.get_forecast()
        }


# Demo
if __name__ == "__main__":
    agent = DealManagerAgent()
    
    print("💼 Deal Manager Agent Demo\n")
    
    # Create deals
    d1 = agent.create_deal("Enterprise License", "BigCorp", 50000, priority=DealPriority.HIGH)
    d2 = agent.create_deal("Startup Package", "StartupX", 15000, priority=DealPriority.MEDIUM)
    d3 = agent.create_deal("Team Plan", "AgencyPro", 8000, priority=DealPriority.LOW)
    
    print(f"📋 Deal: {d1.name}")
    print(f"   Value: ${d1.value:,.0f}")
    print(f"   Stage: {d1.stage.value}")
    
    # Advance stages
    agent.advance_stage(d1.id, DealStage.DEMO)
    agent.advance_stage(d1.id, DealStage.PROPOSAL)
    agent.advance_stage(d2.id, DealStage.NEGOTIATION)
    agent.close_won(d3.id)
    
    print(f"\n📊 Pipeline:")
    for stage, deals in agent.get_pipeline().items():
        if deals:
            print(f"   {stage}: {len(deals)} deals")
    
    # Stats
    print("\n📈 Stats:")
    stats = agent.get_stats()
    print(f"   Pipeline: ${stats['pipeline_value']:,.0f}")
    print(f"   Weighted: ${stats['weighted_value']:,.0f}")
    print(f"   Won: ${stats['closed_won']:,.0f}")
