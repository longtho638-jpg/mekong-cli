"""
🏯 Chapter 4: Hình Thế (軍形) - Positioning & Defense
=====================================================

"Bất khả thắng tại kỷ" - Make yourself unconquerable first.

Build moats, defensive positions, before attacking.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class MoatType(Enum):
    """Types of competitive moats."""
    NETWORK_EFFECT = "network_effect"        # More users = more value
    SWITCHING_COST = "switching_cost"        # Hard to leave
    BRAND = "brand"                          # Trusted name
    SCALE = "scale"                          # Cost advantage at scale
    IP = "intellectual_property"             # Patents, secrets
    DATA = "data"                            # Proprietary data
    REGULATORY = "regulatory"                # Licenses, compliance


@dataclass
class Moat:
    """A competitive moat."""
    moat_type: MoatType
    strength: int = 0  # 0-100
    description: str = ""
    time_to_replicate: int = 0  # months


@dataclass
class DefensivePosition:
    """Startup's defensive position analysis."""
    startup_name: str
    moats: List[Moat] = field(default_factory=list)
    customer_retention: float = 0  # %
    nps: int = 0
    ip_assets: int = 0
    data_advantage: str = ""
    overall_defense_score: int = 0


class ChapterFourPositioning:
    """
    Chapter 4: Hình Thế - Positioning & Defense.
    
    "Tiên vi bất khả thắng, dĩ đãi địch chi khả thắng"
    (First make yourself unconquerable, then wait for enemy's vulnerability)
    """
    
    # Scoring Thresholds
    RETENTION_THRESHOLD = 80
    RETENTION_BONUS_DIVISOR = 2
    NPS_THRESHOLD = 50
    NPS_BONUS_DIVISOR = 5
    MOAT_STRENGTH_WEAK_THRESHOLD = 50
    MOAT_STRENGTH_TARGET_THRESHOLD = 70

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.positions: Dict[str, DefensivePosition] = {}
        self._init_demo_data()
    
    def _init_demo_data(self) -> None:
        """Initialize demo data."""
        position = DefensivePosition(
            startup_name="TechVenture AI",
            moats=[
                Moat(MoatType.DATA, 80, "Proprietary training data from 50 customers", 24),
                Moat(MoatType.NETWORK_EFFECT, 60, "More users improve AI model", 18),
                Moat(MoatType.SWITCHING_COST, 70, "Deep workflow integration", 12),
            ],
            customer_retention=92.0,
            nps=72,
            ip_assets=2,
            data_advantage="100K labeled examples competitors don't have"
        )
        position.overall_defense_score = self.calculate_defense_score(position)
        self.positions["TechVenture AI"] = position
    
    def analyze_moat(self, startup_name: str) -> DefensivePosition:
        """Create moat analysis for a startup."""
        if startup_name in self.positions:
            return self.positions[startup_name]
        
        position = DefensivePosition(startup_name=startup_name)
        self.positions[startup_name] = position
        return position
    
    def add_moat(self, startup_name: str, moat: Moat) -> None:
        """Add a moat to startup's position."""
        if startup_name in self.positions:
            self.positions[startup_name].moats.append(moat)
            # Recalculate defense score
            self.positions[startup_name].overall_defense_score = \
                self.calculate_defense_score(self.positions[startup_name])
    
    def calculate_defense_score(self, position: DefensivePosition) -> int:
        """Calculate overall defense score."""
        if not position.moats:
            return 0
        
        # Average moat strength
        moat_score = sum(m.strength for m in position.moats) / len(position.moats)
        
        # Retention bonus using constants
        retention_bonus = 0
        if position.customer_retention > self.RETENTION_THRESHOLD:
            retention_bonus = (position.customer_retention - self.RETENTION_THRESHOLD) / self.RETENTION_BONUS_DIVISOR
        
        # NPS bonus using constants
        nps_bonus = 0
        if position.nps > self.NPS_THRESHOLD:
            nps_bonus = (position.nps - self.NPS_THRESHOLD) / self.NPS_BONUS_DIVISOR
        
        return min(100, int(moat_score + retention_bonus + nps_bonus))
    
    def identify_moat_gaps(self, position: DefensivePosition) -> List[str]:
        """Identify missing or weak moats."""
        gaps = []
        existing_types = {m.moat_type for m in position.moats}
        
        # Check for missing moat types
        critical_moats = [MoatType.NETWORK_EFFECT, MoatType.SWITCHING_COST, MoatType.DATA]
        for moat_type in critical_moats:
            if moat_type not in existing_types:
                gaps.append(f"❌ Missing {moat_type.value.replace('_', ' ').title()} moat")
        
        # Check for weak moats using constant
        for moat in position.moats:
            if moat.strength < self.MOAT_STRENGTH_WEAK_THRESHOLD:
                gaps.append(f"⚠️ Weak {moat.moat_type.value.replace('_', ' ').title()} moat ({moat.strength}%)")
        
        if not gaps:
            gaps.append("✅ Strong defensive position!")
        
        return gaps
    
    def build_moat_roadmap(self, position: DefensivePosition) -> List[Dict[str, Any]]:
        """Create roadmap to strengthen moats."""
        roadmap = []
        
        existing_types = {m.moat_type: m for m in position.moats}
        
        # Priority order for moats
        priorities = [
            (MoatType.SWITCHING_COST, "Deep workflow integration", 6),
            (MoatType.DATA, "Proprietary data collection", 12),
            (MoatType.NETWORK_EFFECT, "Viral features, community", 18),
            (MoatType.BRAND, "Media, thought leadership", 24),
            (MoatType.SCALE, "Unit economics at volume", 36),
        ]
        
        for moat_type, action, months in priorities:
            if moat_type not in existing_types:
                roadmap.append({
                    "moat": moat_type.value,
                    "action": action,
                    "timeline_months": months,
                    "priority": "HIGH" if moat_type in [MoatType.SWITCHING_COST, MoatType.DATA] else "MEDIUM"
                })
            elif existing_types[moat_type].strength < self.MOAT_STRENGTH_TARGET_THRESHOLD:
                roadmap.append({
                    "moat": moat_type.value,
                    "action": f"Strengthen {moat_type.value}",
                    "timeline_months": months // 2,
                    "priority": "HIGH"
                })
        
        return roadmap[:5]  # Top 5 priorities
    
    def format_dashboard(self) -> str:
        """Format Chapter 4 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 4: HÌNH THẾ (軍形)                             ║",
            "║  Positioning & Defensive Moats                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for position in list(self.positions.values())[:2]:
            lines.extend([
                f"║  🏰 {position.startup_name:<25}                ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    🛡️ Defense Score: {position.overall_defense_score}%                              ║",
                f"║    📊 Retention: {position.customer_retention}%  │  NPS: {position.nps}          ║",
                "║                                                           ║",
                "║  🏰 MOATS                                                 ║",
            ])
            
            moat_icons = {
                "network_effect": "🔗", "switching_cost": "🔒",
                "brand": "🏷️", "scale": "📈", "intellectual_property": "💡",
                "data": "📊", "regulatory": "📋"
            }
            
            for moat in position.moats:
                icon = moat_icons.get(moat.moat_type.value, "🛡️")
                bar = "█" * (moat.strength // 10) + "░" * (10 - moat.strength // 10)
                lines.append(f"║    {icon} {moat.moat_type.value.replace('_', ' ').title()[:15]:<15} {bar} {moat.strength}%  ║")
            
            # Show gaps
            gaps = self.identify_moat_gaps(position)[:3]
            if gaps:
                lines.extend([
                    "║                                                           ║",
                    "║  ⚠️ GAPS TO ADDRESS                                       ║",
                ])
                for gap in gaps:
                    lines.append(f"║    {gap:<50}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Bất khả thắng tại kỷ\"                                ║",
            "║    (Being unconquerable depends on yourself)             ║",
            "║                                                           ║",
            "║  [🏰 Moats]  [🛡️ Gaps]  [📋 Roadmap]                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Build your fortress!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch4 = ChapterFourPositioning("Saigon Digital Hub")
    print("🏯 Chapter 4: Hình Thế")
    print("=" * 60)
    print()
    print(ch4.format_dashboard())
