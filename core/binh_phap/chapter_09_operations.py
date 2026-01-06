"""
🏯 Chapter 9: Hành Quân (行軍) - Operations & Execution
======================================================

"Quan sát địch, giữ vững quân"

OKRs, team morale, execution excellence.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class OKRStatus(Enum):
    """OKR status."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BEHIND = "behind"
    COMPLETED = "completed"


class MoraleLevel(Enum):
    """Team morale level."""
    EXCELLENT = "excellent"
    GOOD = "good"
    MODERATE = "moderate"
    LOW = "low"
    CRITICAL = "critical"


@dataclass
class KeyResult:
    """A key result within an OKR."""
    description: str
    target: float
    current: float
    unit: str = ""
    
    @property
    def progress(self) -> float:
        return (self.current / self.target * 100) if self.target > 0 else 0


@dataclass
class Objective:
    """An objective with key results."""
    name: str
    key_results: List[KeyResult] = field(default_factory=list)
    owner: str = ""
    quarter: str = ""
    
    @property
    def overall_progress(self) -> float:
        if not self.key_results:
            return 0
        return sum(kr.progress for kr in self.key_results) / len(self.key_results)
    
    @property
    def status(self) -> OKRStatus:
        progress = self.overall_progress
        if progress >= 100:
            return OKRStatus.COMPLETED
        elif progress >= 70:
            return OKRStatus.ON_TRACK
        elif progress >= 40:
            return OKRStatus.AT_RISK
        return OKRStatus.BEHIND


@dataclass
class TeamMorale:
    """Team morale tracking."""
    date: datetime
    score: int  # 0-100
    survey_participation: float
    top_concerns: List[str] = field(default_factory=list)
    highlights: List[str] = field(default_factory=list)


class ChapterNineOperations:
    """
    Chapter 9: Hành Quân - Operations & Execution.
    
    "Phàm quân tại ngoại, yếu ở chỗ quan sát"
    (An army abroad requires careful observation)
    """
    
    # OKR Progress Thresholds
    OKR_COMPLETED_THRESHOLD = 100
    OKR_ON_TRACK_THRESHOLD = 70
    OKR_AT_RISK_THRESHOLD = 40
    
    # Execution Score Weightings
    OKR_WEIGHT = 0.6
    MORALE_WEIGHT = 0.4
    
    # Execution Health Classification
    HEALTH_EXCELLENT_THRESHOLD = 80
    HEALTH_GOOD_THRESHOLD = 60
    HEALTH_IMPROVEMENT_THRESHOLD = 40
    
    # Morale Warning Thresholds
    MORALE_CRITICAL_THRESHOLD = 50
    MORALE_LOW_THRESHOLD = 65
    PARTICIPATION_WARNING_THRESHOLD = 0.7

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.objectives: List[Objective] = []
        self.morale_history: List[TeamMorale] = []
        self._init_demo_data()
    
    def _init_demo_data(self) -> None:
        """Initialize demo data."""
        # Sample OKRs
        self.objectives = [
            Objective(
                name="Achieve Product-Market Fit",
                key_results=[
                    KeyResult("NPS score", 70, 65, "score"),
                    KeyResult("Weekly active users", 1000, 850, "users"),
                    KeyResult("Churn rate below", 5, 6.2, "%"),
                ],
                owner="CEO",
                quarter="Q1 2025"
            ),
            Objective(
                name="Scale Revenue",
                key_results=[
                    KeyResult("MRR", 150_000, 130_000, "$"),
                    KeyResult("New customers", 50, 42, "customers"),
                    KeyResult("Expansion revenue", 20, 15, "%"),
                ],
                owner="CRO",
                quarter="Q1 2025"
            ),
            Objective(
                name="Build World-Class Team",
                key_results=[
                    KeyResult("Team size", 20, 18, "people"),
                    KeyResult("eNPS score", 60, 55, "score"),
                    KeyResult("Attrition below", 10, 8, "%"),
                ],
                owner="Head of People",
                quarter="Q1 2025"
            ),
        ]
        
        # Sample morale
        self.morale_history.append(TeamMorale(
            date=datetime.now(),
            score=72,
            survey_participation=0.85,
            top_concerns=["Workload balance", "Career growth", "Communication"],
            highlights=["Strong mission alignment", "Great team culture", "Learning opportunities"]
        ))
    
    def get_okr_summary(self) -> Dict[str, Any]:
        """Get OKR summary."""
        if not self.objectives:
            return {"total": 0, "avg_progress": 0, "by_status": {}, "on_track": 0}
        
        total = len(self.objectives)
        avg_progress = sum(o.overall_progress for o in self.objectives) / total
        
        by_status = {}
        for obj in self.objectives:
            # Objective.status uses the thresholds internally
            status = obj.status.value
            by_status[status] = by_status.get(status, 0) + 1
        
        return {
            "total": total,
            "avg_progress": avg_progress,
            "by_status": by_status,
            "on_track": by_status.get(OKRStatus.ON_TRACK.value, 0) + by_status.get(OKRStatus.COMPLETED.value, 0),
        }
    
    def assess_execution(self) -> Dict[str, Any]:
        """Assess overall execution health."""
        okr_summary = self.get_okr_summary()
        latest_morale = self.morale_history[-1] if self.morale_history else None
        
        # Execution score using weightings
        okr_score = okr_summary["avg_progress"]
        morale_score = latest_morale.score if latest_morale else self.MORALE_CRITICAL_THRESHOLD
        
        execution_score = (okr_score * self.OKR_WEIGHT + morale_score * self.MORALE_WEIGHT)
        
        # Health classification using thresholds
        if execution_score >= self.HEALTH_EXCELLENT_THRESHOLD:
            health = "🟢 EXCELLENT"
        elif execution_score >= self.HEALTH_GOOD_THRESHOLD:
            health = "🟡 GOOD"
        elif execution_score >= self.HEALTH_IMPROVEMENT_THRESHOLD:
            health = "🟠 NEEDS IMPROVEMENT"
        else:
            health = "🔴 CRITICAL"
        
        return {
            "execution_score": execution_score,
            "health": health,
            "okr_progress": okr_summary["avg_progress"],
            "team_morale": morale_score,
            "binh_phap": "Hành quân - march with discipline"
        }
    
    def detect_early_warnings(self) -> List[str]:
        """Detect early warning signals in operations."""
        warnings = []
        
        # Check OKR health
        for obj in self.objectives:
            if obj.status == OKRStatus.BEHIND:
                warnings.append(f"🚨 OKR '{obj.name}' is BEHIND ({obj.overall_progress:.0f}%)")
            elif obj.status == OKRStatus.AT_RISK:
                warnings.append(f"⚠️ OKR '{obj.name}' is AT RISK ({obj.overall_progress:.0f}%)")
        
        # Check morale using thresholds
        if self.morale_history:
            latest = self.morale_history[-1]
            if latest.score < self.MORALE_CRITICAL_THRESHOLD:
                warnings.append(f"🚨 Team morale CRITICAL ({latest.score}%)")
            elif latest.score < self.MORALE_LOW_THRESHOLD:
                warnings.append(f"⚠️ Team morale LOW ({latest.score}%)")
            
            if latest.survey_participation < self.PARTICIPATION_WARNING_THRESHOLD:
                warnings.append(f"⚠️ Low survey participation ({latest.survey_participation*100:.0f}%) - disengagement risk")
        
        if not warnings:
            warnings.append("✅ Operations running smoothly")
        
        return warnings
    
    def format_dashboard(self) -> str:
        """Format Chapter 9 dashboard."""
        execution = self.assess_execution()
        okr_summary = self.get_okr_summary()
        warnings = self.detect_early_warnings()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 9: HÀNH QUÂN (行軍)                            ║",
            "║  Operations, OKRs & Team Execution                        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 EXECUTION SCORE: {execution['execution_score']:.0f}% {execution['health']:<15}  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 OKR Progress:    {execution['okr_progress']:.0f}%                           ║",
            f"║    😊 Team Morale:     {execution['team_morale']:.0f}%                           ║",
            "║                                                           ║",
            "║  🎯 OBJECTIVES                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"on_track": "🟢", "at_risk": "🟡", "behind": "🔴", "completed": "✅"}
        for obj in self.objectives[:4]:
            icon = status_icons.get(obj.status.value, "⚪")
            lines.append(f"║    {icon} {obj.name[:30]:<30} {obj.overall_progress:.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ EARLY WARNINGS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for warning in warnings[:3]:
            lines.append(f"║    {warning[:50]:<50}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Phàm quân tại ngoại, yếu ở chỗ quan sát\"             ║",
            "║    (An army abroad requires careful observation)         ║",
            "║                                                           ║",
            "║  [📋 OKRs]  [😊 Morale]  [⚠️ Warnings]                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Execute with precision!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch9 = ChapterNineOperations("Saigon Digital Hub")
    print("🏯 Chapter 9: Hành Quân")
    print("=" * 60)
    print()
    print(ch9.format_dashboard())
