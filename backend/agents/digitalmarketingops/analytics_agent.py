"""
Analytics Agent - Data Aggregation & ROI
Manages aggregated marketing analytics and performance metrics.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class MetricType(Enum):
    SPEND = "spend"
    REVENUE = "revenue"
    ROAS = "roas"
    IMPRESSIONS = "impressions"
    CLICKS = "clicks"
    CONVERSIONS = "conversions"
    LEADS = "leads"


@dataclass
class ChannelMetrics:
    """Performance metrics by channel"""
    channel: str
    spend: float = 0
    revenue: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    leads: int = 0
    
    @property
    def roas(self) -> float:
        return self.revenue / self.spend if self.spend > 0 else 0
    
    @property
    def cpa(self) -> float:
        return self.spend / self.conversions if self.conversions > 0 else 0
    
    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0


class AnalyticsAgent:
    """
    Analytics Agent - Phân tích Hiệu quả Tiếp thị
    
    Responsibilities:
    - Data aggregation (Social, Email, Search, etc.)
    - ROI & ROAS calculation
    - CAC & LTV metrics
    - Performance reporting
    """
    
    def __init__(self):
        self.name = "Analytics"
        self.status = "ready"
        self.metrics: Dict[str, ChannelMetrics] = {}
        
    def aggregate_data(self) -> Dict[str, ChannelMetrics]:
        """Aggregate data from all channels (simulated)"""
        channels = ["Social", "Search", "Email", "Direct", "Referral"]
        
        total_spend = 0
        total_revenue = 0
        total_conversions = 0
        
        for channel in channels:
            # Simulate metrics based on channel characteristics
            spend = random.randint(1000, 10000)
            if channel in ["Direct", "Referral", "Email"]:
                spend = spend * 0.1  # Low cost channels
            
            roas = random.uniform(2.0, 8.0)
            if channel == "Email": roas *= 2.0  # Email usually has high ROAS
            
            revenue = spend * roas
            conversions = int(revenue / random.randint(50, 200)) # AOV varies
            
            metrics = ChannelMetrics(
                channel=channel,
                spend=spend,
                revenue=revenue,
                impressions=random.randint(10000, 500000),
                clicks=random.randint(500, 20000),
                conversions=conversions,
                leads=int(conversions * random.uniform(2.0, 5.0))
            )
            
            self.metrics[channel] = metrics
            
            total_spend += spend
            total_revenue += revenue
            total_conversions += conversions
            
        # Calculate aggregate metrics
        cac = total_spend / total_conversions if total_conversions > 0 else 0
        ltv = random.uniform(3.0, 5.0) * (total_revenue / total_conversions) if total_conversions > 0 else 0
        
        return {
            "metrics": self.metrics,
            "cac": cac,
            "ltv": ltv,
            "total_spend": total_spend,
            "total_revenue": total_revenue,
            "total_roas": total_revenue / total_spend if total_spend > 0 else 0
        }
    
    def get_channel_performance(self, channel: str) -> Optional[ChannelMetrics]:
        """Get metrics for specific channel"""
        return self.metrics.get(channel)
    
    def get_top_channels(self, metric: MetricType = MetricType.ROAS) -> List[ChannelMetrics]:
        """Get top performing channels"""
        items = list(self.metrics.values())
        
        if metric == MetricType.ROAS:
            return sorted(items, key=lambda x: x.roas, reverse=True)
        elif metric == MetricType.REVENUE:
            return sorted(items, key=lambda x: x.revenue, reverse=True)
        elif metric == MetricType.CONVERSIONS:
            return sorted(items, key=lambda x: x.conversions, reverse=True)
            
        return items


# Demo
if __name__ == "__main__":
    agent = AnalyticsAgent()
    
    print("📊 Analytics Agent Demo\n")
    
    # Aggregate data
    data = agent.aggregate_data()
    
    print(f"📈 Aggregate Performance:")
    print(f"   Total Spend: ${data['total_spend']:,.0f}")
    print(f"   Total Revenue: ${data['total_revenue']:,.0f}")
    print(f"   Total ROAS: {data['total_roas']:.1f}x")
    print(f"   CAC: ${data['cac']:.0f}")
    print(f"   LTV: ${data['ltv']:.0f} (LTV:CAC = {data['ltv']/data['cac']:.1f}x)")
    
    print(f"\n📺 Top Channels by ROAS:")
    top_channels = agent.get_top_channels(MetricType.ROAS)
    for c in top_channels[:3]:
        print(f"   {c.channel}: {c.roas:.1f}x (${c.revenue:,.0f} rev)")
