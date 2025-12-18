"""
Opportunity Pipeline Agent - Strategic Deals
Manages strategic opportunities and deal pipeline.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class OpportunityStage(Enum):
    IDENTIFIED = "identified"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class OpportunityType(Enum):
    NEW_BUSINESS = "new_business"
    EXPANSION = "expansion"
    PARTNERSHIP = "partnership"
    ENTERPRISE = "enterprise"


@dataclass
class Opportunity:
    """Strategic opportunity"""
    id: str
    name: str
    company: str
    opportunity_type: OpportunityType
    stage: OpportunityStage = OpportunityStage.IDENTIFIED
    value: float = 0.0
    probability: float = 10.0  # Percentage
    owner: str = ""
    close_date: Optional[datetime] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def weighted_value(self) -> float:
        return self.value * (self.probability / 100)


# Stage probabilities
STAGE_PROBABILITIES = {
    OpportunityStage.IDENTIFIED: 10,
    OpportunityStage.QUALIFIED: 25,
    OpportunityStage.PROPOSAL: 50,
    OpportunityStage.NEGOTIATION: 75,
    OpportunityStage.CLOSED_WON: 100,
    OpportunityStage.CLOSED_LOST: 0
}


class OpportunityPipelineAgent:
    """
    Opportunity Pipeline Agent - Quản lý Cơ hội
    
    Responsibilities:
    - Track strategic opportunities
    - Manage deal stages
    - Win probability analysis
    - Revenue projection
    """
    
    def __init__(self):
        self.name = "Opportunity Pipeline"
        self.status = "ready"
        self.opportunities: Dict[str, Opportunity] = {}
        
    def create_opportunity(
        self,
        name: str,
        company: str,
        opportunity_type: OpportunityType,
        value: float,
        owner: str = "",
        close_days: int = 90
    ) -> Opportunity:
        """Create new opportunity"""
        opp_id = f"opp_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        opportunity = Opportunity(
            id=opp_id,
            name=name,
            company=company,
            opportunity_type=opportunity_type,
            value=value,
            owner=owner,
            close_date=datetime.now() + timedelta(days=close_days),
            probability=STAGE_PROBABILITIES[OpportunityStage.IDENTIFIED]
        )
        
        self.opportunities[opp_id] = opportunity
        return opportunity
    
    def advance_stage(self, opp_id: str, stage: OpportunityStage) -> Opportunity:
        """Advance opportunity to next stage"""
        if opp_id not in self.opportunities:
            raise ValueError(f"Opportunity not found: {opp_id}")
            
        opp = self.opportunities[opp_id]
        opp.stage = stage
        opp.probability = STAGE_PROBABILITIES.get(stage, opp.probability)
        
        return opp
    
    def get_by_stage(self, stage: OpportunityStage) -> List[Opportunity]:
        """Get opportunities by stage"""
        return [o for o in self.opportunities.values() if o.stage == stage]
    
    def get_pipeline(self) -> Dict[str, List[Opportunity]]:
        """Get full pipeline grouped by stage"""
        pipeline = {}
        for stage in OpportunityStage:
            if stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]:
                pipeline[stage.value] = self.get_by_stage(stage)
        return pipeline
    
    def get_forecast(self) -> Dict:
        """Get revenue forecast"""
        active = [o for o in self.opportunities.values() 
                  if o.stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]]
        won = self.get_by_stage(OpportunityStage.CLOSED_WON)
        
        return {
            "pipeline_value": sum(o.value for o in active),
            "weighted_value": sum(o.weighted_value for o in active),
            "closed_won": sum(o.value for o in won),
            "opportunities_count": len(active)
        }
    
    def get_stats(self) -> Dict:
        """Get pipeline statistics"""
        opps = list(self.opportunities.values())
        won = self.get_by_stage(OpportunityStage.CLOSED_WON)
        lost = self.get_by_stage(OpportunityStage.CLOSED_LOST)
        
        win_rate = len(won) / (len(won) + len(lost)) * 100 if (won or lost) else 0
        
        return {
            "total_opportunities": len(opps),
            "won": len(won),
            "lost": len(lost),
            "win_rate": f"{win_rate:.0f}%",
            **self.get_forecast()
        }


# Demo
if __name__ == "__main__":
    agent = OpportunityPipelineAgent()
    
    print("💼 Opportunity Pipeline Agent Demo\n")
    
    # Create opportunities
    o1 = agent.create_opportunity("Enterprise Deal", "BigCorp", OpportunityType.ENTERPRISE, 50000, "BDM_001")
    o2 = agent.create_opportunity("Partner Integration", "TechCo", OpportunityType.PARTNERSHIP, 25000, "BDM_001")
    o3 = agent.create_opportunity("Expansion Deal", "Existing Client", OpportunityType.EXPANSION, 15000, "BDM_002")
    
    print(f"📋 Opportunity: {o1.name}")
    print(f"   Value: ${o1.value:,.0f}")
    print(f"   Probability: {o1.probability}%")
    
    # Advance stages
    agent.advance_stage(o1.id, OpportunityStage.QUALIFIED)
    agent.advance_stage(o1.id, OpportunityStage.PROPOSAL)
    agent.advance_stage(o2.id, OpportunityStage.NEGOTIATION)
    agent.advance_stage(o3.id, OpportunityStage.CLOSED_WON)
    
    print(f"\n📊 Pipeline:")
    for stage, opps in agent.get_pipeline().items():
        if opps:
            print(f"   {stage}: {len(opps)} deals")
    
    # Forecast
    print("\n💰 Forecast:")
    forecast = agent.get_forecast()
    print(f"   Pipeline: ${forecast['pipeline_value']:,.0f}")
    print(f"   Weighted: ${forecast['weighted_value']:,.0f}")
    print(f"   Won: ${forecast['closed_won']:,.0f}")
