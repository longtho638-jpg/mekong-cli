"""
🏠 Real Estate Hub - Department Integration
=============================================

Central hub connecting all Real Estate roles.

Integrates:
- Listing Manager
- RE Market Analyst
- Property Portfolio
- RE Lead Manager
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.listing_manager import ListingManager, PropertyType, ListingType
from core.re_market_analyst import REMarketAnalyst, AnalysisType, MarketTrend
from core.property_portfolio import PropertyPortfolio, AssetClass
from core.re_lead_manager import RELeadManager, LeadSource, LeadIntent


@dataclass
class RealEstateMetrics:
    """Department-wide metrics."""
    active_listings: int
    total_listing_value: float
    portfolio_value: float
    portfolio_roi: float
    total_leads: int
    pipeline_value: float
    conversion_rate: float
    market_reports: int


class RealEstateHub:
    """
    Real Estate Hub.
    
    Connects all RE roles.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.listings = ListingManager(agency_name)
        self.analyst = REMarketAnalyst(agency_name)
        self.portfolio = PropertyPortfolio(agency_name)
        self.leads = RELeadManager(agency_name)
    
    def get_department_metrics(self) -> RealEstateMetrics:
        """Get department-wide metrics."""
        listing_stats = self.listings.get_stats()
        portfolio_summary = self.portfolio.get_portfolio_summary()
        lead_stats = self.leads.get_stats()
        analyst_stats = self.analyst.get_stats()
        
        return RealEstateMetrics(
            active_listings=listing_stats.get("active", 0),
            total_listing_value=listing_stats.get("total_value", 0),
            portfolio_value=portfolio_summary.total_value,
            portfolio_roi=portfolio_summary.roi_percent,
            total_leads=lead_stats.get("total", 0),
            pipeline_value=lead_stats.get("pipeline_value", 0),
            conversion_rate=lead_stats.get("conversion_rate", 0),
            market_reports=analyst_stats.get("total_reports", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏠 REAL ESTATE HUB                                       ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Active Listings:    {metrics.active_listings:>5}                          ║",
            f"║    💰 Listing Value:      ${metrics.total_listing_value:>12,.0f}              ║",
            f"║    🏢 Portfolio Value:    ${metrics.portfolio_value:>12,.0f}              ║",
            f"║    📈 Portfolio ROI:      {metrics.portfolio_roi:>+5.1f}%                         ║",
            f"║    📋 Total Leads:        {metrics.total_leads:>5}                          ║",
            f"║    💰 Pipeline Value:     ${metrics.pipeline_value:>12,.0f}              ║",
            f"║    🎯 Conversion Rate:    {metrics.conversion_rate:>5.1f}%                         ║",
            f"║    📊 Market Reports:     {metrics.market_reports:>5}                          ║",
            "║                                                           ║",
            "║  🔗 REAL ESTATE ROLES                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📋 Listing Manager    → Property listings             ║",
            "║    📊 Market Analyst     → Market intelligence           ║",
            "║    🏢 Portfolio Manager  → Asset management              ║",
            "║    📋 Lead Manager       → Sales pipeline                ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Listings           │ {metrics.active_listings} active                  ║",
            f"║    🏢 Portfolio          │ ${metrics.portfolio_value:,.0f}              ║",
            f"║    📋 Leads              │ {metrics.total_leads} in pipeline             ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🏠 Listings]  [⚙️ Settings]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Real estate excellence!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = RealEstateHub("Saigon Digital Hub")
    
    print("🏠 Real Estate Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.listings.create_listing("CLT-001", "Villa D2", PropertyType.VILLA, ListingType.SALE, 1000000, "D2")
    hub.analyst.create_report("CLT-001", "Market Overview", AnalysisType.MARKET_OVERVIEW, "D2", 5000, MarketTrend.UP)
    hub.portfolio.add_asset("CLT-001", "Office Tower", AssetClass.COMMERCIAL, 5000000, 6000000)
    hub.leads.capture_lead("John", "0901234567", "j@email.com", LeadSource.WEBSITE, LeadIntent.BUY, 500000, "D2")
    
    print(hub.format_hub_dashboard())
