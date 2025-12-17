"""
📊 Campaign Manager - Marketing Campaigns
===========================================

Manage marketing campaigns end-to-end.
Campaigns that convert!

Roles:
- Campaign planning
- Channel management
- Budget allocation
- Performance tracking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class CampaignStatus(Enum):
    """Campaign status."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class CampaignType(Enum):
    """Campaign types."""
    BRAND_AWARENESS = "brand_awareness"
    LEAD_GEN = "lead_gen"
    PRODUCT_LAUNCH = "product_launch"
    RETARGETING = "retargeting"
    SEASONAL = "seasonal"


class MarketingChannel(Enum):
    """Marketing channels."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    GOOGLE_ADS = "google_ads"
    LINKEDIN = "linkedin"
    EMAIL = "email"
    TIKTOK = "tiktok"
    SEO = "seo"


@dataclass
class Campaign:
    """A marketing campaign."""
    id: str
    name: str
    campaign_type: CampaignType
    channels: List[MarketingChannel]
    budget: float
    spent: float = 0
    status: CampaignStatus = CampaignStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    revenue: float = 0


@dataclass
class ChannelPerformance:
    """Channel performance metrics."""
    channel: MarketingChannel
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0
    cpc: float = 0
    cpa: float = 0
    roas: float = 0


class CampaignManager:
    """
    Campaign Manager.
    
    Run effective campaigns.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.campaigns: Dict[str, Campaign] = {}
        self.channel_metrics: Dict[str, ChannelPerformance] = {}
    
    def create_campaign(
        self,
        name: str,
        campaign_type: CampaignType,
        channels: List[MarketingChannel],
        budget: float,
        days: int = 30
    ) -> Campaign:
        """Create a new campaign."""
        campaign = Campaign(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            campaign_type=campaign_type,
            channels=channels,
            budget=budget,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days)
        )
        self.campaigns[campaign.id] = campaign
        return campaign
    
    def launch_campaign(self, campaign: Campaign):
        """Launch a campaign."""
        campaign.status = CampaignStatus.ACTIVE
        campaign.start_date = datetime.now()
    
    def update_metrics(
        self,
        campaign: Campaign,
        impressions: int = 0,
        clicks: int = 0,
        conversions: int = 0,
        spent: float = 0,
        revenue: float = 0
    ):
        """Update campaign metrics."""
        campaign.impressions += impressions
        campaign.clicks += clicks
        campaign.conversions += conversions
        campaign.spent += spent
        campaign.revenue += revenue
    
    def complete_campaign(self, campaign: Campaign):
        """Complete a campaign."""
        campaign.status = CampaignStatus.COMPLETED
        campaign.end_date = datetime.now()
    
    def get_campaign_roi(self, campaign: Campaign) -> float:
        """Calculate campaign ROI."""
        if campaign.spent <= 0:
            return 0
        return ((campaign.revenue - campaign.spent) / campaign.spent) * 100
    
    def get_stats(self) -> Dict[str, Any]:
        """Get campaign statistics."""
        active = sum(1 for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE)
        total_budget = sum(c.budget for c in self.campaigns.values())
        total_spent = sum(c.spent for c in self.campaigns.values())
        total_revenue = sum(c.revenue for c in self.campaigns.values())
        total_conversions = sum(c.conversions for c in self.campaigns.values())
        
        overall_roi = ((total_revenue - total_spent) / total_spent * 100) if total_spent else 0
        
        return {
            "total": len(self.campaigns),
            "active": active,
            "budget": total_budget,
            "spent": total_spent,
            "revenue": total_revenue,
            "conversions": total_conversions,
            "roi": overall_roi
        }
    
    def format_dashboard(self) -> str:
        """Format campaign manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CAMPAIGN MANAGER                                      ║",
            f"║  {stats['active']} active │ ${stats['spent']:,.0f} spent │ {stats['roi']:.0f}% ROI  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 ACTIVE CAMPAIGNS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"draft": "📝", "scheduled": "⏰", "active": "🟢",
                       "paused": "⏸️", "completed": "✅"}
        type_icons = {"brand_awareness": "📢", "lead_gen": "🎯",
                     "product_launch": "🚀", "retargeting": "🔄", "seasonal": "🎄"}
        
        for campaign in list(self.campaigns.values())[:4]:
            s_icon = status_icons.get(campaign.status.value, "⚪")
            t_icon = type_icons.get(campaign.campaign_type.value, "📊")
            roi = self.get_campaign_roi(campaign)
            
            lines.append(f"║  {s_icon} {t_icon} {campaign.name[:16]:<16} │ ${campaign.spent:>8,.0f} │ {roi:>+5.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 PERFORMANCE OVERVIEW                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Budget:       ${stats['budget']:>12,.0f}              ║",
            f"║    💸 Total Spent:        ${stats['spent']:>12,.0f}              ║",
            f"║    💵 Total Revenue:      ${stats['revenue']:>12,.0f}              ║",
            f"║    🎯 Conversions:        {stats['conversions']:>12,}              ║",
            f"║    📈 Overall ROI:        {stats['roi']:>+12.0f}%              ║",
            "║                                                           ║",
            "║  📊 BY CHANNEL                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        channel_icons = {"facebook": "📘", "instagram": "📸", "google_ads": "🔍",
                        "linkedin": "💼", "email": "📧", "tiktok": "🎵", "seo": "🌐"}
        
        channel_spend = {}
        for campaign in self.campaigns.values():
            for channel in campaign.channels:
                if channel.value not in channel_spend:
                    channel_spend[channel.value] = 0
                channel_spend[channel.value] += campaign.spent / len(campaign.channels)
        
        for channel, spend in sorted(channel_spend.items(), key=lambda x: x[1], reverse=True)[:4]:
            icon = channel_icons.get(channel, "📊")
            lines.append(f"║    {icon} {channel.replace('_', ' ').title():<12} │ ${spend:>10,.0f}              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Campaign]  [📊 Analytics]  [💰 Budget]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Campaigns that convert!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cm = CampaignManager("Saigon Digital Hub")
    
    print("📊 Campaign Manager")
    print("=" * 60)
    print()
    
    c1 = cm.create_campaign("Q1 Lead Gen", CampaignType.LEAD_GEN, 
                            [MarketingChannel.FACEBOOK, MarketingChannel.GOOGLE_ADS], 10000, 30)
    c2 = cm.create_campaign("Product Launch", CampaignType.PRODUCT_LAUNCH,
                            [MarketingChannel.INSTAGRAM, MarketingChannel.TIKTOK], 5000, 14)
    
    cm.launch_campaign(c1)
    cm.launch_campaign(c2)
    
    cm.update_metrics(c1, 50000, 2500, 125, 4500, 15000)
    cm.update_metrics(c2, 30000, 1800, 80, 2000, 8000)
    
    print(cm.format_dashboard())
