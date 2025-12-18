"""
🏯 Chapter 8: Cửu Biến (九變) - Adaptation & Pivot
==================================================

"9 situations that demand adaptation"

When to pivot, exit options, walk-away power.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class PivotType(Enum):
    """Types of startup pivots."""
    PRODUCT = "product"           # Change what you build
    MARKET = "market"             # Change who you sell to
    CHANNEL = "channel"           # Change how you sell
    REVENUE = "revenue"           # Change how you make money
    TECHNOLOGY = "technology"     # Change underlying tech
    COMPLETE = "complete"         # Full restart


class ExitType(Enum):
    """Types of exits."""
    IPO = "ipo"
    ACQUISITION = "acquisition"
    ACQUI_HIRE = "acqui_hire"
    MERGER = "merger"
    WIND_DOWN = "wind_down"
    BOOTSTRAP = "bootstrap"  # Not an exit - lifestyle business


@dataclass
class PivotScenario:
    """A pivot scenario analysis."""
    pivot_type: PivotType
    from_state: str
    to_state: str
    resources_needed: float
    time_months: int
    success_probability: float
    reasoning: str


@dataclass
class ExitOption:
    """An exit option analysis."""
    exit_type: ExitType
    potential_value: float
    probability: float
    timeline_months: int
    requirements: List[str] = field(default_factory=list)


class ChapterEightAdaptation:
    """
    Chapter 8: Cửu Biến - Adaptation & Pivot.
    
    "Walk-Away Power" - Quyền lực của sự ra đi
    
    "Đồ hữu sở bất do, quân hữu sở bất kích"
    (There are roads not to take, armies not to attack)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pivot_history: List[PivotScenario] = []
        self.exit_options: List[ExitOption] = []
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Sample exit options
        self.exit_options = [
            ExitOption(
                ExitType.ACQUISITION, 50_000_000, 0.25, 36,
                ["$10M+ ARR", "Strategic value", "Clean cap table"]
            ),
            ExitOption(
                ExitType.IPO, 500_000_000, 0.05, 84,
                ["$100M+ ARR", "Profitability path", "Strong governance"]
            ),
            ExitOption(
                ExitType.BOOTSTRAP, 0, 0.60, 24,
                ["Cash flow positive", "Sustainable growth", "Founder control"]
            ),
        ]
    
    def assess_pivot_need(
        self,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess if pivot is needed."""
        runway = metrics.get("runway_months", 12)
        growth_rate = metrics.get("growth_rate", 0)
        nps = metrics.get("nps", 50)
        churn = metrics.get("churn_rate", 5)
        
        # Scoring
        score = 100
        signals = []
        
        if runway < 6:
            score -= 30
            signals.append("🚨 Low runway (<6 months)")
        if growth_rate < 10:
            score -= 20
            signals.append("📉 Slow growth (<10% MoM)")
        if nps < 40:
            score -= 20
            signals.append("😞 Poor NPS (<40)")
        if churn > 10:
            score -= 15
            signals.append("🚪 High churn (>10%)")
        
        need_pivot = score < 50
        
        return {
            "health_score": max(0, score),
            "need_pivot": need_pivot,
            "urgency": "CRITICAL" if score < 30 else "HIGH" if score < 50 else "MEDIUM" if score < 70 else "LOW",
            "signals": signals,
            "recommendation": "Consider pivot options" if need_pivot else "Continue current path",
            "binh_phap": "Cửu biến - know when to adapt"
        }
    
    def generate_pivot_options(
        self,
        current_product: str,
        current_market: str,
        resources: float,
        runway_months: int
    ) -> List[PivotScenario]:
        """Generate pivot options based on current state."""
        options = []
        
        # Product pivot (medium resources, medium time)
        if resources >= 100_000 and runway_months >= 6:
            options.append(PivotScenario(
                PivotType.PRODUCT,
                f"Current: {current_product}",
                "Adjacent product in same market",
                resources * 0.3,
                6,
                0.50,
                "Leverage existing customers and distribution"
            ))
        
        # Market pivot (lower resources, faster)
        if runway_months >= 4:
            options.append(PivotScenario(
                PivotType.MARKET,
                f"Current: {current_market}",
                "New target segment",
                resources * 0.15,
                3,
                0.60,
                "Keep product, find better fit customers"
            ))
        
        # Revenue model pivot
        options.append(PivotScenario(
            PivotType.REVENUE,
            "Current pricing model",
            "New monetization strategy",
            resources * 0.1,
            2,
            0.70,
            "Sometimes just the business model is wrong"
        ))
        
        return options
    
    def calculate_walk_away_power(
        self,
        best_alternative: float,  # Value of best alternative (BATNA)
        current_offer: float,
        founder_ownership: float,
        runway_months: int
    ) -> Dict[str, Any]:
        """
        Calculate Walk-Away Power (WAP).
        The power to say NO to bad deals.
        """
        # BATNA analysis
        batna_value = best_alternative * founder_ownership / 100
        offer_value = current_offer * founder_ownership / 100
        
        # Walk-away power factors
        runway_factor = min(1.0, runway_months / 12)  # More runway = more power
        batna_factor = batna_value / offer_value if offer_value > 0 else 1.0
        
        wap_score = (runway_factor + batna_factor) / 2 * 100
        
        return {
            "walk_away_power": wap_score,
            "can_walk_away": wap_score >= 50,
            "batna_value": batna_value,
            "offer_value": offer_value,
            "factors": {
                "runway_factor": runway_factor * 100,
                "batna_factor": batna_factor * 100,
            },
            "recommendation": "You have leverage - negotiate hard" if wap_score >= 50 else "Limited options - be careful",
            "binh_phap": "Có thể bỏ đi = có quyền lực đàm phán"
        }
    
    def analyze_exit_options(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze available exit options."""
        arr = metrics.get("arr", 0)
        growth = metrics.get("growth_rate", 0)
        
        viable_exits = []
        
        for option in self.exit_options:
            viability = 100
            notes = []
            
            if option.exit_type == ExitType.IPO:
                if arr < 50_000_000:
                    viability -= 50
                    notes.append(f"Need ${50_000_000 - arr:,.0f} more ARR")
                if growth < 30:
                    viability -= 30
                    notes.append("Need faster growth")
            
            elif option.exit_type == ExitType.ACQUISITION:
                if arr < 5_000_000:
                    viability -= 30
                    notes.append("Increase ARR for better multiple")
            
            viable_exits.append({
                "type": option.exit_type.value,
                "viability": max(0, viability),
                "potential_value": option.potential_value,
                "timeline_months": option.timeline_months,
                "notes": notes or ["On track"]
            })
        
        return sorted(viable_exits, key=lambda x: x["viability"], reverse=True)
    
    def format_dashboard(self) -> str:
        """Format Chapter 8 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 8: CỬU BIẾN (九變)                             ║",
            "║  Adaptation, Pivot & Walk-Away Power                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 THE 9 ADAPTATIONS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1️⃣ Product Pivot    │ Change what you build          ║",
            "║    2️⃣ Market Pivot     │ Change who you serve           ║",
            "║    3️⃣ Channel Pivot    │ Change distribution            ║",
            "║    4️⃣ Revenue Pivot    │ Change monetization            ║",
            "║    5️⃣ Tech Pivot       │ Change technology              ║",
            "║    6️⃣ Feature Pivot    │ Zoom in on one feature         ║",
            "║    7️⃣ Platform Pivot   │ Product → Platform             ║",
            "║    8️⃣ Business Pivot   │ B2B ↔ B2C                      ║",
            "║    9️⃣ Complete Pivot   │ Start fresh                    ║",
            "║                                                           ║",
            "║  🚪 EXIT OPTIONS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for option in self.exit_options[:4]:
            value = option.potential_value / 1_000_000
            prob = option.probability * 100
            lines.append(f"║    {option.exit_type.value.upper():<12} │ ${value:.0f}M │ {prob:.0f}% prob  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💪 WALK-AWAY POWER                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🎯 BATNA: Best Alternative To Negotiated Agreement    ║",
            "║    📊 More runway = More power                           ║",
            "║    🤝 Better alternatives = Stronger position            ║",
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Đồ hữu sở bất do, quân hữu sở bất kích\"              ║",
            "║    (Roads not to take, armies not to attack)             ║",
            "║                                                           ║",
            "║  [🔄 Pivot]  [🚪 Exit]  [💪 BATNA]                        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know when to adapt!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch8 = ChapterEightAdaptation("Saigon Digital Hub")
    print("🏯 Chapter 8: Cửu Biến")
    print("=" * 60)
    print()
    print(ch8.format_dashboard())
