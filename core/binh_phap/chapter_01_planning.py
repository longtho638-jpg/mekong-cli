"""
🏯 Chapter 1: Kế Hoạch (始計) - Strategic Planning
==================================================

"Tôi biết cách thắng, nhưng không bắt buộc phải thắng"

The foundation of all strategy - assess before battle.
Ngũ Sự (5 Factors) + Thất Kế (7 Calculations)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class ReadinessLevel(Enum):
    """Battle readiness level."""
    NOT_READY = "not_ready"
    PREPARING = "preparing"
    READY = "ready"
    BATTLE_READY = "battle_ready"


@dataclass
class NguSu:
    """Ngũ Sự - 5 Fundamental Factors."""
    dao: int = 0      # Đạo - Moral alignment, team unity
    thien: int = 0    # Thiên - Timing, market conditions
    dia: int = 0      # Địa - Terrain, market position
    tuong: int = 0    # Tướng - Leadership capability
    phap: int = 0     # Pháp - Method, systems & processes
    
    def total_score(self) -> int:
        return self.dao + self.thien + self.dia + self.tuong + self.phap
    
    def max_score(self) -> int:
        return 500  # 5 factors × 100 max


@dataclass
class ThatKe:
    """Thất Kế - 7 Strategic Questions."""
    # Compare self vs competitor
    which_leader_has_moral_law: str = ""      # Ai có Đạo?
    which_general_has_ability: str = ""        # Tướng ai có năng lực?
    which_army_has_heaven_earth: str = ""      # Ai có lợi thế thời cơ?
    which_side_has_discipline: str = ""        # Ai có kỷ luật?
    which_army_is_stronger: str = ""           # Quân ai mạnh hơn?
    which_officers_are_trained: str = ""       # Ai có đội ngũ tốt hơn?
    which_has_rewards_punishments: str = ""    # Ai thưởng phạt công minh?


@dataclass
class BattleAssessment:
    """Complete battle assessment."""
    id: str
    startup_name: str
    created_at: datetime
    ngu_su: NguSu
    that_ke: ThatKe
    swot: Dict[str, List[str]] = field(default_factory=dict)
    readiness_level: ReadinessLevel = ReadinessLevel.NOT_READY
    battle_score: int = 0
    notes: str = ""


class ChapterOnePlanning:
    """
    Chapter 1: Kế Hoạch - Strategic Planning.
    
    "Binh giả, quốc chi đại sự, tử sinh chi địa,
    tồn vong chi đạo, bất khả bất sát dã"
    
    (War is a matter of life and death - must be studied carefully)
    """
    
    # Scoring Weights
    MAX_FACTOR_SCORE = 100
    SWOT_STRENGTH_BONUS = 3
    SWOT_WEAKNESS_PENALTY = 2
    SWOT_OPPORTUNITY_BONUS = 2
    SWOT_THREAT_PENALTY = 2

    # Readiness Thresholds
    THRESHOLD_BATTLE_READY = 80
    THRESHOLD_READY = 60
    THRESHOLD_PREPARING = 40

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assessments: Dict[str, BattleAssessment] = {}
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo assessment."""
        assessment = self.create_assessment("TechVenture AI")
        assessment.ngu_su = NguSu(
            dao=85,    # Strong team alignment
            thien=70,  # Good timing (AI boom)
            dia=60,    # Competitive market
            tuong=80,  # Strong founder
            phap=65    # Still building processes
        )
        assessment.swot = {
            "strengths": ["Strong AI tech", "Experienced founder", "Early traction"],
            "weaknesses": ["Limited runway", "Small team", "No sales leader"],
            "opportunities": ["AI market growth", "Enterprise demand", "Partnership offers"],
            "threats": ["Big tech competition", "Talent war", "Regulation risk"]
        }
        assessment.battle_score = self.calculate_battle_score(assessment)
        assessment.readiness_level = self._determine_readiness(assessment.battle_score)
    
    def create_assessment(self, startup_name: str) -> BattleAssessment:
        """Create new battle assessment."""
        assessment = BattleAssessment(
            id=f"BA-{uuid.uuid4().hex[:6].upper()}",
            startup_name=startup_name,
            created_at=datetime.now(),
            ngu_su=NguSu(),
            that_ke=ThatKe()
        )
        self.assessments[assessment.id] = assessment
        return assessment
    
    def assess_ngu_su(
        self,
        assessment_id: str,
        dao: int, thien: int, dia: int, tuong: int, phap: int
    ):
        """Assess the 5 fundamental factors."""
        if assessment_id in self.assessments:
            self.assessments[assessment_id].ngu_su = NguSu(
                dao=min(self.MAX_FACTOR_SCORE, max(0, dao)),
                thien=min(self.MAX_FACTOR_SCORE, max(0, thien)),
                dia=min(self.MAX_FACTOR_SCORE, max(0, dia)),
                tuong=min(self.MAX_FACTOR_SCORE, max(0, tuong)),
                phap=min(self.MAX_FACTOR_SCORE, max(0, phap))
            )
    
    def calculate_battle_score(self, assessment: BattleAssessment) -> int:
        """Calculate overall battle readiness score."""
        ngu_su_score = assessment.ngu_su.total_score() / 5  # Average of 5 factors
        
        # SWOT bonus/penalty
        swot = assessment.swot
        strength_bonus = len(swot.get("strengths", [])) * self.SWOT_STRENGTH_BONUS
        weakness_penalty = len(swot.get("weaknesses", [])) * self.SWOT_WEAKNESS_PENALTY
        opportunity_bonus = len(swot.get("opportunities", [])) * self.SWOT_OPPORTUNITY_BONUS
        threat_penalty = len(swot.get("threats", [])) * self.SWOT_THREAT_PENALTY
        
        swot_adjustment = strength_bonus + opportunity_bonus - weakness_penalty - threat_penalty
        
        return min(100, max(0, int(ngu_su_score + swot_adjustment)))
    
    def _determine_readiness(self, score: int) -> ReadinessLevel:
        """Determine readiness level from score."""
        if score >= self.THRESHOLD_BATTLE_READY:
            return ReadinessLevel.BATTLE_READY
        elif score >= self.THRESHOLD_READY:
            return ReadinessLevel.READY
        elif score >= self.THRESHOLD_PREPARING:
            return ReadinessLevel.PREPARING
        return ReadinessLevel.NOT_READY
    
    def get_recommendations(self, assessment: BattleAssessment) -> List[str]:
        """Get strategic recommendations based on assessment."""
        recs = []
        ngu_su = assessment.ngu_su
        
        if ngu_su.dao < 70:
            recs.append("🎯 ĐẠO: Strengthen team alignment and mission clarity")
        if ngu_su.thien < 70:
            recs.append("⏰ THIÊN: Improve market timing - consider pivoting or waiting")
        if ngu_su.dia < 70:
            recs.append("🗺️ ĐỊA: Better position in market - find your niche")
        if ngu_su.tuong < 70:
            recs.append("👑 TƯỚNG: Strengthen leadership - coaching or co-founder")
        if ngu_su.phap < 70:
            recs.append("⚙️ PHÁP: Build better systems and processes")
        
        if not recs:
            recs.append("✅ All factors strong - proceed to battle!")
        
        return recs
    
    def format_dashboard(self) -> str:
        """Format Chapter 1 dashboard."""
        total = len(self.assessments)
        ready_count = sum(1 for a in self.assessments.values() 
                        if a.readiness_level == ReadinessLevel.BATTLE_READY)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 1: KẾ HOẠCH (始計)                             ║",
            "║  Strategic Assessment & Planning                          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 ASSESSMENTS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Total Assessments:    {total:>8}                    ║",
            f"║    ⚔️ Battle Ready:         {ready_count:>8}                    ║",
            "║                                                           ║",
            "║  🎯 NGŨ SỰ - 5 FUNDAMENTAL FACTORS                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for assessment in list(self.assessments.values())[:2]:
            ngu_su = assessment.ngu_su
            lines.append(f"║    📊 {assessment.startup_name:<20}                  ║")
            lines.append(f"║       🎯 Đạo (Alignment):  {'█' * (ngu_su.dao // 10)}{'░' * (10 - ngu_su.dao // 10)} {ngu_su.dao}%  ║")
            lines.append(f"║       ⏰ Thiên (Timing):   {'█' * (ngu_su.thien // 10)}{'░' * (10 - ngu_su.thien // 10)} {ngu_su.thien}%  ║")
            lines.append(f"║       🗺️ Địa (Position):   {'█' * (ngu_su.dia // 10)}{'░' * (10 - ngu_su.dia // 10)} {ngu_su.dia}%  ║")
            lines.append(f"║       👑 Tướng (Leader):   {'█' * (ngu_su.tuong // 10)}{'░' * (10 - ngu_su.tuong // 10)} {ngu_su.tuong}%  ║")
            lines.append(f"║       ⚙️ Pháp (Method):    {'█' * (ngu_su.phap // 10)}{'░' * (10 - ngu_su.phap // 10)} {ngu_su.phap}%  ║")
            lines.append(f"║       ⚔️ Battle Score: {assessment.battle_score}%                           ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Binh giả, quốc chi đại sự\"                           ║",
            "║    (War is a matter of vital importance)                 ║",
            "║                                                           ║",
            "║  [📊 Assess]  [📈 Compare]  [📋 Report]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know before you go!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch1 = ChapterOnePlanning("Saigon Digital Hub")
    print("🏯 Chapter 1: Kế Hoạch")
    print("=" * 60)
    print()
    print(ch1.format_dashboard())
