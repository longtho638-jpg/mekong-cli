"""
🏯 Chapter 3: Mưu Công (謀攻) - Strategic Offense
=================================================

"Thượng binh phạt mưu" - The highest art is to attack strategy.

Win without fighting - through alliances & positioning.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class AllianceType(Enum):
    """Types of strategic alliances."""
    DISTRIBUTION = "distribution"    # Access to customers
    TECHNOLOGY = "technology"        # Tech partnership
    STRATEGIC = "strategic"          # Strategic investor
    COOPETITION = "coopetition"      # Competitor alliance
    ECOSYSTEM = "ecosystem"          # Platform ecosystem


class WinStrategy(Enum):
    """Win-without-fighting strategies."""
    ALLIANCE = "alliance"            # Win through partnerships
    POSITIONING = "positioning"      # Win through unique position
    TIMING = "timing"                # Win by waiting for right moment
    DIFFERENTIATION = "differentiation"  # Win by being different


@dataclass
class Alliance:
    """A strategic alliance."""
    id: str
    partner_name: str
    alliance_type: AllianceType
    value_given: str
    value_received: str
    status: str = "prospecting"  # prospecting, negotiating, active, ended
    started_at: Optional[datetime] = None
    impact_score: int = 0  # 0-100


@dataclass
class CompetitorAnalysis:
    """Competitor analysis for strategic displacement."""
    name: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    alliances: List[str] = field(default_factory=list)
    attack_vectors: List[str] = field(default_factory=list)


class ChapterThreeStrategy:
    """
    Chapter 3: Mưu Công - Strategic Offense.
    
    "Bách chiến bách thắng, phi thiện chi thiện giả dã"
    (100 wins in 100 battles is not the best - winning without fighting is)
    """
    
    # Strategic Scoring Thresholds
    MIN_PROCEED_SCORE = 50
    DEFAULT_STRATEGIC_FIT = 75
    DEFAULT_RESOURCE_FIT = 80
    DEFAULT_RISK_LEVEL = 30

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.alliances: Dict[str, Alliance] = {}
        self.competitors: Dict[str, CompetitorAnalysis] = {}
        self._init_demo_data()
    
    def _init_demo_data(self) -> None:
        """Initialize demo data."""
        # Sample alliances
        alliance1 = Alliance(
            id="ALL-001",
            partner_name="AWS",
            alliance_type=AllianceType.TECHNOLOGY,
            value_given="Customer case studies",
            value_received="$100K credits + co-marketing",
            status="active",
            started_at=datetime.now(),
            impact_score=85
        )
        
        alliance2 = Alliance(
            id="ALL-002",
            partner_name="Y Combinator",
            alliance_type=AllianceType.ECOSYSTEM,
            value_given="Equity",
            value_received="Network + credibility",
            status="active",
            impact_score=90
        )
        
        self.alliances = {"ALL-001": alliance1, "ALL-002": alliance2}
        
        # Sample competitor
        self.competitors["Competitor A"] = CompetitorAnalysis(
            name="Competitor A",
            strengths=["Large sales team", "Enterprise relationships"],
            weaknesses=["Slow product", "Legacy tech", "High prices"],
            alliances=["Microsoft"],
            attack_vectors=[
                "Target their churning customers",
                "Compete on speed & price",
                "Build better integrations"
            ]
        )
    
    def add_alliance(
        self,
        partner_name: str,
        alliance_type: AllianceType,
        value_given: str,
        value_received: str
    ) -> Alliance:
        """Create a new strategic alliance."""
        alliance = Alliance(
            id=f"ALL-{uuid.uuid4().hex[:6].upper()}",
            partner_name=partner_name,
            alliance_type=alliance_type,
            value_given=value_given,
            value_received=value_received
        )
        self.alliances[alliance.id] = alliance
        return alliance
    
    def evaluate_alliance_fit(self, potential_partner: str) -> Dict[str, Any]:
        """Evaluate if an alliance makes strategic sense."""
        # Simple scoring framework using class constants
        fit_score = self.DEFAULT_STRATEGIC_FIT
        
        return {
            "partner": potential_partner,
            "strategic_fit": fit_score,
            "resource_fit": self.DEFAULT_RESOURCE_FIT,
            "risk_level": self.DEFAULT_RISK_LEVEL,
            "recommendation": "PROCEED" if fit_score > self.MIN_PROCEED_SCORE else "EVALUATE",
            "binh_phap_principle": "Thượng binh phạt mưu - attack through strategy"
        }
    
    def identify_win_without_fighting(self) -> List[Dict[str, Any]]:
        """Identify opportunities to win without direct competition."""
        return [
            {
                "strategy": WinStrategy.ALLIANCE.value,
                "description": "Partner with distribution leader",
                "example": "AWS/GCP marketplace for reach",
                "effort": "Medium",
                "impact": "High"
            },
            {
                "strategy": WinStrategy.POSITIONING.value,
                "description": "Own a unique category",
                "example": "Be the ONLY solution for X niche",
                "effort": "High",
                "impact": "Very High"
            },
            {
                "strategy": WinStrategy.TIMING.value,
                "description": "Wait for competitor weakness",
                "example": "Strike during their leadership change",
                "effort": "Low",
                "impact": "High"
            },
            {
                "strategy": WinStrategy.DIFFERENTIATION.value,
                "description": "Make competition irrelevant",
                "example": "Solve problem in completely new way",
                "effort": "Very High",
                "impact": "Very High"
            }
        ]
    
    def analyze_competitor_alliances(self, competitor_name: str) -> Dict[str, Any]:
        """Analyze competitor's alliance network (to disrupt if needed)."""
        if competitor_name not in self.competitors:
            return {"error": "Competitor not found"}
        
        comp = self.competitors[competitor_name]
        return {
            "competitor": comp.name,
            "alliances": comp.alliances,
            "disruption_opportunities": [
                f"Offer better terms to {ally}" for ally in comp.alliances
            ],
            "attack_vectors": comp.attack_vectors,
            "binh_phap": "Kỳ thứ phạt giao - second best is to disrupt alliances"
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 3 dashboard."""
        active_alliances = [a for a in self.alliances.values() if a.status == "active"]
        total_impact = sum(a.impact_score for a in active_alliances) / len(active_alliances) if active_alliances else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 3: MƯU CÔNG (謀攻)                             ║",
            "║  Win Without Fighting - Strategic Alliances               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🤝 ACTIVE ALLIANCES                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for alliance in active_alliances[:4]:
            type_icon = {
                "distribution": "📦", "technology": "💻",
                "strategic": "🎯", "coopetition": "🤝", "ecosystem": "🌐"
            }
            icon = type_icon.get(alliance.alliance_type.value, "🤝")
            lines.append(f"║    {icon} {alliance.partner_name:<18} │ Impact: {alliance.impact_score}%  ║")
        
        lines.extend([
            "║                                                           ║",
            f"║    📊 Average Alliance Impact: {total_impact:.0f}%                    ║",
            "║                                                           ║",
            "║  🎯 WIN-WITHOUT-FIGHTING STRATEGIES                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for strat in self.identify_win_without_fighting()[:3]:
            lines.append(f"║    ✨ {strat['strategy'].title():<15} │ {strat['impact']:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Bất chiến nhi khuất nhân chi binh\"                   ║",
            "║    (Subdue enemy without fighting)                       ║",
            "║                                                           ║",
            "║  [🤝 Alliances]  [🎯 Strategies]  [📊 Compete]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Win through wisdom!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch3 = ChapterThreeStrategy("Saigon Digital Hub")
    print("🏯 Chapter 3: Mưu Công")
    print("=" * 60)
    print()
    print(ch3.format_dashboard())
