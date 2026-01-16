"""
Bid Manager Agent - Smart Bidding & Pacing
Manages bid strategies, budget pacing, and auction insights.
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum
import random


class BidStrategyType(Enum):
    MANUAL_CPC = "manual_cpc"
    TARGET_CPA = "target_cpa"
    TARGET_ROAS = "target_roas"
    MAXIMIZE_CLICKS = "maximize_clicks"
    MAXIMIZE_CONVERSIONS = "maximize_conversions"


class OptimizationStatus(Enum):
    LEARNING = "learning"
    OPTIMIZED = "optimized"
    LIMITED = "limited_budget"


@dataclass
class BidStrategy:
    """Bidding strategy configuration"""
    id: str
    campaign_id: str
    strategy_type: BidStrategyType
    target_value: float = 0 # e.g. target CPA amount or ROAS percent
    status: OptimizationStatus = OptimizationStatus.LEARNING
    current_adjustment: float = 0
    days_learning: int = 0
    
    @property
    def is_learning(self) -> bool:
        return self.days_learning < 7


@dataclass
class AuctionInsight:
    """Competitive landscape insight"""
    domain: str
    impression_share: float
    overlap_rate: float
    position_above_rate: float
    top_of_page_rate: float


class BidManagerAgent:
    """
    Bid Manager Agent - Quản lý Giá thầu
    
    Responsibilities:
    - Smart Bidding (tCPA, tROAS)
    - Budget pacing
    - Auction insights
    - Bid adjustments
    """
    
    def __init__(self):
        self.name = "Bid Manager"
        self.status = "ready"
        self.strategies: Dict[str, BidStrategy] = {}
        self.insights: Dict[str, List[AuctionInsight]] = {}
        
    def set_strategy(
        self,
        campaign_id: str,
        strategy_type: BidStrategyType,
        target_value: float = 0
    ) -> BidStrategy:
        """Set bid strategy for campaign"""
        strategy_id = f"bid_{random.randint(100,999)}"
        
        strategy = BidStrategy(
            id=strategy_id,
            campaign_id=campaign_id,
            strategy_type=strategy_type,
            target_value=target_value
        )
        
        self.strategies[campaign_id] = strategy
        return strategy
    
    def analyze_pacing(self, campaign_id: str, daily_budget: float, current_spend: float) -> Dict:
        """Analyze budget pacing"""
        pacing = (current_spend / daily_budget) * 100
        
        recommendation = "On track"
        if pacing > 90:
            recommendation = "Decrease bids (risk of capping)"
        elif pacing < 50:
            recommendation = "Increase bids (under-spending)"
            
        return {
            "pacing_percent": pacing,
            "spend": c.current_spend,
            "budget": daily_budget,
            "recommendation": recommendation
        }
    
    def get_auction_insights(self, campaign_id: str) -> List[AuctionInsight]:
        """Get simulated auction insights"""
        competitors = [
            "competitor-a.com", "big-rival.net", "niche-player.io", "amazon.com"
        ]
        
        insights = []
        # Our stats
        insights.append(AuctionInsight(
            domain="mekong.io (You)",
            impression_share=random.uniform(20, 45),
            overlap_rate=100,
            position_above_rate=0,
            top_of_page_rate=random.uniform(60, 90)
        ))
        
        # Competitors
        for comp in competitors:
            insights.append(AuctionInsight(
                domain=comp,
                impression_share=random.uniform(10, 30),
                overlap_rate=random.uniform(30, 60),
                position_above_rate=random.uniform(10, 40),
                top_of_page_rate=random.uniform(40, 80)
            ))
            
        self.insights[campaign_id] = sorted(insights, key=lambda x: x.impression_share, reverse=True)
        return self.insights[campaign_id]
    
    def optimize(self, campaign_id: str, current_metric: float) -> str:
        """Optimize bid strategy based on performance"""
        if campaign_id not in self.strategies:
            return "No strategy set"
            
        strategy = self.strategies[campaign_id]
        
        # Simulate learning process
        strategy.days_learning += 1
        if strategy.days_learning >= 7:
            strategy.status = OptimizationStatus.OPTIMIZED
        
        action = "Hold"
        
        if strategy.strategy_type == BidStrategyType.TARGET_CPA:
            if current_metric > strategy.target_value * 1.1: # CPA too high
                strategy.current_adjustment = -10
                action = "Decrease bids -10%"
            elif current_metric < strategy.target_value * 0.9: # CPA good, can scale
                strategy.current_adjustment = +5
                action = "Increase bids +5%"
                
        elif strategy.strategy_type == BidStrategyType.TARGET_ROAS:
            if current_metric < strategy.target_value * 0.9: # ROAS too low
                strategy.current_adjustment = -5
                action = "Decrease bids -5%"
            elif current_metric > strategy.target_value * 1.1: # ROAS high
                strategy.current_adjustment = +5
                action = "Increase bids +5%"
                
        return action


# Demo
if __name__ == "__main__":
    agent = BidManagerAgent()
    
    print("🤖 Bid Manager Agent Demo\n")
    
    cid = "campaign_123"
    
    # Set strategy
    strat = agent.set_strategy(cid, BidStrategyType.TARGET_ROAS, 400) # 400% ROAS
    
    print(f"📋 Strategy: {strat.strategy_type.value}")
    print(f"   Target: {strat.target_value}%")
    print(f"   Status: {strat.status.value}")
    
    # Simulate optimization loop
    print("\n🔄 Optimization Cycle:")
    
    # Week 1: ROAS 350% (Below target)
    action = agent.optimize(cid, 350)
    print(f"   Week 1 (ROAS 350%): {action}")
    
    # Week 2: ROAS 420% (Above target)
    action = agent.optimize(cid, 420)
    print(f"   Week 2 (ROAS 420%): {action}")
    
    print(f"   Status: {strat.status.value} (After learning)")
    
    # Auction insights
    print("\n🕵️ Auction Insights:")
    insights = agent.get_auction_insights(cid)
    for i in insights:
        print(f"   {i.domain}: {i.impression_share:.1f}% Share, {i.top_of_page_rate:.1f}% Top")
