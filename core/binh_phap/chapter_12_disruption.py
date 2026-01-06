"""
🏯 Chapter 12: Hỏa Công (火攻) - Disruption
===========================================

"5 ways to attack by fire" - Disruption strategy.

Market disruption, competitive displacement.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class DisruptionType(Enum):
    """Types of market disruption (adapted from 5 types of fire)."""
    TECHNOLOGY = "technology"        # New tech displaces old
    BUSINESS_MODEL = "business_model"  # New model disrupts pricing
    EXPERIENCE = "experience"        # Better UX displaces incumbents
    DISTRIBUTION = "distribution"    # New channel disrupts access
    PLATFORM = "platform"            # Platform vs point solution


class DisruptionStage(Enum):
    """Stage of disruption."""
    EMERGING = "emerging"            # Just starting
    GROWING = "growing"              # Gaining traction
    MAINSTREAM = "mainstream"        # Widely adopted
    MATURE = "mature"                # Established position


@dataclass
class DisruptionStrategy:
    """A disruption strategy."""
    name: str
    disruption_type: DisruptionType
    target_incumbent: str
    disruption_vector: str
    time_to_impact: int  # months
    investment_required: float
    success_probability: float


@dataclass
class CompetitiveDisplacement:
    """Competitive displacement analysis."""
    incumbent: str
    vulnerability: str
    attack_strategy: str
    timeline_months: int
    confidence: float


class ChapterTwelveDisruption:
    """
    Chapter 12: Hỏa Công - Disruption.
    
    "5 ways to attack by fire" - 5 cách tấn công bằng lửa
    """
    
    # Disruption Score Weightings
    WEIGHT_TECH = 0.30
    WEIGHT_TIMING = 0.25
    WEIGHT_TEAM = 0.25
    WEIGHT_CAPITAL = 0.20
    
    # Potential Score Thresholds
    THRESHOLD_HIGH_POTENTIAL = 80
    THRESHOLD_MEDIUM_POTENTIAL = 60
    THRESHOLD_LOW_POTENTIAL = 40
    
    # Recommendation Thresholds
    RECOMMENDATION_THRESHOLD = 70

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.strategies: List[DisruptionStrategy] = []
        self.displacements: List[CompetitiveDisplacement] = []
        self._init_demo_data()
    
    def _init_demo_data(self) -> None:
        """Initialize demo data."""
        self.strategies = [
            DisruptionStrategy(
                name="AI-First Automation",
                disruption_type=DisruptionType.TECHNOLOGY,
                target_incumbent="Legacy Enterprise Software",
                disruption_vector="Replace manual workflows with AI",
                time_to_impact=24,
                investment_required=2_000_000,
                success_probability=0.45
            ),
            DisruptionStrategy(
                name="Usage-Based Pricing",
                disruption_type=DisruptionType.BUSINESS_MODEL,
                target_incumbent="Per-seat SaaS",
                disruption_vector="Pay for what you use vs fixed seats",
                time_to_impact=12,
                investment_required=500_000,
                success_probability=0.60
            ),
        ]
        
        self.displacements = [
            CompetitiveDisplacement(
                "BigCorp CRM",
                "Complex UI, slow innovation",
                "Simple, AI-native CRM for SMB",
                18,
                0.55
            ),
        ]
    
    def analyze_disruption_opportunity(
        self,
        market: str,
        incumbent: str,
        incumbent_weakness: str
    ) -> Dict[str, Any]:
        """Analyze disruption opportunity."""
        # Map weakness to disruption type
        weakness_lower = incumbent_weakness.lower()
        
        if "technology" in weakness_lower or "legacy" in weakness_lower:
            disruption_type = DisruptionType.TECHNOLOGY
        elif "pricing" in weakness_lower or "expensive" in weakness_lower:
            disruption_type = DisruptionType.BUSINESS_MODEL
        elif "ux" in weakness_lower or "complex" in weakness_lower:
            disruption_type = DisruptionType.EXPERIENCE
        elif "distribution" in weakness_lower or "access" in weakness_lower:
            disruption_type = DisruptionType.DISTRIBUTION
        else:
            disruption_type = DisruptionType.PLATFORM
        
        return {
            "market": market,
            "incumbent": incumbent,
            "weakness": incumbent_weakness,
            "recommended_disruption": disruption_type.value,
            "attack_vectors": self._get_attack_vectors(disruption_type),
            "binh_phap": "Hỏa công - Attack with fire (disruption)"
        }
    
    def _get_attack_vectors(self, disruption_type: DisruptionType) -> List[str]:
        """Get attack vectors for disruption type."""
        vectors = {
            DisruptionType.TECHNOLOGY: [
                "Build 10x better technology",
                "Leverage new AI/ML capabilities",
                "Mobile/cloud-native architecture",
                "API-first design",
            ],
            DisruptionType.BUSINESS_MODEL: [
                "Freemium to capture market",
                "Usage-based pricing",
                "Outcome-based pricing",
                "Unbundle/rebundle services",
            ],
            DisruptionType.EXPERIENCE: [
                "Consumer-grade UX for enterprise",
                "Self-serve onboarding",
                "Instant time-to-value",
                "Mobile-first design",
            ],
            DisruptionType.DISTRIBUTION: [
                "Marketplace distribution",
                "Viral/PLG growth",
                "Partner ecosystem",
                "Embedded/white-label",
            ],
            DisruptionType.PLATFORM: [
                "Build ecosystem around product",
                "API platform for developers",
                "Two-sided marketplace",
                "Network effects",
            ],
        }
        return vectors.get(disruption_type, vectors[DisruptionType.TECHNOLOGY])
    
    def calculate_disruption_score(
        self,
        technology_advantage: int,  # 0-100
        market_timing: int,         # 0-100
        team_capability: int,       # 0-100
        capital_access: int         # 0-100
    ) -> Dict[str, Any]:
        """Calculate disruption potential score using weighted average."""
        score = (
            technology_advantage * self.WEIGHT_TECH +
            market_timing * self.WEIGHT_TIMING +
            team_capability * self.WEIGHT_TEAM +
            capital_access * self.WEIGHT_CAPITAL
        )
        
        # Determine potential using constants
        if score >= self.THRESHOLD_HIGH_POTENTIAL:
            potential = "🔥 HIGH - Strong disruption potential"
        elif score >= self.THRESHOLD_MEDIUM_POTENTIAL:
            potential = "⚡ MEDIUM - Disrupt with focus"
        elif score >= self.THRESHOLD_LOW_POTENTIAL:
            potential = "⚠️ LOW - Need more advantages"
        else:
            potential = "❌ UNLIKELY - Reconsider approach"
        
        return {
            "disruption_score": score,
            "potential": potential,
            "breakdown": {
                "technology": technology_advantage,
                "timing": market_timing,
                "team": team_capability,
                "capital": capital_access
            },
            "recommendations": self._get_disruption_recommendations(
                technology_advantage, market_timing, team_capability, capital_access
            )
        }
    
    def _get_disruption_recommendations(
        self, tech: int, timing: int, team: int, capital: int
    ) -> List[str]:
        """Get recommendations to improve disruption potential using constant threshold."""
        recs = []
        if tech < self.RECOMMENDATION_THRESHOLD:
            recs.append("🔧 Build stronger tech differentiation")
        if timing < self.RECOMMENDATION_THRESHOLD:
            recs.append("⏰ Accelerate or wait for better timing")
        if team < self.RECOMMENDATION_THRESHOLD:
            recs.append("👥 Strengthen team with key hires")
        if capital < self.RECOMMENDATION_THRESHOLD:
            recs.append("💰 Secure more runway/capital")
        
        if not recs:
            recs.append("✅ Ready to disrupt - execute aggressively!")
        return recs
    
    def format_dashboard(self) -> str:
        """Format Chapter 12 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 12: HỎA CÔNG (火攻)                            ║",
            "║  Disruption & Market Attack                               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔥 5 TYPES OF DISRUPTION                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1️⃣ Technology     │ New tech displaces old           ║",
            "║    2️⃣ Business Model │ New pricing/model disrupts       ║",
            "║    3️⃣ Experience     │ Better UX wins                   ║",
            "║    4️⃣ Distribution   │ New channels access              ║",
            "║    5️⃣ Platform       │ Ecosystem vs point solution      ║",
            "║                                                           ║",
            "║  🎯 ACTIVE STRATEGIES                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {
            "technology": "💻", "business_model": "💰",
            "experience": "✨", "distribution": "📦", "platform": "🌐"
        }
        
        for strategy in self.strategies[:3]:
            icon = type_icons.get(strategy.disruption_type.value, "🔥")
            prob = strategy.success_probability * 100
            lines.append(f"║    {icon} {strategy.name[:25]:<25} │ {prob:.0f}%  ║")
            lines.append(f"║       Target: {strategy.target_incumbent[:35]:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 DISPLACEMENT TARGETS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for displacement in self.displacements[:2]:
            lines.append(f"║    🎯 {displacement.incumbent:<25} ({displacement.confidence*100:.0f}%)  ║")
            lines.append(f"║       Attack: {displacement.attack_strategy[:35]:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Hỏa công hữu ngũ\" - Fire attack has 5 methods       ║",
            "║    Use disruption strategically, not destructively       ║",
            "║                                                           ║",
            "║  [🔥 Disrupt]  [🎯 Target]  [📊 Score]                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Disrupt wisely!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch12 = ChapterTwelveDisruption("Saigon Digital Hub")
    print("🏯 Chapter 12: Hỏa Công")
    print("=" * 60)
    print()
    print(ch12.format_dashboard())
