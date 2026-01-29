"""
Bid Manager Agent - Smart Bidding & Pacing (Refactored)
"""

import random
from typing import Dict, List

from .models import AuctionInsight, BidStrategy, BidStrategyType, OptimizationStatus


class BidManagerAgent:
    """
    Bid Manager Agent - Quản lý Giá thầu
    """

    def __init__(self):
        self.name = "Bid Manager"
        self.status = "ready"
        self.strategies: Dict[str, BidStrategy] = {}
        self.insights: Dict[str, List[AuctionInsight]] = {}

    def set_strategy(
        self, campaign_id: str, strategy_type: BidStrategyType, target_value: float = 0
    ) -> BidStrategy:
        """Set bid strategy for campaign"""
        strategy_id = f"bid_{random.randint(100, 999)}"
        strategy = BidStrategy(
            id=strategy_id,
            campaign_id=campaign_id,
            strategy_type=strategy_type,
            target_value=target_value,
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
            "spend": current_spend,
            "budget": daily_budget,
            "recommendation": recommendation,
        }

    def get_auction_insights(self, campaign_id: str) -> List[AuctionInsight]:
        """Get simulated auction insights"""
        competitors = ["competitor-a.com", "big-rival.net", "niche-player.io", "amazon.com"]
        insights = [
            AuctionInsight(
                domain="mekong.io (You)",
                impression_share=random.uniform(20, 45),
                overlap_rate=100,
                position_above_rate=0,
                top_of_page_rate=random.uniform(60, 90),
            )
        ]
        for comp in competitors:
            insights.append(
                AuctionInsight(
                    domain=comp,
                    impression_share=random.uniform(10, 30),
                    overlap_rate=random.uniform(30, 60),
                    position_above_rate=random.uniform(10, 40),
                    top_of_page_rate=random.uniform(40, 80),
                )
            )
        self.insights[campaign_id] = sorted(
            insights, key=lambda x: x.impression_share, reverse=True
        )
        return self.insights[campaign_id]

    def optimize(self, campaign_id: str, current_metric: float) -> str:
        """Optimize bid strategy based on performance"""
        if campaign_id not in self.strategies:
            return "No strategy set"
        strategy = self.strategies[campaign_id]
        strategy.days_learning += 1
        if strategy.days_learning >= 7:
            strategy.status = OptimizationStatus.OPTIMIZED
        action = "Hold"
        if strategy.strategy_type == BidStrategyType.TARGET_CPA:
            if current_metric > strategy.target_value * 1.1:
                strategy.current_adjustment = -10
                action = "Decrease bids -10%"
            elif current_metric < strategy.target_value * 0.9:
                strategy.current_adjustment = +5
                action = "Increase bids +5%"
        elif strategy.strategy_type == BidStrategyType.TARGET_ROAS:
            if current_metric < strategy.target_value * 0.9:
                strategy.current_adjustment = -5
                action = "Decrease bids -5%"
            elif current_metric > strategy.target_value * 1.1:
                strategy.current_adjustment = +5
                action = "Increase bids +5%"
        return action
