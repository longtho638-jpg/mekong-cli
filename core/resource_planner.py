"""
📅 Resource Planner - Team Resource Management
================================================

Plan and allocate team resources efficiently.
Right people, right projects!

Features:
- Resource allocation tracking
- Utilization optimization
- Skill-based matching
- Capacity forecasting
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

class Skill(Enum):
    """Core competencies within the agency team."""
    SEO = "seo"
    PPC = "ppc"
    CONTENT = "content"
    DESIGN = "design"
    DEV = "dev"
    STRATEGY = "strategy"


class AllocationStatus(Enum):
    """Categorization of individual resource load."""
    AVAILABLE = "available"
    PARTIALLY = "partially"
    BOOKED = "booked"
    OVERBOOKED = "overbooked"


@dataclass
class TeamMember:
    """An agency team member entity record."""
    id: str
    name: str
    role: str
    skills: List[Skill]
    weekly_hours: float = 40.0
    allocated_hours: float = 0.0
    hourly_rate: float = 50.0

    def __post_init__(self):
        if not self.name or not self.role:
            raise ValueError("Name and role are mandatory")


@dataclass
class ResourceAllocation:
    """A project assignment record entity."""
    id: str
    member_id: str
    project_name: str
    hours: float
    start_date: datetime = field(default_factory=datetime.now)
    end_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(weeks=1))


class ResourcePlanner:
    """
    Resource Planning System.
    
    Orchestrates team availability, project assignments, and aggregate capacity management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.members: Dict[str, TeamMember] = {}
        self.allocations: List[ResourceAllocation] = []
        logger.info(f"Resource Planner initialized for {agency_name}")
    
    def add_team_member(
        self,
        name: str,
        role: str,
        skills: List[Skill],
        hours: float = 40.0
    ) -> TeamMember:
        """Register a new member in the workforce database."""
        m = TeamMember(
            id=f"TM-{uuid.uuid4().hex[:6].upper()}",
            name=name, role=role, skills=skills, weekly_hours=hours
        )
        self.members[m.id] = m
        logger.info(f"Team member registered: {name} ({role})")
        return m
    
    def assign_to_project(
        self,
        m_id: str,
        project: str,
        hours: float
    ) -> Optional[ResourceAllocation]:
        """Allocate a team member to a specific project load."""
        if m_id not in self.members: return None
        
        m = self.members[m_id]
        alloc = ResourceAllocation(
            id=f"ALC-{uuid.uuid4().hex[:6].upper()}",
            member_id=m_id, project_name=project, hours=float(hours)
        )
        self.allocations.append(alloc)
        m.allocated_hours += hours
        logger.info(f"Assigned {m.name} to {project} for {hours}h")
        return alloc
    
    def format_dashboard(self) -> str:
        """Render the Resource Planning Dashboard."""
        total_cap = sum(m.weekly_hours for m in self.members.values())
        total_alc = sum(m.allocated_hours for m in self.members.values())
        util = (total_alc / total_cap * 100.0) if total_cap > 0 else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 RESOURCE PLANNER DASHBOARD{' ' * 31}║",
            f"║  {len(self.members)} members │ {util:.1f}% utilized │ {total_alc:.0f}h total allocated{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 TEAM ALLOCATION STATUS                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for m in list(self.members.values())[:5]:
            m_util = (m.allocated_hours / m.weekly_hours * 100.0) if m.weekly_hours > 0 else 0.0
            icon = "🟢" if m_util < 80 else "🟡" if m_util <= 100 else "🔴"
            bar = "█" * int(m_util / 10) + "░" * int(10 - (m_util / 10))
            lines.append(f"║  {icon} {m.name[:12]:<12} │ {bar} │ {m_util:>5.1f}% │ {m.allocated_hours:>2.0f}h ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Member]  [📊 Forecast]  [⚖️ Balance Load]  [⚙️]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Optimized!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📅 Initializing Planner System...")
    print("=" * 60)
    
    try:
        planner = ResourcePlanner("Saigon Digital Hub")
        # Seed
        m = planner.add_team_member("Alex Chen", "Lead", [Skill.DEV], 40.0)
        planner.assign_to_project(m.id, "Core Refactor", 35.0)
        
        print("\n" + planner.format_dashboard())
        
    except Exception as e:
        logger.error(f"Planner Error: {e}")
