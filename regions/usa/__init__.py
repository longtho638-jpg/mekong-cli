"""
🇺🇸 USA Region Configuration
==============================

Region-specific settings for USA franchisees.

Features:
- USD currency
- English language
- USA-wide coverage (50 states)
"""

from typing import Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum


class USRegion(Enum):
    """USA regions."""
    NORTHEAST = "northeast"
    SOUTHEAST = "southeast"
    MIDWEST = "midwest"
    SOUTHWEST = "southwest"
    WEST = "west"


@dataclass
class State:
    """A US state."""
    code: str
    name: str
    region: USRegion
    population: int  # thousands


@dataclass
class USAConfig:
    """
    USA region configuration.
    
    Covers entire USA (50 states).
    """
    
    # Locale settings
    primary_locale: str = "en"
    
    # Currency settings
    currency: str = "USD"
    
    # Coverage
    coverage_type: str = "nationwide"
    
    # Major metros for targeting
    major_metros: List[str] = field(default_factory=lambda: [
        "New York City",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Francisco"
    ])
    
    # States
    states: List[State] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.states:
            self.states = self._load_states()
    
    def _load_states(self) -> List[State]:
        """Load major US states."""
        return [
            # Northeast
            State("NY", "New York", USRegion.NORTHEAST, 19500),
            State("PA", "Pennsylvania", USRegion.NORTHEAST, 12800),
            State("MA", "Massachusetts", USRegion.NORTHEAST, 6900),
            State("NJ", "New Jersey", USRegion.NORTHEAST, 9300),
            
            # Southeast
            State("FL", "Florida", USRegion.SOUTHEAST, 21500),
            State("GA", "Georgia", USRegion.SOUTHEAST, 10700),
            State("NC", "North Carolina", USRegion.SOUTHEAST, 10400),
            State("VA", "Virginia", USRegion.SOUTHEAST, 8600),
            
            # Midwest
            State("IL", "Illinois", USRegion.MIDWEST, 12800),
            State("OH", "Ohio", USRegion.MIDWEST, 11700),
            State("MI", "Michigan", USRegion.MIDWEST, 10000),
            
            # Southwest
            State("TX", "Texas", USRegion.SOUTHWEST, 29000),
            State("AZ", "Arizona", USRegion.SOUTHWEST, 7300),
            State("NV", "Nevada", USRegion.SOUTHWEST, 3100),
            
            # West
            State("CA", "California", USRegion.WEST, 39500),
            State("WA", "Washington", USRegion.WEST, 7600),
            State("CO", "Colorado", USRegion.WEST, 5800),
            State("OR", "Oregon", USRegion.WEST, 4200),
        ]
    
    def format_usd(self, amount: float) -> str:
        """Format amount in USD."""
        return f"${amount:,.2f}"
    
    def get_summary(self) -> Dict[str, Any]:
        """Get region config summary."""
        return {
            "country": "USA",
            "coverage": self.coverage_type,
            "states": len(self.states),
            "population_millions": sum(s.population for s in self.states) / 1000,
            "major_metros": len(self.major_metros),
            "currency": self.currency,
            "locale": self.primary_locale
        }


class USAPricingEngine:
    """
    Pricing engine for USA market.
    """
    
    def __init__(self, config: USAConfig):
        self.config = config
        
        # Local service pricing (USD)
        self.local_services = {
            "seo_basic": 500,       # $500/month
            "seo_pro": 1500,        # $1500/month
            "content_pack": 300,    # $300/10 posts
            "social_mgmt": 800,     # $800/month
            "ppc_mgmt": 1000,       # $1000/month + ad spend
            "website": 3000,        # $3000 one-time
            "branding": 5000,       # $5000 package
        }
        
        # SaaS affiliate rates (USD)
        self.saas_commissions = {
            "ahrefs": 0.20,
            "semrush": 0.40,
            "convertkit": 0.30,
            "activecampaign": 0.30,
            "hubspot": 0.20,
        }
    
    def get_price(self, service: str) -> str:
        """Get price for a service."""
        price = self.local_services.get(service, 0)
        return self.config.format_usd(price)


# Example usage
if __name__ == "__main__":
    config = USAConfig()
    
    print("🇺🇸 USA Region Configuration")
    print("=" * 50)
    print()
    
    summary = config.get_summary()
    print("📊 Coverage Summary:")
    for key, value in summary.items():
        print(f"   {key}: {value}")
    print()
    
    print("🏙️ Major Metros:")
    for metro in config.major_metros[:5]:
        print(f"   • {metro}")
    print()
    
    pricing = USAPricingEngine(config)
    print("💰 Service Pricing:")
    for service in ["seo_basic", "website", "branding"]:
        print(f"   {service}: {pricing.get_price(service)}")
