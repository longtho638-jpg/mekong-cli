"""
📅 Resource Planner - Team Resource Management
================================================

Plan and allocate team resources.
Right people, right projects!

Features:
- Resource allocation
- Availability tracking
- Skill matching
- Utilization optimization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class Skill(Enum):
    """Team member skills."""
    SEO = "seo"
    PPC = "ppc"
    CONTENT = "content"
    DESIGN = "design"
    DEV = "dev"
    STRATEGY = "strategy"


class AllocationStatus(Enum):
    """Allocation status."""
    AVAILABLE = "available"
    PARTIALLY = "partially"
    BOOKED = "booked"
    OVERBOOKED = "overbooked"


@dataclass
class TeamMember:
    """A team member."""
    id: str
    name: str
    role: str
    skills: List[Skill]
    weekly_hours: int = 40
    allocated_hours: int = 0
    hourly_rate: float = 50


@dataclass
class Allocation:
    """A resource allocation."""
    id: str
    member_id: str
    project_name: str
    hours: int
    start_date: datetime
    end_date: datetime


class ResourcePlanner:
    """
    Resource Planner.
    
    Plan team resources.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.members: Dict[str, TeamMember] = {}
        self.allocations: List[Allocation] = []
    
    def add_member(
        self,
        name: str,
        role: str,
        skills: List[Skill],
        weekly_hours: int = 40,
        hourly_rate: float = 50
    ) -> TeamMember:
        """Add a team member."""
        member = TeamMember(
            id=f"TM-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            role=role,
            skills=skills,
            weekly_hours=weekly_hours,
            hourly_rate=hourly_rate
        )
        self.members[member.id] = member
        return member
    
    def allocate(
        self,
        member: TeamMember,
        project: str,
        hours: int,
        weeks: int = 1
    ) -> Allocation:
        """Allocate member to project."""
        alloc = Allocation(
            id=f"ALLOC-{uuid.uuid4().hex[:6].upper()}",
            member_id=member.id,
            project_name=project,
            hours=hours,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(weeks=weeks)
        )
        
        self.allocations.append(alloc)
        member.allocated_hours += hours
        return alloc
    
    def get_utilization(self, member: TeamMember) -> float:
        """Get member utilization."""
        return (member.allocated_hours / member.weekly_hours * 100) if member.weekly_hours else 0
    
    def get_status(self, member: TeamMember) -> AllocationStatus:
        """Get allocation status."""
        util = self.get_utilization(member)
        if util == 0:
            return AllocationStatus.AVAILABLE
        elif util < 80:
            return AllocationStatus.PARTIALLY
        elif util <= 100:
            return AllocationStatus.BOOKED
        else:
            return AllocationStatus.OVERBOOKED
    
    def format_dashboard(self) -> str:
        """Format resource planning dashboard."""
        total_capacity = sum(m.weekly_hours for m in self.members.values())
        total_allocated = sum(m.allocated_hours for m in self.members.values())
        utilization = (total_allocated / total_capacity * 100) if total_capacity else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 RESOURCE PLANNER                                      ║",
            f"║  {len(self.members)} members │ {utilization:.0f}% utilized │ {total_allocated}h allocated   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 TEAM ALLOCATION                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"available": "🟢", "partially": "🟡", "booked": "🟠", "overbooked": "🔴"}
        
        for member in self.members.values():
            status = self.get_status(member)
            icon = status_icons[status.value]
            util = self.get_utilization(member)
            bar = "█" * int(util / 10) + "░" * (10 - int(util / 10))
            
            lines.append(f"║  {icon} {member.name[:12]:<12} │ {bar} │ {util:>3.0f}% │ {member.allocated_hours:>2}h  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 BY SKILL                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        skill_icons = {"seo": "🔍", "ppc": "📺", "content": "✍️", "design": "🎨", "dev": "💻", "strategy": "🎯"}
        
        for skill in list(Skill)[:4]:
            members = [m for m in self.members.values() if skill in m.skills]
            icon = skill_icons.get(skill.value, "•")
            lines.append(f"║    {icon} {skill.value.upper():<10} │ {len(members)} members                    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Add Member]  [📊 Forecast]  [⚖️ Balance]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Right team, right time!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    planner = ResourcePlanner("Saigon Digital Hub")
    
    print("📅 Resource Planner")
    print("=" * 60)
    print()
    
    # Add team members
    m1 = planner.add_member("Alex Chen", "SEO Lead", [Skill.SEO, Skill.CONTENT], 40, 75)
    m2 = planner.add_member("Sarah Kim", "Designer", [Skill.DESIGN, Skill.CONTENT], 40, 60)
    m3 = planner.add_member("Mike Lee", "Developer", [Skill.DEV], 40, 80)
    m4 = planner.add_member("Anna Tran", "Strategist", [Skill.STRATEGY, Skill.PPC], 32, 90)
    
    # Allocate to projects
    planner.allocate(m1, "Sunrise Realty SEO", 30, 4)
    planner.allocate(m2, "Coffee Lab Rebrand", 35, 2)
    planner.allocate(m3, "Tech Startup Website", 40, 6)
    planner.allocate(m4, "Marketing Strategy", 24, 3)
    
    print(planner.format_dashboard())
