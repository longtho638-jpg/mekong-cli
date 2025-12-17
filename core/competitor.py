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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CompetitorSize(Enum):
    """Competitor size."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"


class ThreatLevel(Enum):
    """Threat level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Competitor:
    """A competitor profile."""
    name: str
    website: str
    size: CompetitorSize
    services: List[str]
    strengths: List[str]
    weaknesses: List[str]
    price_range: str
    threat_level: ThreatLevel


@dataclass
class MarketGap:
    """A market opportunity gap."""
    name: str
    description: str
    opportunity_score: int  # 1-10
    difficulty: str
    recommendation: str


class CompetitorAnalysis:
    """
    Competitor Analysis Tool.
    
    Analyze market and find opportunities.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.competitors: List[Competitor] = []
    
    def add_competitor(self, competitor: Competitor):
        """Add a competitor to analysis."""
        self.competitors.append(competitor)
    
    def analyze_swot(self) -> Dict[str, List[str]]:
        """Generate SWOT analysis based on competitors."""
        # Aggregate competitor data
        all_strengths = []
        all_weaknesses = []
        
        for c in self.competitors:
            all_weaknesses.extend(c.weaknesses)
        
        return {
            "strengths": [
                f"Specialized in {self.niche}",
                "AI-powered automation",
                f"Local expertise in {self.location}",
                "Fast turnaround times",
                "Transparent pricing",
            ],
            "weaknesses": [
                "New player in market",
                "Limited case studies",
                "Smaller team size",
            ],
            "opportunities": [
                f"Growing {self.niche} market",
                "Competitors lack automation",
                "Price gap in mid-market",
                "Underserved local businesses",
            ],
            "threats": [
                "Established competitors",
                "Price competition",
                "Market saturation",
            ]
        }
    
    def find_market_gaps(self) -> List[MarketGap]:
        """Find market opportunities."""
        gaps = [
            MarketGap(
                name="AI Automation",
                description="Most competitors don't offer AI-powered solutions",
                opportunity_score=9,
                difficulty="Medium",
                recommendation="Position as the AI-first agency in your niche"
            ),
            MarketGap(
                name="Mid-Market Pricing",
                description="Gap between budget and premium services",
                opportunity_score=8,
                difficulty="Low",
                recommendation="Offer tiered pricing with clear value props"
            ),
            MarketGap(
                name="Local Focus",
                description=f"Few agencies specialize in {self.location}",
                opportunity_score=7,
                difficulty="Low",
                recommendation="Emphasize local market knowledge"
            ),
            MarketGap(
                name="Transparent Reporting",
                description="Competitors use confusing metrics",
                opportunity_score=8,
                difficulty="Low",
                recommendation="Offer clear ROI dashboards"
            ),
            MarketGap(
                name="Fast Onboarding",
                description="Most agencies have slow setup",
                opportunity_score=6,
                difficulty="Medium",
                recommendation="Promise results in 30 days"
            ),
        ]
        return sorted(gaps, key=lambda x: x.opportunity_score, reverse=True)
    
    def format_analysis(self) -> str:
        """Format complete analysis."""
        swot = self.analyze_swot()
        gaps = self.find_market_gaps()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔍 COMPETITOR ANALYSIS: {self.niche.upper()[:28]:<28}   ║",
            f"║  Market: {self.location:<45}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Competitors section
        if self.competitors:
            lines.append("║  👥 COMPETITOR PROFILES                                   ║")
            lines.append("║  ─────────────────────────────────────────────────────── ║")
            
            for c in self.competitors[:3]:
                threat_icon = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}[c.threat_level.value]
                lines.append(f"║    {threat_icon} {c.name:<25} ({c.size.value})           ║")
                lines.append(f"║       Price: {c.price_range:<40}    ║")
            
            lines.append("║                                                           ║")
        
        # SWOT section
        lines.append("╠═══════════════════════════════════════════════════════════╣")
        lines.append("║  📊 SWOT ANALYSIS                                         ║")
        lines.append("║  ─────────────────────────────────────────────────────── ║")
        
        lines.append("║    ✅ STRENGTHS                                           ║")
        for s in swot["strengths"][:3]:
            lines.append(f"║       • {s[:45]:<45}   ║")
        
        lines.append("║    ⚠️ WEAKNESSES                                          ║")
        for w in swot["weaknesses"][:2]:
            lines.append(f"║       • {w[:45]:<45}   ║")
        
        lines.append("║    🎯 OPPORTUNITIES                                       ║")
        for o in swot["opportunities"][:3]:
            lines.append(f"║       • {o[:45]:<45}   ║")
        
        lines.append("║    🔴 THREATS                                             ║")
        for t in swot["threats"][:2]:
            lines.append(f"║       • {t[:45]:<45}   ║")
        
        lines.append("║                                                           ║")
        
        # Market Gaps section
        lines.append("╠═══════════════════════════════════════════════════════════╣")
        lines.append("║  💎 MARKET GAPS (OPPORTUNITIES)                           ║")
        lines.append("║  ─────────────────────────────────────────────────────── ║")
        
        for gap in gaps[:4]:
            score_bar = "★" * gap.opportunity_score + "☆" * (10 - gap.opportunity_score)
            lines.append(f"║    🎯 {gap.name:<20} Score: {score_bar}    ║")
            lines.append(f"║       {gap.recommendation[:45]:<45}   ║")
        
        lines.append("║                                                           ║")
        
        # Footer
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  💡 Focus on high scores first = Quick wins!              ║",
            "║                                                           ║",
            f"║  🏯 {self.agency_name} - \"Không đánh mà thắng\"              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    analysis = CompetitorAnalysis(
        agency_name="Saigon Digital Hub",
        niche="Real Estate Marketing",
        location="Ho Chi Minh City"
    )
    
    # Add sample competitors
    analysis.add_competitor(Competitor(
        name="BigCity Marketing",
        website="bigcitymarketing.vn",
        size=CompetitorSize.LARGE,
        services=["SEO", "PPC", "Social"],
        strengths=["Brand recognition", "Large team"],
        weaknesses=["Slow turnaround", "High prices"],
        price_range="$2,000-$10,000/mo",
        threat_level=ThreatLevel.HIGH
    ))
    
    analysis.add_competitor(Competitor(
        name="Local Ads Co",
        website="localads.vn",
        size=CompetitorSize.SMALL,
        services=["Facebook Ads"],
        strengths=["Low prices"],
        weaknesses=["Limited services", "No reporting"],
        price_range="$200-$500/mo",
        threat_level=ThreatLevel.LOW
    ))
    
    print("🔍 Competitor Analysis")
    print("=" * 60)
    print()
    print(analysis.format_analysis())
