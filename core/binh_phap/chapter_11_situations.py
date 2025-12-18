"""
🏯 Chapter 11: Cửu Địa (九地) - 9 Situations
=============================================

"9 types of ground" - Crisis management, survival mode.

Board control, founder protection, crisis response.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class GroundType(Enum):
    """9 types of ground from Sun Tzu."""
    DISPERSIVE = "dispersive"      # Fighting in home territory
    FRONTIER = "frontier"          # Shallow penetration of enemy
    CONTENTIOUS = "contentious"    # Advantageous to both sides
    OPEN = "open"                  # Both can move freely
    INTERSECTING = "intersecting"  # Strategic crossroads
    SERIOUS = "serious"            # Deep in enemy territory
    DIFFICULT = "difficult"        # Hard to traverse
    SURROUNDED = "surrounded"      # Narrow escape routes
    DESPERATE = "desperate"        # Fight or die - no retreat


class CrisisLevel(Enum):
    """Crisis severity level."""
    GREEN = "green"        # Normal operations
    YELLOW = "yellow"      # Warning signs
    ORANGE = "orange"      # Crisis developing
    RED = "red"            # Full crisis
    BLACK = "black"        # Survival mode


@dataclass
class CrisisScenario:
    """A crisis scenario."""
    name: str
    ground_type: GroundType
    crisis_level: CrisisLevel
    triggers: List[str] = field(default_factory=list)
    response_actions: List[str] = field(default_factory=list)
    survival_probability: float = 0


@dataclass
class BoardControl:
    """Board control status."""
    total_seats: int
    founder_seats: int
    investor_seats: int
    independent_seats: int
    
    @property
    def founder_control(self) -> bool:
        return self.founder_seats > self.total_seats / 2
    
    @property
    def control_percentage(self) -> float:
        return (self.founder_seats / self.total_seats * 100) if self.total_seats > 0 else 0


class ChapterElevenSituations:
    """
    Chapter 11: Cửu Địa - 9 Situations.
    
    🛡️ FOUNDER SURVIVAL MODE
    
    "Tử địa thì chiến" (On desperate ground, fight)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.crisis_scenarios: Dict[str, CrisisScenario] = {}
        self.board_control: BoardControl = None
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Board control
        self.board_control = BoardControl(
            total_seats=5,
            founder_seats=2,
            investor_seats=2,
            independent_seats=1
        )
        
        # Crisis scenarios
        self.crisis_scenarios = {
            "runway_crisis": CrisisScenario(
                name="Runway Crisis",
                ground_type=GroundType.SERIOUS,
                crisis_level=CrisisLevel.ORANGE,
                triggers=["<6 months runway", "Failed raise", "Revenue decline"],
                response_actions=[
                    "Cut burn immediately",
                    "Renegotiate vendor contracts",
                    "Bridge financing options",
                    "M&A exploration"
                ],
                survival_probability=0.60
            ),
            "board_takeover": CrisisScenario(
                name="Board Takeover Attempt",
                ground_type=GroundType.SURROUNDED,
                crisis_level=CrisisLevel.RED,
                triggers=["Investor calls for founder removal", "Down round pressure"],
                response_actions=[
                    "Rally independent directors",
                    "Document all contributions",
                    "Legal counsel immediately",
                    "Alternative investor outreach"
                ],
                survival_probability=0.40
            ),
            "key_person_departure": CrisisScenario(
                name="Key Person Departure",
                ground_type=GroundType.DIFFICULT,
                crisis_level=CrisisLevel.YELLOW,
                triggers=["Co-founder conflict", "Key executive leaves"],
                response_actions=[
                    "Clear separation agreement",
                    "Communication to team",
                    "Rapid backfill plan",
                    "Investor communication"
                ],
                survival_probability=0.75
            ),
        }
    
    def assess_current_situation(
        self,
        runway_months: float,
        revenue_trend: str,  # "growing", "flat", "declining"
        team_morale: int,
        board_control: BoardControl
    ) -> Dict[str, Any]:
        """Assess current situation and ground type."""
        # Determine ground type
        if runway_months < 3 and revenue_trend == "declining":
            ground = GroundType.DESPERATE
            crisis = CrisisLevel.BLACK
        elif runway_months < 6 or not board_control.founder_control:
            ground = GroundType.SURROUNDED
            crisis = CrisisLevel.RED
        elif runway_months < 9 or revenue_trend == "declining":
            ground = GroundType.SERIOUS
            crisis = CrisisLevel.ORANGE
        elif runway_months < 12 or team_morale < 50:
            ground = GroundType.DIFFICULT
            crisis = CrisisLevel.YELLOW
        else:
            ground = GroundType.OPEN
            crisis = CrisisLevel.GREEN
        
        return {
            "ground_type": ground.value,
            "crisis_level": crisis.value,
            "board_control": board_control.founder_control,
            "survival_score": self._calculate_survival_score(runway_months, revenue_trend, board_control),
            "immediate_actions": self._get_immediate_actions(ground, crisis),
            "binh_phap": self._get_ground_wisdom(ground)
        }
    
    def _calculate_survival_score(
        self, runway: float, trend: str, board: BoardControl
    ) -> int:
        score = 100
        if runway < 6:
            score -= 30
        elif runway < 12:
            score -= 15
        
        if trend == "declining":
            score -= 25
        elif trend == "flat":
            score -= 10
        
        if not board.founder_control:
            score -= 20
        
        return max(0, score)
    
    def _get_immediate_actions(self, ground: GroundType, crisis: CrisisLevel) -> List[str]:
        """Get immediate actions based on situation."""
        actions = {
            GroundType.DESPERATE: [
                "🚨 All hands on deck meeting",
                "💰 Immediate cost cuts (non-essential to zero)",
                "📞 Call all friendly investors",
                "🤝 Explore M&A / acqui-hire immediately",
            ],
            GroundType.SURROUNDED: [
                "⚖️ Engage legal counsel",
                "👥 Rally board allies",
                "📊 Document all founder contributions",
                "🔄 Explore bridge financing",
            ],
            GroundType.SERIOUS: [
                "✂️ Reduce burn by 30%+",
                "🎯 Focus on core product only",
                "💵 Accelerate revenue collection",
                "🤝 Start investor conversations",
            ],
            GroundType.DIFFICULT: [
                "📋 Review all commitments",
                "👥 Address team concerns",
                "📈 Double down on what works",
            ],
        }
        return actions.get(ground, ["✅ Continue current strategy"])
    
    def _get_ground_wisdom(self, ground: GroundType) -> str:
        wisdom = {
            GroundType.DESPERATE: "Tử địa thì chiến - On desperate ground, FIGHT",
            GroundType.SURROUNDED: "Vi địa thì mưu - When surrounded, use strategy",
            GroundType.SERIOUS: "Trọng địa thì cướp - On serious ground, plunder (revenue)",
            GroundType.DIFFICULT: "Ác địa thì hành - On difficult ground, keep moving",
            GroundType.OPEN: "Giao địa thì hợp - On open ground, ally",
        }
        return wisdom.get(ground, "Biết mình biết địch")
    
    def protect_board_control(self) -> Dict[str, Any]:
        """Strategies to protect board control."""
        bc = self.board_control
        
        strategies = []
        if bc.founder_control:
            strategies.append("✅ Maintain current control")
            strategies.append("📋 Document protective provisions")
        else:
            strategies.append("🤝 Rally independent directors")
            strategies.append("📞 Negotiate with friendly investors")
            strategies.append("⚖️ Review governance documents")
        
        return {
            "current_control": bc.control_percentage,
            "founder_majority": bc.founder_control,
            "seats_breakdown": {
                "founders": bc.founder_seats,
                "investors": bc.investor_seats,
                "independent": bc.independent_seats
            },
            "protection_strategies": strategies,
            "binh_phap": "Giữ vững thành trì - Hold the fortress"
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 11 dashboard."""
        bc = self.board_control
        board_prot = self.protect_board_control()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 11: CỬU ĐỊA (九地)                             ║",
            "║  9 Situations + Founder Survival Mode 🛡️                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🗺️ THE 9 TYPES OF GROUND                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1️⃣ Dispersive   │ Home territory                     ║",
            "║    2️⃣ Frontier     │ Shallow penetration                ║",
            "║    3️⃣ Contentious  │ Valuable to both                   ║",
            "║    4️⃣ Open         │ Free movement                      ║",
            "║    5️⃣ Intersecting │ Strategic crossroads               ║",
            "║    6️⃣ Serious      │ Deep in enemy territory            ║",
            "║    7️⃣ Difficult    │ Hard to traverse                   ║",
            "║    8️⃣ Surrounded   │ Limited escape                     ║",
            "║    9️⃣ Desperate    │ Fight or die                       ║",
            "║                                                           ║",
            "║  🛡️ BOARD CONTROL STATUS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👑 Founder Seats:    {bc.founder_seats}/{bc.total_seats} ({board_prot['current_control']:.0f}%)          ║",
            f"║    💰 Investor Seats:   {bc.investor_seats}/{bc.total_seats}                        ║",
            f"║    ⚖️ Independent Seats: {bc.independent_seats}/{bc.total_seats}                        ║",
            f"║    🛡️ Founder Control:  {'✅ YES' if bc.founder_control else '❌ NO'}                      ║",
            "║                                                           ║",
            "║  🚨 CRISIS SCENARIOS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"green": "🟢", "yellow": "🟡", "orange": "🟠", "red": "🔴", "black": "⚫"}
        for name, scenario in list(self.crisis_scenarios.items())[:3]:
            icon = level_icons.get(scenario.crisis_level.value, "⚪")
            lines.append(f"║    {icon} {scenario.name:<25} │ {scenario.survival_probability*100:.0f}% survival  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Tử địa thì chiến\"                                    ║",
            "║    (On desperate ground, FIGHT)                          ║",
            "║                                                           ║",
            "║  [🛡️ Board]  [🚨 Crisis]  [💪 Survival]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Survive and thrive!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch11 = ChapterElevenSituations("Saigon Digital Hub")
    print("🏯 Chapter 11: Cửu Địa")
    print("=" * 60)
    print()
    print(ch11.format_dashboard())
