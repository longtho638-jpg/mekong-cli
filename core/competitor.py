"""
🔍 Competitor Analysis - Know Your Market
==========================================

Analyze competitors and find market opportunities.
Essential for agency strategy!

Features:
- Competitor profiling
- SWOT analysis
- Market gap finder
- Strategy recommendations
"""

import logging
from typing import Dict, List
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CompetitorSize(Enum):
    """Competitor size based on team/revenue."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"


class ThreatLevel(Enum):
    """Estimated threat level to our agency."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Competitor:
    """A competitor profile entity."""
    name: str
    website: str
    size: CompetitorSize
    services: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    price_range: str = "Unknown"
    threat_level: ThreatLevel = ThreatLevel.MEDIUM

    def __post_init__(self):
        if not self.name:
            raise ValueError("Competitor name cannot be empty")


@dataclass
class MarketGap:
    """A market opportunity gap record."""
    name: str
    description: str
    opportunity_score: int  # 1-10
    difficulty: str
    recommendation: str


class CompetitorAnalysis:
    """
    Competitor Analysis System.
    
    Identifies market gaps and competitive advantages by profiling industry rivals.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.competitors: List[Competitor] = []
        logger.info(f"Competitor Analysis initialized for {niche} in {location}")
    
    def add_competitor(self, competitor: Competitor):
        """Register a competitor for analysis."""
        self.competitors.append(competitor)
        logger.info(f"Competitor added: {competitor.name} ({competitor.threat_level.value})")
    
    def analyze_swot(self) -> Dict[str, List[str]]:
        """Generate dynamic SWOT based on current market knowledge."""
        # Opportunities are derived from competitor weaknesses
        opps = [
            f"Capitalize on {c.name}'s weak {w.lower()}" 
            for c in self.competitors for w in c.weaknesses[:1]
        ]
        
        return {
            "strengths": [
                f"Specialized in {self.niche}",
                "AI-powered automation workflows",
                f"Local expertise in {self.location}"
            ],
            "weaknesses": [
                "Early stage market presence",
                "Fewer established case studies"
            ],
            "opportunities": opps or [f"Growing {self.niche} demand in {self.location}"],
            "threats": [
                "Established local incumbents",
                "Commoditization of basic services"
            ]
        }
    
    def find_market_gaps(self) -> List[MarketGap]:
        """Identify strategic openings in the market."""
        gaps = [
            MarketGap(
                name="AI-First Workflow",
                description="Rivals lack integrated automation",
                opportunity_score=9,
                difficulty="Medium",
                recommendation="Position as the hyper-efficient agency"
            ),
            MarketGap(
                name="Transparent ROI",
                description="Competitors have black-box reporting",
                opportunity_score=8,
                difficulty="Low",
                recommendation="Offer real-time client dashboards"
            ),
            MarketGap(
                name="Niche Authority",
                description=f"No clear leader for {self.niche} in {self.location}",
                opportunity_score=7,
                difficulty="Medium",
                recommendation="Double down on specific niche content"
            )
        ]
        return sorted(gaps, key=lambda x: x.opportunity_score, reverse=True)
    
    def format_analysis(self) -> str:
        """Render the Competitor Analysis Dashboard."""
        swot = self.analyze_swot()
        gaps = self.find_market_gaps()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔍 COMPETITOR ANALYSIS: {self.niche.upper()[:30]:<30}  ║",
            f"║  Market: {self.location[:45]:<45}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        if self.competitors:
            lines.append("║  👥 COMPETITOR PROFILES                                   ║")
            lines.append("║  " + "─" * 57 + "  ║")
            for c in self.competitors[:3]:
                t_icon = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}.get(c.threat_level.value, "⚪")
                lines.append(f"║    {t_icon} {c.name:<25} ({c.size.value:<10})           ║")
            lines.append("║                                                           ║")
        
        lines.append("╠═══════════════════════════════════════════════════════════╣")
        lines.append("║  📊 SWOT SUMMARY                                          ║")
        lines.append("║  " + "─" * 57 + "  ║")
        
        for key, icon in [("strengths", "✅"), ("weaknesses", "⚠️"), ("opportunities", "🎯")]:
            lines.append(f"║    {icon} {key.upper():<50}  ║")
            for item in swot[key][:2]:
                lines.append(f"║       • {item[:45]:<45}   ║")
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💎 TOP MARKET GAPS                                       ║",
            "║  " + "─" * 57 + "  ║",
        ])
        
        for g in gaps[:2]:
            stars = "★" * g.opportunity_score + "☆" * (10 - g.opportunity_score)
            lines.append(f"║    🎯 {g.name:<20} Score: {stars}    ║")
            lines.append(f"║       Rec: {g.recommendation[:45]:<45}  ║")
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Win Without Fighting ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔍 Initializing Competitor Analysis...")
    print("=" * 60)
    
    try:
        analysis_tool = CompetitorAnalysis("Saigon Digital Hub", "Real Estate", "Ho Chi Minh City")
        
        analysis_tool.add_competitor(Competitor(
            name="BigCity Ads",
            website="bigcity.vn",
            size=CompetitorSize.LARGE,
            weaknesses=["Slow onboarding", "Confusing pricing"],
            threat_level=ThreatLevel.HIGH
        ))
        
        print("\n" + analysis_tool.format_analysis())
        
    except Exception as e:
        logger.error(f"Analysis Error: {e}")
