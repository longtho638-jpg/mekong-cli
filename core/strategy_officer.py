"""
🎯 Strategy Officer - Vision & Direction
==========================================

Define and execute agency strategy.
Think big, act smart!

Roles:
- Vision setting
- Strategic planning
- OKRs management
- Competitive analysis
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class StrategicPillar(Enum):
    """Strategic pillars."""
    GROWTH = "growth"
    INNOVATION = "innovation"
    EFFICIENCY = "efficiency"
    TALENT = "talent"
    BRAND = "brand"
    PARTNERSHIPS = "partnerships"


class OKRStatus(Enum):
    """OKR status."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    OFF_TRACK = "off_track"
    COMPLETED = "completed"


class InitiativeStatus(Enum):
    """Initiative status."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class Vision:
    """Company vision."""
    statement: str
    timeframe: str  # e.g., "2025", "5 years"
    pillars: List[StrategicPillar] = field(default_factory=list)


@dataclass
class Objective:
    """An OKR Objective."""
    id: str
    title: str
    pillar: StrategicPillar
    owner: str
    key_results: List['KeyResult'] = field(default_factory=list)
    quarter: str = ""  # e.g., "Q1 2024"


@dataclass
class KeyResult:
    """A Key Result."""
    id: str
    description: str
    target: float
    current: float = 0
    unit: str = ""


@dataclass
class StrategicInitiative:
    """A strategic initiative."""
    id: str
    title: str
    pillar: StrategicPillar
    status: InitiativeStatus = InitiativeStatus.PLANNING
    budget: float = 0
    impact_score: int = 0  # 1-10
    owner: str = ""


class StrategyOfficer:
    """
    Chief Strategy Officer.
    
    Define direction.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.vision: Optional[Vision] = None
        self.objectives: Dict[str, Objective] = {}
        self.initiatives: Dict[str, StrategicInitiative] = {}
    
    def set_vision(
        self,
        statement: str,
        timeframe: str,
        pillars: List[StrategicPillar]
    ) -> Vision:
        """Set company vision."""
        self.vision = Vision(
            statement=statement,
            timeframe=timeframe,
            pillars=pillars
        )
        return self.vision
    
    def create_objective(
        self,
        title: str,
        pillar: StrategicPillar,
        owner: str,
        quarter: str = ""
    ) -> Objective:
        """Create an OKR objective."""
        obj = Objective(
            id=f"OBJ-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            pillar=pillar,
            owner=owner,
            quarter=quarter or datetime.now().strftime("Q%q %Y").replace("Q%q", f"Q{(datetime.now().month-1)//3+1}")
        )
        self.objectives[obj.id] = obj
        return obj
    
    def add_key_result(
        self,
        obj: Objective,
        description: str,
        target: float,
        unit: str = ""
    ) -> KeyResult:
        """Add a key result."""
        kr = KeyResult(
            id=f"KR-{uuid.uuid4().hex[:6].upper()}",
            description=description,
            target=target,
            unit=unit
        )
        obj.key_results.append(kr)
        return kr
    
    def update_key_result(self, kr: KeyResult, current: float):
        """Update key result progress."""
        kr.current = current
    
    def create_initiative(
        self,
        title: str,
        pillar: StrategicPillar,
        budget: float = 0,
        impact: int = 5,
        owner: str = ""
    ) -> StrategicInitiative:
        """Create a strategic initiative."""
        init = StrategicInitiative(
            id=f"INI-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            pillar=pillar,
            budget=budget,
            impact_score=impact,
            owner=owner
        )
        self.initiatives[init.id] = init
        return init
    
    def update_initiative_status(self, init: StrategicInitiative, status: InitiativeStatus):
        """Update initiative status."""
        init.status = status
    
    def get_okr_health(self, obj: Objective) -> OKRStatus:
        """Get OKR health status."""
        if not obj.key_results:
            return OKRStatus.ON_TRACK
        
        avg_progress = sum(kr.current / kr.target * 100 if kr.target else 0 for kr in obj.key_results) / len(obj.key_results)
        
        if avg_progress >= 100:
            return OKRStatus.COMPLETED
        elif avg_progress >= 70:
            return OKRStatus.ON_TRACK
        elif avg_progress >= 40:
            return OKRStatus.AT_RISK
        else:
            return OKRStatus.OFF_TRACK
    
    def get_stats(self) -> Dict[str, Any]:
        """Get strategy statistics."""
        total_krs = sum(len(o.key_results) for o in self.objectives.values())
        avg_progress = sum(kr.current / kr.target * 100 if kr.target else 0 
                         for o in self.objectives.values() for kr in o.key_results) / total_krs if total_krs else 0
        
        by_pillar = {}
        for pillar in StrategicPillar:
            by_pillar[pillar.value] = sum(1 for i in self.initiatives.values() if i.pillar == pillar)
        
        return {
            "objectives": len(self.objectives),
            "key_results": total_krs,
            "avg_progress": avg_progress,
            "initiatives": len(self.initiatives),
            "by_pillar": by_pillar,
            "total_budget": sum(i.budget for i in self.initiatives.values())
        }
    
    def format_dashboard(self) -> str:
        """Format strategy officer dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 STRATEGY OFFICER                                      ║",
            f"║  {stats['objectives']} OKRs │ {stats['avg_progress']:.0f}% progress │ ${stats['total_budget']:,.0f} budget  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        if self.vision:
            lines.extend([
                "║  🌟 VISION                                                ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    \"{self.vision.statement[:48]}\"  ║",
                f"║    📅 {self.vision.timeframe:<52}  ║",
                "║                                                           ║",
            ])
        
        lines.extend([
            "║  🎯 OBJECTIVES (OKRs)                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"on_track": "🟢", "at_risk": "🟡", "off_track": "🔴", "completed": "✅"}
        pillar_icons = {"growth": "📈", "innovation": "💡", "efficiency": "⚡",
                       "talent": "👥", "brand": "🎨", "partnerships": "🤝"}
        
        for obj in list(self.objectives.values())[:4]:
            health = self.get_okr_health(obj)
            s_icon = status_icons.get(health.value, "⚪")
            p_icon = pillar_icons.get(obj.pillar.value, "🎯")
            
            krs_done = sum(1 for kr in obj.key_results if kr.current >= kr.target)
            lines.append(f"║  {s_icon} {p_icon} {obj.title[:22]:<22} │ {krs_done}/{len(obj.key_results)} KRs │ {obj.owner[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚡ STRATEGIC INITIATIVES                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        init_icons = {"planning": "📋", "in_progress": "🔄", "completed": "✅", "paused": "⏸️"}
        
        for init in sorted(list(self.initiatives.values()), key=lambda x: x.impact_score, reverse=True)[:4]:
            s_icon = init_icons.get(init.status.value, "⚪")
            p_icon = pillar_icons.get(init.pillar.value, "🎯")
            impact_bar = "★" * init.impact_score + "☆" * (10 - init.impact_score)
            
            lines.append(f"║  {s_icon} {p_icon} {init.title[:22]:<22} │ ${init.budget:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY PILLAR                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for pillar in list(StrategicPillar)[:4]:
            count = stats['by_pillar'].get(pillar.value, 0)
            icon = pillar_icons.get(pillar.value, "📊")
            lines.append(f"║    {icon} {pillar.value.title():<12} │ {count:>2} initiatives              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🎯 OKRs]  [⚡ Initiatives]  [📊 Review]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Think big, act smart!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cso = StrategyOfficer("Saigon Digital Hub")
    
    print("🎯 Strategy Officer")
    print("=" * 60)
    print()
    
    cso.set_vision(
        "Become Southeast Asia's leading AI-powered digital agency",
        "2026",
        [StrategicPillar.GROWTH, StrategicPillar.INNOVATION, StrategicPillar.TALENT]
    )
    
    o1 = cso.create_objective("Scale to $1M ARR", StrategicPillar.GROWTH, "Khoa", "Q1 2024")
    kr1 = cso.add_key_result(o1, "Reach 50 active clients", 50, "clients")
    kr2 = cso.add_key_result(o1, "Average deal size $20K", 20000, "$")
    cso.update_key_result(kr1, 35)
    cso.update_key_result(kr2, 15000)
    
    o2 = cso.create_objective("Build AI capabilities", StrategicPillar.INNOVATION, "Alex")
    kr3 = cso.add_key_result(o2, "Launch 3 AI products", 3, "products")
    cso.update_key_result(kr3, 2)
    
    i1 = cso.create_initiative("AgencyOS Platform", StrategicPillar.INNOVATION, 50000, 9, "Khoa")
    i2 = cso.create_initiative("Talent Academy", StrategicPillar.TALENT, 20000, 7, "Sarah")
    cso.update_initiative_status(i1, InitiativeStatus.IN_PROGRESS)
    
    print(cso.format_dashboard())
