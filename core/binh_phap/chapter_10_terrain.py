"""
🏯 Chapter 10: Địa Hình (地形) - Market Terrain
===============================================

"6 loại địa hình" - 6 types of terrain.

Market landscape, TAM/SAM/SOM, regulatory environment.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class TerrainType(Enum):
    """Market terrain types (adapted from Sun Tzu)."""
    ACCESSIBLE = "accessible"      # Easy entry, easy exit
    ENTANGLING = "entangling"      # Easy entry, hard exit
    TEMPORIZING = "temporizing"    # Neither advances
    NARROW = "narrow"              # Few competitors can fit
    PRECIPITOUS = "precipitous"    # High barrier, high reward
    DISTANT = "distant"            # Far from your core


class MarketTiming(Enum):
    """Market timing."""
    TOO_EARLY = "too_early"
    EARLY = "early"
    RIGHT_TIME = "right_time"
    LATE = "late"
    TOO_LATE = "too_late"


@dataclass
class MarketSize:
    """TAM/SAM/SOM analysis."""
    tam: float  # Total Addressable Market
    sam: float  # Serviceable Addressable Market
    som: float  # Serviceable Obtainable Market
    growth_rate: float = 0  # Annual growth %
    
    @property
    def penetration_rate(self) -> float:
        return (self.som / self.sam * 100) if self.sam > 0 else 0


@dataclass
class TerrainAnalysis:
    """Complete terrain analysis."""
    market_name: str
    terrain_type: TerrainType
    market_size: MarketSize
    timing: MarketTiming
    regulatory_complexity: int  # 0-100
    competition_intensity: int  # 0-100
    entry_barriers: int  # 0-100
    notes: str = ""


class ChapterTenTerrain:
    """
    Chapter 10: Địa Hình - Market Terrain.
    
    "Địa hình giả, binh chi trợ dã"
    (Terrain is an aid to the army)
    """
    
    # Terrain Classification Thresholds
    BARRIER_LOW = 30
    BARRIER_PRECIPITOUS = 70
    COMPETITION_LOW = 40
    COMPETITION_HIGH = 60
    SAM_TAM_RATIO_NARROW = 0.1
    
    # Timing Growth Rates (%)
    GROWTH_EARLY_THRESHOLD = 50
    GROWTH_RIGHT_TIME_THRESHOLD = 25
    GROWTH_LATE_THRESHOLD = 10

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.terrain_analyses: Dict[str, TerrainAnalysis] = {}
        self._init_demo_data()
    
    def _init_demo_data(self) -> None:
        """Initialize demo data."""
        self.terrain_analyses["Enterprise AI"] = TerrainAnalysis(
            market_name="Enterprise AI",
            terrain_type=TerrainType.NARROW,
            market_size=MarketSize(
                tam=150_000_000_000,  # $150B
                sam=10_000_000_000,   # $10B
                som=50_000_000,       # $50M
                growth_rate=35
            ),
            timing=MarketTiming.RIGHT_TIME,
            regulatory_complexity=40,
            competition_intensity=75,
            entry_barriers=60,
            notes="Hot market, crowded but growing"
        )
    
    def analyze_terrain(
        self,
        market_name: str,
        tam: float, sam: float, som: float,
        growth_rate: float,
        regulatory: int, competition: int, barriers: int
    ) -> TerrainAnalysis:
        """Analyze market terrain."""
        # Determine terrain type using constants
        if barriers < self.BARRIER_LOW and competition < self.COMPETITION_LOW:
            terrain_type = TerrainType.ACCESSIBLE
        elif barriers < self.BARRIER_LOW and competition > self.COMPETITION_HIGH:
            terrain_type = TerrainType.ENTANGLING
        elif barriers > self.BARRIER_PRECIPITOUS:
            terrain_type = TerrainType.PRECIPITOUS
        elif tam > 0 and (sam / tam) < self.SAM_TAM_RATIO_NARROW:
            terrain_type = TerrainType.NARROW
        else:
            terrain_type = TerrainType.TEMPORIZING
        
        # Determine timing using constants
        if growth_rate > self.GROWTH_EARLY_THRESHOLD:
            timing = MarketTiming.EARLY
        elif growth_rate > self.GROWTH_RIGHT_TIME_THRESHOLD:
            timing = MarketTiming.RIGHT_TIME
        elif growth_rate > self.GROWTH_LATE_THRESHOLD:
            timing = MarketTiming.LATE
        else:
            timing = MarketTiming.TOO_LATE
        
        analysis = TerrainAnalysis(
            market_name=market_name,
            terrain_type=terrain_type,
            market_size=MarketSize(tam, sam, som, growth_rate),
            timing=timing,
            regulatory_complexity=regulatory,
            competition_intensity=competition,
            entry_barriers=barriers
        )
        
        self.terrain_analyses[market_name] = analysis
        return analysis
    
    def get_terrain_strategy(self, terrain_type: TerrainType) -> Dict[str, Any]:
        """Get recommended strategy for terrain type."""
        strategies = {
            TerrainType.ACCESSIBLE: {
                "description": "Đất dễ vào, dễ ra",
                "strategy": "Move fast, establish presence",
                "risks": ["Easy for competitors too", "Low switching costs"],
                "tactics": ["First mover advantage", "Build brand quickly", "Lock in customers"],
            },
            TerrainType.ENTANGLING: {
                "description": "Đất dễ vào, khó ra",
                "strategy": "Enter only if victory is certain",
                "risks": ["Hard to exit if wrong", "High sunk costs"],
                "tactics": ["Validate thoroughly before committing", "Plan exit strategy"],
            },
            TerrainType.NARROW: {
                "description": "Đất hẹp - ít người qua được",
                "strategy": "Dominate the niche",
                "risks": ["Limited market size", "May need to expand later"],
                "tactics": ["Own the niche completely", "Build expertise moat", "Expand from strength"],
            },
            TerrainType.PRECIPITOUS: {
                "description": "Đất hiểm - rào cản cao, thưởng cao",
                "strategy": "Build fortress if you get there first",
                "risks": ["High investment required", "Long time to value"],
                "tactics": ["Raise enough capital", "Move deliberately", "Protect position"],
            },
            TerrainType.TEMPORIZING: {
                "description": "Đất trì hoãn - không ai tiến lên",
                "strategy": "Wait for catalyst, or create one",
                "risks": ["Market may not develop", "Resources tied up"],
                "tactics": ["Monitor closely", "Be ready to move", "Don't over-invest"],
            },
            TerrainType.DISTANT: {
                "description": "Đất xa - xa lĩnh vực cốt lõi",
                "strategy": "Avoid unless strategic necessity",
                "risks": ["Outside core competency", "Resource drain"],
                "tactics": ["Partner instead of build", "Acquire if necessary", "Stay focused"],
            },
        }
        return strategies.get(terrain_type, strategies[TerrainType.ACCESSIBLE])
    
    def assess_market_timing(self, analysis: TerrainAnalysis) -> Dict[str, Any]:
        """Assess market timing."""
        timing = analysis.timing
        market = analysis.market_size
        
        timing_advice = {
            MarketTiming.TOO_EARLY: {
                "status": "🌱 TOO EARLY",
                "advice": "Market not ready - educate or wait",
                "action": "Build MVP, validate, conserve resources"
            },
            MarketTiming.EARLY: {
                "status": "⏰ EARLY",
                "advice": "Good time - be a pioneer",
                "action": "Move fast, capture early adopters, iterate"
            },
            MarketTiming.RIGHT_TIME: {
                "status": "✅ RIGHT TIME",
                "advice": "Perfect timing - execute aggressively",
                "action": "Scale fast, invest heavily, build moats"
            },
            MarketTiming.LATE: {
                "status": "⚠️ LATE",
                "advice": "Market maturing - differentiate or niche",
                "action": "Find underserved segment, innovate on model"
            },
            MarketTiming.TOO_LATE: {
                "status": "❌ TOO LATE",
                "advice": "Market saturated - pivot or exit",
                "action": "Look for adjacent markets, disrupt or exit"
            },
        }
        
        return {
            **timing_advice.get(timing, timing_advice[MarketTiming.LATE]),
            "market_growth": market.growth_rate,
            "som_target": market.som,
            "binh_phap": "Thiên thời địa lợi - timing and terrain"
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 10 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 10: ĐỊA HÌNH (地形)                            ║",
            "║  Market Terrain & Timing Analysis                         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🗺️ 6 TYPES OF TERRAIN                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1️⃣ Accessible  │ Easy entry, easy exit               ║",
            "║    2️⃣ Entangling  │ Easy entry, hard exit               ║",
            "║    3️⃣ Temporizing │ Neither side advances               ║",
            "║    4️⃣ Narrow      │ Few can compete                     ║",
            "║    5️⃣ Precipitous │ High barrier, high reward           ║",
            "║    6️⃣ Distant     │ Far from core competency            ║",
            "║                                                           ║",
            "║  📊 MARKET ANALYSES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        terrain_icons = {
            "accessible": "🟢", "entangling": "🟡", "temporizing": "⚪",
            "narrow": "🔵", "precipitous": "🔴", "distant": "⚫"
        }
        
        for name, analysis in list(self.terrain_analyses.items())[:2]:
            icon = terrain_icons.get(analysis.terrain_type.value, "⚪")
            timing = self.assess_market_timing(analysis)
            ms = analysis.market_size
            
            lines.extend([
                f"║    {icon} {name:<25}                   ║",
                f"║       Terrain: {analysis.terrain_type.value.title():<15}           ║",
                f"║       Timing:  {timing['status']:<20}              ║",
                f"║       TAM: ${ms.tam/1e9:.0f}B │ SAM: ${ms.sam/1e9:.0f}B │ SOM: ${ms.som/1e6:.0f}M  ║",
                f"║       Growth: {ms.growth_rate:.0f}% YoY                            ║",
            ])
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Địa hình giả, binh chi trợ dã\"                       ║",
            "║    (Terrain is an aid to the army)                       ║",
            "║                                                           ║",
            "║  [🗺️ Terrain]  [⏰ Timing]  [📊 TAM/SAM]                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your battlefield!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch10 = ChapterTenTerrain("Saigon Digital Hub")
    print("🏯 Chapter 10: Địa Hình")
    print("=" * 60)
    print()
    print(ch10.format_dashboard())
