"""
🏠 Real Estate Hub - Department Integration
=============================================

Central hub connecting all Real Estate roles within the agency operations.

Integrates:
- Listing Manager
- RE Market Analyst
- Property Portfolio
- RE Lead Manager
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback
try:
    from core.listing_manager import ListingManager, PropertyType, ListingType
    from core.re_market_analyst import REMarketAnalyst, AnalysisType, MarketTrend
    from core.property_portfolio import PropertyPortfolio, AssetClass
    from core.re_lead_manager import RELeadManager, LeadSource, LeadIntent
except ImportError:
    from listing_manager import ListingManager, PropertyType, ListingType
    from re_market_analyst import REMarketAnalyst, AnalysisType, MarketTrend
    from property_portfolio import PropertyPortfolio, AssetClass
    from re_lead_manager import RELeadManager, LeadSource, LeadIntent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class RealEstateMetrics:
    """Department-wide Real Estate performance metrics."""
    active_listings: int = 0
    total_listing_value: float = 0.0
    portfolio_value: float = 0.0
    portfolio_roi: float = 0.0
    total_leads: int = 0
    pipeline_value: float = 0.0
    conversion_rate: float = 0.0
    market_reports: int = 0


class RealEstateHub:
    """
    Real Estate Hub System.
    
    Orchestrates department-wide integration between listings, market research, portfolio tracking, and lead management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        logger.info(f"Initializing Real Estate Hub for {agency_name}")
        
        try:
            self.listings = ListingManager(agency_name)
            self.analyst = REMarketAnalyst(agency_name)
            self.portfolio = PropertyPortfolio(agency_name)
            self.leads = RELeadManager(agency_name)
        except Exception as e:
            logger.error(f"RE Hub initialization failed: {e}")
            raise
    
    def get_aggregate_stats(self) -> RealEstateMetrics:
        """Fetch and aggregate data from all department sub-modules."""
        m = RealEstateMetrics()
        
        try:
            # 1. Listing Data
            l_stats = self.listings.get_stats()
            m.active_listings = l_stats.get("active", 0)
            m.total_listing_value = float(l_stats.get("total_value", 0.0))
            
            # 2. Portfolio Data
            p_sum = self.portfolio.get_aggregate_summary()
            m.portfolio_value = p_sum.total_value
            m.portfolio_roi = p_sum.roi_percent
            
            # 3. Lead Data
            # Note: RELeadManager dashboard/stats might need standardization
            m.total_leads = len(self.leads.leads)
            m.pipeline_value = sum(l.budget for l in self.leads.leads.values())
            
            # 4. Market Reports
            m.market_reports = len(self.analyst.reports)
            
        except Exception as e:
            logger.warning(f"Error aggregating RE metrics: {e}")
            
        return m
    
    def format_hub_dashboard(self) -> str:
        """Render the unified Real Estate Department Dashboard."""
        m = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏠 REAL ESTATE HUB DASHBOARD{' ' * 33}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT PERFORMANCE METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📋 Active Listings:    {m.active_listings:>5}                          ║",
            f"║    💰 Listing Value:      ${m.total_listing_value:>12,.0f}              ║",
            f"║    🏢 Portfolio Value:    ${m.portfolio_value:>12,.0f}              ║",
            f"║    📈 Portfolio ROI:      {m.portfolio_roi:>+11.1f}%              ║",
            f"║    👥 Total Leads:        {m.total_leads:>5}                          ║",
            f"║    💰 Pipeline Value:     ${m.pipeline_value:>12,.0f}              ║",
            f"║    📊 Market Reports:     {m.market_reports:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🏠 Listings │ 📊 Research │ 🏢 Assets │ 👥 Pipeline    ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🏠 Listings]  [👥 Leads]  [⚙️ Setup]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🏠 Initializing RE Hub...")
    print("=" * 60)
    
    try:
        hub = RealEstateHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"RE Hub Error: {e}")
