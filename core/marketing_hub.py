"""
📢 Marketing Hub - Growth Engine
==================================

Central hub connecting all Marketing roles.

Integrates:
- Content Generator (content_generator.py)
- Email Automation (email_automation.py)
- Campaign Manager (campaign_manager.py)
- Social Media Manager (social_media_manager.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.email_automation import EmailAutomation
from core.campaign_manager import CampaignManager, CampaignType, MarketingChannel
from core.social_media_manager import SocialMediaManager, Platform, PostType


@dataclass
class MarketingMetrics:
    """Department-wide metrics."""
    campaigns_active: int
    campaign_spend: float
    campaign_roi: float
    social_followers: int
    social_engagement: int
    email_subscribers: int
    email_open_rate: float
    content_pieces: int


class MarketingHub:
    """
    Marketing Hub.
    
    Growth engine for the agency.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.email = EmailAutomation(agency_name)
        self.campaigns = CampaignManager(agency_name)
        self.social = SocialMediaManager(agency_name)
    
    def get_department_metrics(self) -> MarketingMetrics:
        """Get department-wide metrics."""
        campaign_stats = self.campaigns.get_stats()
        social_stats = self.social.get_stats()
        email_stats = self.email.get_stats()
        
        return MarketingMetrics(
            campaigns_active=campaign_stats.get("active", 0),
            campaign_spend=campaign_stats.get("spent", 0),
            campaign_roi=campaign_stats.get("roi", 0),
            social_followers=social_stats.get("followers", 0),
            social_engagement=social_stats.get("engagement", 0),
            email_subscribers=email_stats.get("total_subscribers", 0),
            email_open_rate=email_stats.get("avg_open_rate", 0),
            content_pieces=0  # Will be populated when content is tracked
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📢 MARKETING HUB                                         ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Active Campaigns:   {metrics.campaigns_active:>5}                          ║",
            f"║    💸 Campaign Spend:     ${metrics.campaign_spend:>12,.0f}              ║",
            f"║    📈 Campaign ROI:       {metrics.campaign_roi:>+5.0f}%                         ║",
            f"║    👥 Social Followers:   {metrics.social_followers:>8,}                       ║",
            f"║    💬 Social Engagement:  {metrics.social_engagement:>8,}                       ║",
            f"║    📧 Email Subscribers:  {metrics.email_subscribers:>8,}                       ║",
            f"║    📬 Email Open Rate:    {metrics.email_open_rate:>5.1f}%                         ║",
            "║                                                           ║",
            "║  🔗 MARKETING ROLES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📝 Content Generator → Ideas, calendar, content       ║",
            "║    📧 Email Automation  → Sequences, campaigns, lists    ║",
            "║    📊 Campaign Manager  → Ads, budget, ROI               ║",
            "║    📱 Social Media      → Posts, engagement, growth      ║",
            "║                                                           ║",
            "║  📋 MARKETING TEAM                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Campaigns        │ {metrics.campaigns_active} active, {metrics.campaign_roi:+.0f}% ROI     ║",
            f"║    📱 Social           │ {metrics.social_followers:,} followers         ║",
            f"║    📧 Email            │ {metrics.email_subscribers:,} subscribers        ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📊 Campaigns]  [📱 Social]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Grow the business!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = MarketingHub("Saigon Digital Hub")
    
    print("📢 Marketing Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.campaigns.create_campaign("Q1 Lead Gen", CampaignType.LEAD_GEN, 
                                  [MarketingChannel.FACEBOOK], 5000)
    hub.social.add_account(Platform.INSTAGRAM, "saigon_digital", 10000)
    
    print(hub.format_hub_dashboard())
