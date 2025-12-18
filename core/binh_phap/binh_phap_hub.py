"""
🏯 Binh Pháp Hub - War Room Command Center
==========================================

Central hub integrating all 13 chapters of Sun Tzu.
The ultimate startup strategy command center.

"Biết người biết ta, trăm trận trăm thắng"
知彼知己，百戰不殆

WIN-WIN-WIN Architecture:
- Agency Owner: Portfolio equity + cash flow
- Agency: Deal flow + knowledge compounding
- Startup: Strategy + protection + network
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime

# Import all chapters
from .chapter_01_planning import ChapterOnePlanning
from .chapter_02_resources import ChapterTwoResources
from .chapter_03_strategy import ChapterThreeStrategy
from .chapter_04_positioning import ChapterFourPositioning
from .chapter_05_momentum import ChapterFiveMomentum
from .chapter_06_weakness import ChapterSixWeakness
from .chapter_07_maneuvering import ChapterSevenManeuvering
from .chapter_08_adaptation import ChapterEightAdaptation
from .chapter_09_operations import ChapterNineOperations
from .chapter_10_terrain import ChapterTenTerrain
from .chapter_11_situations import ChapterElevenSituations
from .chapter_12_disruption import ChapterTwelveDisruption
from .chapter_13_intelligence import ChapterThirteenIntelligence


@dataclass
class BattleReadiness:
    """Overall battle readiness assessment."""
    startup_name: str
    overall_score: int
    chapter_scores: Dict[str, int]
    critical_issues: List[str]
    recommendations: List[str]
    readiness_level: str


class BinhPhapHub:
    """
    🏯 Binh Pháp Hub - War Room Command Center.
    
    Integrates all 13 chapters for complete startup warfare strategy.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize all 13 chapters
        self.ch1_planning = ChapterOnePlanning(agency_name)
        self.ch2_resources = ChapterTwoResources(agency_name)
        self.ch3_strategy = ChapterThreeStrategy(agency_name)
        self.ch4_positioning = ChapterFourPositioning(agency_name)
        self.ch5_momentum = ChapterFiveMomentum(agency_name)
        self.ch6_weakness = ChapterSixWeakness(agency_name)
        self.ch7_maneuvering = ChapterSevenManeuvering(agency_name)
        self.ch8_adaptation = ChapterEightAdaptation(agency_name)
        self.ch9_operations = ChapterNineOperations(agency_name)
        self.ch10_terrain = ChapterTenTerrain(agency_name)
        self.ch11_situations = ChapterElevenSituations(agency_name)
        self.ch12_disruption = ChapterTwelveDisruption(agency_name)
        self.ch13_intelligence = ChapterThirteenIntelligence(agency_name)
        
        # Chapter registry
        self.chapters = {
            "01_planning": self.ch1_planning,
            "02_resources": self.ch2_resources,
            "03_strategy": self.ch3_strategy,
            "04_positioning": self.ch4_positioning,
            "05_momentum": self.ch5_momentum,
            "06_weakness": self.ch6_weakness,
            "07_maneuvering": self.ch7_maneuvering,
            "08_adaptation": self.ch8_adaptation,
            "09_operations": self.ch9_operations,
            "10_terrain": self.ch10_terrain,
            "11_situations": self.ch11_situations,
            "12_disruption": self.ch12_disruption,
            "13_intelligence": self.ch13_intelligence,
        }
    
    def assess_battle_readiness(self, startup_name: str) -> BattleReadiness:
        """Comprehensive battle readiness assessment."""
        scores = {}
        issues = []
        recs = []
        
        # Chapter 1: Planning
        if self.ch1_planning.assessments:
            assessment = list(self.ch1_planning.assessments.values())[0]
            scores["planning"] = assessment.battle_score
            if assessment.battle_score < 60:
                issues.append("❌ Planning incomplete")
                recs.extend(self.ch1_planning.get_recommendations(assessment))
        else:
            scores["planning"] = 50
        
        # Chapter 2: Resources
        if self.ch2_resources.war_chests:
            wc = list(self.ch2_resources.war_chests.values())[0]
            runway = wc.runway_months
            scores["resources"] = min(100, int(runway * 8))
            if runway < 6:
                issues.append(f"🚨 Low runway: {runway:.1f} months")
        else:
            scores["resources"] = 50
        
        # Chapter 3: Strategy
        active_alliances = [a for a in self.ch3_strategy.alliances.values() 
                          if a.status == "active"]
        scores["strategy"] = min(100, len(active_alliances) * 25)
        if len(active_alliances) < 2:
            issues.append("⚠️ Few strategic alliances")
        
        # Chapter 4: Positioning
        if self.ch4_positioning.positions:
            pos = list(self.ch4_positioning.positions.values())[0]
            scores["positioning"] = pos.overall_defense_score
            if pos.overall_defense_score < 60:
                issues.append("⚠️ Weak competitive moats")
        else:
            scores["positioning"] = 50
        
        # Chapter 5: Momentum
        momentum = self.ch5_momentum.analyze_momentum("TechVenture")
        if "error" not in momentum:
            scores["momentum"] = min(100, max(0, int(momentum["avg_growth_rate"] * 3)))
        else:
            scores["momentum"] = 50
        
        # Chapter 6: Shield
        scores["shield"] = 75  # Default protected
        
        # Chapter 7: Speed
        speed = self.ch7_maneuvering.assess_speed()
        scores["speed"] = int(speed["speed_score"])
        
        # Chapter 8: Adaptation
        scores["adaptation"] = 70  # Default flexible
        
        # Chapter 9: Operations
        execution = self.ch9_operations.assess_execution()
        scores["operations"] = int(execution["execution_score"])
        warnings = self.ch9_operations.detect_early_warnings()
        for w in warnings:
            if "🚨" in w or "⚠️" in w:
                issues.append(w)
        
        # Chapter 10: Terrain
        scores["terrain"] = 70  # Default assessed
        
        # Chapter 11: Situations
        bc = self.ch11_situations.board_control
        scores["situations"] = 80 if bc.founder_control else 40
        if not bc.founder_control:
            issues.append("🚨 Founder does not control board")
        
        # Chapter 12: Disruption
        scores["disruption"] = 60  # Default moderate
        
        # Chapter 13: Intelligence
        intel_count = len(self.ch13_intelligence.intel_reports)
        scores["intelligence"] = min(100, intel_count * 30)
        
        # Calculate overall score
        overall = sum(scores.values()) / len(scores)
        
        # Determine readiness level
        if overall >= 80:
            level = "🟢 BATTLE READY"
        elif overall >= 60:
            level = "🟡 PREPARING"
        elif overall >= 40:
            level = "🟠 NOT READY"
        else:
            level = "🔴 CRITICAL"
        
        return BattleReadiness(
            startup_name=startup_name,
            overall_score=int(overall),
            chapter_scores=scores,
            critical_issues=issues[:5],
            recommendations=recs[:5],
            readiness_level=level
        )
    
    def get_hub_stats(self) -> Dict[str, Any]:
        """Get hub statistics."""
        return {
            "total_chapters": 13,
            "agency": self.agency_name,
            "version": "1.0.0",
            "philosophy": "Không đánh mà thắng",
        }
    
    def format_dashboard(self) -> str:
        """Format the War Room dashboard."""
        readiness = self.assess_battle_readiness("Demo Startup")
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 BINH PHÁP HUB - WAR ROOM COMMAND CENTER               ║",
            f"║  {self.agency_name:<45}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ⚔️ BATTLE READINESS: {readiness.overall_score}% {readiness.readiness_level:<18}  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║                                                           ║",
            "║  📚 13 CHAPTERS OF BINH PHÁP                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        chapter_names = [
            ("1️⃣ Kế Hoạch", "planning", "Assessment & SWOT"),
            ("2️⃣ Tác Chiến", "resources", "Runway & Burn"),
            ("3️⃣ Mưu Công", "strategy", "Win Without Fighting"),
            ("4️⃣ Hình Thế", "positioning", "Moats & Defense"),
            ("5️⃣ Thế Trận", "momentum", "Network Effects"),
            ("6️⃣ Hư Thực", "shield", "Anti-Dilution 🛡️"),
            ("7️⃣ Quân Tranh", "speed", "Speed & Agility"),
            ("8️⃣ Cửu Biến", "adaptation", "Pivot & Exit"),
            ("9️⃣ Hành Quân", "operations", "OKRs & Execution"),
            ("🔟 Địa Hình", "terrain", "Market & Timing"),
            ("1️⃣1️⃣ Cửu Địa", "situations", "Crisis & Survival"),
            ("1️⃣2️⃣ Hỏa Công", "disruption", "Disruption"),
            ("1️⃣3️⃣ Dụng Gián", "intelligence", "Intel & Research"),
        ]
        
        for name, key, desc in chapter_names:
            score = readiness.chapter_scores.get(key, 50)
            status = "🟢" if score >= 70 else "🟡" if score >= 50 else "🔴"
            lines.append(f"║    {status} {name:<12} │ {desc:<22} {score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚨 CRITICAL ISSUES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for issue in readiness.critical_issues[:3]:
            lines.append(f"║    {issue[:50]:<50}  ║")
        
        if not readiness.critical_issues:
            lines.append("║    ✅ No critical issues                               ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 CORE WISDOM                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Biết người biết ta, trăm trận trăm thắng\"            ║",
            "║    知彼知己，百戰不殆                                     ║",
            "║    (Know enemy, know self - 100 battles, 100 wins)       ║",
            "║                                                           ║",
            "║  [📊 Assess]  [🛡️ Shield]  [📚 Chapters]  [💰 Revenue]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Không đánh mà thắng!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = BinhPhapHub("Saigon Digital Hub")
    
    print("🏯 BINH PHÁP HUB - WAR ROOM")
    print("=" * 60)
    print()
    
    print(hub.format_dashboard())
