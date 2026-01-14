"""
📢 Marketing Hub - Growth Engine
==================================

Central hub connecting all Marketing roles.

Integrates:
- Email Automation
- Campaign Manager
- Social Media Manager
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.email_automation import EmailAutomation
    from core.campaign_manager import CampaignManager, CampaignType, MarketingChannel
    from core.social_media_manager import SocialMediaManager, Platform, PostType
except ImportError:
    from email_automation import EmailAutomation
    from campaign_manager import CampaignManager, CampaignType, MarketingChannel
    from social_media_manager import SocialMediaManager, Platform, PostType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class MarketingMetrics:
    """Department-wide marketing metrics container."""
    campaigns_active: int = 0
    campaign_spend: float = 0.0
    campaign_roi: float = 0.0
    social_followers: int = 0
    social_engagement: int = 0
    email_subscribers: int = 0
    email_open_rate: float = 0.0
    content_pieces: int = 0


class MarketingHub:
    """
    Marketing Hub System.
    
    Orchestrates email, social, and ad campaigns for growth and lead generation.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Marketing Hub for {agency_name}")
        try:
            self.email = EmailAutomation(agency_name)
            self.campaigns = CampaignManager(agency_name)
            self.social = SocialMediaManager(agency_name)
        except Exception as e:
            logger.error(f"Marketing Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> MarketingMetrics:
        """Aggregate data from all marketing specialized sub-modules."""
        metrics = MarketingMetrics()
        
        try:
            # 1. Campaign Metrics
            c_stats = self.campaigns.get_stats()
            metrics.campaigns_active = c_stats.get("active_count", 0)
            metrics.campaign_spend = float(c_stats.get("total_budget", 0.0))
            metrics.campaign_roi = float(c_stats.get("avg_roi", 0.0))
            
            # 2. Social Metrics
            s_stats = self.social.get_stats()
            metrics.social_followers = s_stats.get("total_followers", 0)
            metrics.social_engagement = s_stats.get("engagement_rate", 0)
            
            # 3. Email Metrics
            e_stats = self.email.get_stats()
            # Email module structure varies, using defaults if key missing
            metrics.email_subscribers = e_stats.get("total_subscribers", 0)
            metrics.email_open_rate = float(e_stats.get("open_rate", 0.0))
            
        except Exception as e:
            logger.warning(f"Error aggregating Marketing metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Marketing Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📢 MARKETING HUB{' ' * 35}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 GROWTH METRICS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📊 Active Campaigns:   {m.campaigns_active:>5}                          ║",
            f"║    💸 Campaign Spend:     ${m.campaign_spend:>12,.0f}              ║",
            f"║    📈 Campaign ROI:       {m.campaign_roi:>+5.0f}%                         ║",
            f"║    👥 Social Followers:   {m.social_followers:>8,}                       ║",
            f"║    💬 Social Engagement:  {m.social_engagement:>8,}                       ║",
            f"║    📧 Email Subscribers:  {m.email_subscribers:>8,}                       ║",
            f"║    📬 Email Open Rate:    {m.email_open_rate:>5.1f}%                         ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    📧 Email (Nurture) │ 📊 Campaigns (Ads) │ 📱 Social    ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📢 New Campaign]  [📱 Post]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Growth!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📢 Initializing Marketing Hub...")
    print("=" * 60)
    
    try:
        hub = MarketingHub("Saigon Digital Hub")
        # Add sample data
        hub.campaigns.create_campaign("Q1 Leads", CampaignType.LEAD_GEN, [MarketingChannel.FACEBOOK], 5000.0)
        
        print("\n" + hub.format_hub_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")
