"""
🎯 UX Designer - User Experience
==================================

Design intuitive user experiences.
User-centered design excellence!

Roles:
- User research
- Wireframing
- Usability testing
- Journey mapping
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class UXPhase(Enum):
    """UX design phases."""
    RESEARCH = "research"
    PERSONAS = "personas"
    JOURNEY_MAP = "journey_map"
    WIREFRAMES = "wireframes"
    PROTOTYPE = "prototype"
    TESTING = "testing"
    ITERATION = "iteration"


class ResearchMethod(Enum):
    """Research methods."""
    INTERVIEWS = "interviews"
    SURVEYS = "surveys"
    ANALYTICS = "analytics"
    USABILITY_TEST = "usability_test"
    COMPETITIVE = "competitive"


@dataclass
class UXProject:
    """A UX design project."""
    id: str
    name: str
    client: str
    current_phase: UXPhase
    goals: List[str]
    personas: int = 0
    wireframes: int = 0
    tests_completed: int = 0
    designer: str = ""


@dataclass
class UsabilityTest:
    """A usability test session."""
    id: str
    project_id: str
    participants: int
    key_findings: List[str]
    success_rate: float
    date: datetime = field(default_factory=datetime.now)


class UXDesigner:
    """
    UX Designer System.
    
    User experience design.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, UXProject] = {}
        self.tests: List[UsabilityTest] = []
    
    def create_project(
        self,
        name: str,
        client: str,
        goals: List[str],
        designer: str = ""
    ) -> UXProject:
        """Create a UX project."""
        project = UXProject(
            id=f"UX-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            current_phase=UXPhase.RESEARCH,
            goals=goals,
            designer=designer
        )
        self.projects[project.id] = project
        return project
    
    def advance_phase(self, project: UXProject):
        """Advance to next phase."""
        phases = list(UXPhase)
        idx = phases.index(project.current_phase)
        if idx < len(phases) - 1:
            project.current_phase = phases[idx + 1]
    
    def record_test(
        self,
        project: UXProject,
        participants: int,
        findings: List[str],
        success_rate: float
    ) -> UsabilityTest:
        """Record a usability test."""
        test = UsabilityTest(
            id=f"TST-{uuid.uuid4().hex[:6].upper()}",
            project_id=project.id,
            participants=participants,
            key_findings=findings,
            success_rate=success_rate
        )
        self.tests.append(test)
        project.tests_completed += 1
        return test
    
    def format_dashboard(self) -> str:
        """Format UX designer dashboard."""
        active = sum(1 for p in self.projects.values() if p.current_phase != UXPhase.ITERATION)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 UX DESIGNER                                           ║",
            f"║  {len(self.projects)} projects │ {active} active │ {len(self.tests)} tests         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE PROJECTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        phase_icons = {"research": "🔍", "personas": "👤", "journey_map": "🗺️", "wireframes": "✏️", "prototype": "🔗", "testing": "🧪", "iteration": "🔄"}
        
        for project in list(self.projects.values())[:5]:
            icon = phase_icons.get(project.current_phase.value, "📋")
            lines.append(f"║  {icon} {project.name[:20]:<20} │ {project.current_phase.value[:12]:<12} │ {project.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY PHASE                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for phase in list(UXPhase)[:5]:
            count = sum(1 for p in self.projects.values() if p.current_phase == phase)
            icon = phase_icons.get(phase.value, "📋")
            lines.append(f"║    {icon} {phase.value.replace('_', ' ').capitalize():<15} │ {count:>2} projects          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🧪 RECENT TESTS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for test in self.tests[-2:]:
            lines.append(f"║    ✅ {test.participants} participants │ {test.success_rate:.0f}% success rate       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔍 Research]  [✏️ Wireframe]  [🧪 Test]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - User-centered design!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ux = UXDesigner("Saigon Digital Hub")
    
    print("🎯 UX Designer")
    print("=" * 60)
    print()
    
    p1 = ux.create_project("App Redesign", "Sunrise Realty", ["Improve conversion", "Reduce drop-off"], "Emma")
    p2 = ux.create_project("Checkout Flow", "Coffee Lab", ["Faster checkout", "Mobile-first"], "James")
    p3 = ux.create_project("Dashboard UX", "Tech Startup", ["Intuitive nav", "Quick insights"], "Emma")
    
    # Advance phases
    ux.advance_phase(p1)  # Personas
    ux.advance_phase(p1)  # Journey Map
    ux.advance_phase(p1)  # Wireframes
    ux.advance_phase(p2)  # Personas
    
    # Record test
    ux.record_test(p1, 5, ["Confusing nav", "Slow loading"], 72)
    
    print(ux.format_dashboard())
