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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """A marketing campaign entity."""
    id: str
    name: str
    campaign_type: CampaignType
    channels: List[MarketingChannel]
    budget: float
    spent: float = 0.0
    status: CampaignStatus = CampaignStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    revenue: float = 0.0

    def __post_init__(self):
        if self.budget < 0:
            raise ValueError("Campaign budget cannot be negative")

    @property
    def roi(self) -> float:
        """Calculate Return on Investment percentage."""
        if self.spent <= 0:
            return 0.0
        return ((self.revenue - self.spent) / self.spent) * 100.0

    @property
    def cpa(self) -> float:
        """Cost Per Acquisition."""
        if self.conversions <= 0:
            return 0.0
        return self.spent / self.conversions


class CampaignManager:
    """
    Campaign Manager System.
    
    Executes and monitors multi-channel marketing campaigns.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.campaigns: Dict[str, Campaign] = {}
        logger.info(f"Campaign Manager initialized for {agency_name}")
    
    def create_campaign(
        self,
        name: str,
        campaign_type: CampaignType,
        channels: List[MarketingChannel],
        budget: float,
        days: int = 30
    ) -> Campaign:
        """Create a new campaign proposal."""
        if not name:
            raise ValueError("Campaign name required")
        if days <= 0:
            raise ValueError("Campaign duration must be at least 1 day")

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
        logger.info(f"Campaign created: {name} (${budget:,.0f})")
        return campaign
    
    def launch_campaign(self, campaign_id: str) -> bool:
        """Activate a draft campaign."""
        if campaign_id not in self.campaigns:
            return False
        
        campaign = self.campaigns[campaign_id]
        campaign.status = CampaignStatus.ACTIVE
        campaign.start_date = datetime.now()
        logger.info(f"Campaign launched: {campaign.name}")
        return True
    
    def update_metrics(
        self,
        campaign_id: str,
        impressions: int = 0,
        clicks: int = 0,
        conversions: int = 0,
        spent: float = 0.0,
        revenue: float = 0.0
    ) -> bool:
        """Log performance data for a campaign."""
        if campaign_id not in self.campaigns:
            return False
            
        c = self.campaigns[campaign_id]
        c.impressions += max(0, impressions)
        c.clicks += max(0, clicks)
        c.conversions += max(0, conversions)
        c.spent += max(0.0, spent)
        c.revenue += max(0.0, revenue)
        
        logger.debug(f"Metrics updated for {c.name}")
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate data across all campaigns."""
        active = sum(1 for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE)
        total_budget = sum(c.budget for c in self.campaigns.values())
        total_spent = sum(c.spent for c in self.campaigns.values())
        total_revenue = sum(c.revenue for c in self.campaigns.values())
        total_conversions = sum(c.conversions for c in self.campaigns.values())
        
        overall_roi = ((total_revenue - total_spent) / total_spent * 100) if total_spent else 0.0
        
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
        """Render Campaign Dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CAMPAIGN MANAGER{' ' * 42}║",
            f"║  {stats['active']} active │ ${stats['spent']:,.0f} spent │ {stats['roi']:>+4.0f}% Overall ROI{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 ACTIVE CAMPAIGNS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        status_icons = {
            CampaignStatus.DRAFT: "📝", 
            CampaignStatus.SCHEDULED: "⏰", 
            CampaignStatus.ACTIVE: "🟢",
            CampaignStatus.PAUSED: "⏸️", 
            CampaignStatus.COMPLETED: "✅"
        }
        type_icons = {
            CampaignType.BRAND_AWARENESS: "📢", 
            CampaignType.LEAD_GEN: "🎯",
            CampaignType.PRODUCT_LAUNCH: "🚀", 
            CampaignType.RETARGETING: "🔄", 
            CampaignType.SEASONAL: "🎄"
        }
        
        # Display top campaigns
        for c in list(self.campaigns.values())[:4]:
            s_icon = status_icons.get(c.status, "⚪")
            t_icon = type_icons.get(c.campaign_type, "📊")
            name_display = (c.name[:16] + '..') if len(c.name) > 18 else c.name
            
            lines.append(f"║  {s_icon} {t_icon} {name_display:<18} │ ${c.spent:>8,.0f} │ {c.roi:>+5.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 PERFORMANCE OVERVIEW                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    💰 Total Budget:       ${stats['budget']:>12,.0f}              ║",
            f"║    💸 Total Spent:        ${stats['spent']:>12,.0f}              ║",
            f"║    💵 Total Revenue:      ${stats['revenue']:>12,.0f}              ║",
            f"║    🎯 Conversions:        {stats['conversions']:>12,}              ║",
            f"║    📈 Overall ROI:        {stats['roi']:>+12.0f}%              ║",
            "║                                                           ║",
            "║  📊 CHANNEL ALLOCATION                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        channel_icons = {
            MarketingChannel.FACEBOOK: "📘", 
            MarketingChannel.INSTAGRAM: "📸", 
            MarketingChannel.GOOGLE_ADS: "🔍",
            MarketingChannel.LINKEDIN: "💼", 
            MarketingChannel.EMAIL: "📧", 
            MarketingChannel.TIKTOK: "🎵", 
            MarketingChannel.SEO: "🌐"
        }
        
        channel_spend: Dict[MarketingChannel, float] = {}
        for c in self.campaigns.values():
            if not c.channels: continue
            per_channel = c.spent / len(c.channels)
            for ch in c.channels:
                channel_spend[ch] = channel_spend.get(ch, 0.0) + per_channel
        
        # Display top channels
        sorted_channels = sorted(channel_spend.items(), key=lambda x: x[1], reverse=True)[:4]
        for channel, spend in sorted_channels:
            icon = channel_icons.get(channel, "📊")
            name = channel.value.replace('_', ' ').title()
            lines.append(f"║    {icon} {name:<12} │ ${spend:>10,.0f}              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Campaign]  [📊 Analytics]  [💰 Budget]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Results!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Campaign Manager...")
    print("=" * 60)
    
    try:
        cm = CampaignManager("Saigon Digital Hub")
        
        c1 = cm.create_campaign("Q1 Lead Gen", CampaignType.LEAD_GEN, 
                                [MarketingChannel.FACEBOOK, MarketingChannel.GOOGLE_ADS], 10000.0, 30)
        c2 = cm.create_campaign("Product Launch", CampaignType.PRODUCT_LAUNCH,
                                [MarketingChannel.INSTAGRAM, MarketingChannel.TIKTOK], 5000.0, 14)
        
        cm.launch_campaign(c1.id)
        cm.launch_campaign(c2.id)
        
        cm.update_metrics(c1.id, 50000, 2500, 125, 4500.0, 15000.0)
        cm.update_metrics(c2.id, 30000, 1800, 80, 2000.0, 8000.0)
        
        print("\n" + cm.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
