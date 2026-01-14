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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StrategicPillar(Enum):
    """Core pillars of agency strategy."""
    GROWTH = "growth"
    INNOVATION = "innovation"
    EFFICIENCY = "efficiency"
    TALENT = "talent"
    BRAND = "brand"
    PARTNERSHIPS = "partnerships"


class OKRStatus(Enum):
    """Lifecycle status of an OKR Objective."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    OFF_TRACK = "off_track"
    COMPLETED = "completed"


class InitiativeStatus(Enum):
    """Execution status of a strategic initiative."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class Vision:
    """The north star vision for the agency."""
    statement: str
    timeframe: str
    pillars: List[StrategicPillar] = field(default_factory=list)


@dataclass
class KeyResult:
    """A measurable outcome record."""
    id: str
    description: str
    target: float
    current: float = 0.0
    unit: str = ""


@dataclass
class Objective:
    """A qualitative strategic goal entity."""
    id: str
    title: str
    pillar: StrategicPillar
    owner: str
    key_results: List[KeyResult] = field(default_factory=list)
    quarter: str = ""

    def __post_init__(self):
        if not self.title or not self.owner:
            raise ValueError("Title and owner are mandatory")


class StrategyOfficer:
    """
    Strategy Management System (CSO Dashboard).
    
    Orchestrates the definition of vision, tracking of OKRs, and execution of strategic initiatives.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.vision: Optional[Vision] = None
        self.objectives: Dict[str, Objective] = {}
        logger.info(f"Strategy Officer system initialized for {agency_name}")
    
    def set_vision(
        self,
        statement: str,
        timeframe: str,
        pillars: List[StrategicPillar]
    ) -> Vision:
        """Define the primary vision for the organization."""
        self.vision = Vision(statement=statement, timeframe=timeframe, pillars=pillars)
        logger.info(f"Vision set: {statement[:50]}...")
        return self.vision
    
    def create_objective(
        self,
        title: str,
        pillar: StrategicPillar,
        owner: str
    ) -> Objective:
        """Register a new OKR objective."""
        o = Objective(
            id=f"OBJ-{uuid.uuid4().hex[:6].upper()}",
            title=title, pillar=pillar, owner=owner,
            quarter="Q1 2026"
        )
        self.objectives[o.id] = o
        logger.info(f"Objective created: {title} ({pillar.value})")
        return o
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level strategy performance data."""
        total_obj = len(self.objectives)
        total_krs = sum(len(o.key_results) for o in self.objectives.values())
        
        return {
            "objective_count": total_obj,
            "key_result_count": total_krs,
            "pillar_count": len(self.vision.pillars) if self.vision else 0
        }
    
    def format_dashboard(self) -> str:
        """Render the Strategic Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 STRATEGY OFFICER DASHBOARD{' ' * 31}║",
            f"║  {s['objective_count']} OKRs │ {s['key_result_count']} Key Results │ {s['pillar_count']} Strategic Pillars{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        if self.vision:
            lines.extend([
                "║  🌟 AGENCY VISION                                         ║",
                f"║    \"{self.vision.statement[:54]:<54}\" ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ])
            
        lines.append("║  🎯 CURRENT OBJECTIVES                                    ║")
        for o in list(self.objectives.values())[:4]:
            lines.append(f"║  🟢 {o.pillar.value.upper()[:10]:<10} │ {o.title[:25]:<25} │ {o.owner[:10]:<10} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🎯 New OKR]  [📈 Update KR]  [📊 Strategic Review] [⚙️] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Think Big!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Strategy System...")
    print("=" * 60)
    
    try:
        cso = StrategyOfficer("Saigon Digital Hub")
        # Seed
        cso.set_vision("Lead AI Transformation in SEA", "2026", [StrategicPillar.INNOVATION])
        cso.create_objective("Launch AgencyOS", StrategicPillar.INNOVATION, "Khoa")
        
        print("\n" + cso.format_dashboard())
        
    except Exception as e:
        logger.error(f"Strategy Error: {e}")
