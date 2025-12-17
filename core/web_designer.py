"""
🌐 Web Designer - Website Design
==================================

Design beautiful, functional websites.
Digital experiences that convert!

Roles:
- UI design
- Responsive layouts
- Prototyping
- Design systems
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class WebProjectType(Enum):
    """Web project types."""
    LANDING = "landing"
    CORPORATE = "corporate"
    ECOMMERCE = "ecommerce"
    PORTFOLIO = "portfolio"
    BLOG = "blog"
    WEBAPP = "webapp"


class DesignPhase(Enum):
    """Design phases."""
    WIREFRAME = "wireframe"
    MOCKUP = "mockup"
    PROTOTYPE = "prototype"
    HANDOFF = "handoff"
    COMPLETE = "complete"


@dataclass
class WebDesignProject:
    """A web design project."""
    id: str
    name: str
    client: str
    project_type: WebProjectType
    pages: int
    responsive: bool = True
    phase: DesignPhase = DesignPhase.WIREFRAME
    designer: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))


@dataclass
class DesignAsset:
    """A design asset."""
    id: str
    project_id: str
    name: str
    asset_type: str  # figma, psd, svg
    url: str = ""


class WebDesigner:
    """
    Web Designer System.
    
    Website design workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, WebDesignProject] = {}
        self.assets: List[DesignAsset] = []
    
    def create_project(
        self,
        name: str,
        client: str,
        project_type: WebProjectType,
        pages: int,
        designer: str = "",
        days_to_deadline: int = 14
    ) -> WebDesignProject:
        """Create a web design project."""
        project = WebDesignProject(
            id=f"WEB-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            project_type=project_type,
            pages=pages,
            designer=designer,
            deadline=datetime.now() + timedelta(days=days_to_deadline)
        )
        self.projects[project.id] = project
        return project
    
    def advance_phase(self, project: WebDesignProject):
        """Advance to next phase."""
        phases = list(DesignPhase)
        idx = phases.index(project.phase)
        if idx < len(phases) - 1:
            project.phase = phases[idx + 1]
    
    def add_asset(
        self,
        project: WebDesignProject,
        name: str,
        asset_type: str,
        url: str = ""
    ) -> DesignAsset:
        """Add a design asset."""
        asset = DesignAsset(
            id=f"AST-{uuid.uuid4().hex[:6].upper()}",
            project_id=project.id,
            name=name,
            asset_type=asset_type,
            url=url
        )
        self.assets.append(asset)
        return asset
    
    def format_dashboard(self) -> str:
        """Format web designer dashboard."""
        in_progress = sum(1 for p in self.projects.values() if p.phase != DesignPhase.COMPLETE)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌐 WEB DESIGNER                                          ║",
            f"║  {len(self.projects)} projects │ {in_progress} in progress               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎨 ACTIVE DESIGNS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"landing": "📄", "corporate": "🏢", "ecommerce": "🛒", "portfolio": "🖼️", "blog": "📝", "webapp": "💻"}
        phase_icons = {"wireframe": "✏️", "mockup": "🎨", "prototype": "🔗", "handoff": "📤", "complete": "✅"}
        
        for project in list(self.projects.values())[:5]:
            t_icon = type_icons.get(project.project_type.value, "🌐")
            p_icon = phase_icons.get(project.phase.value, "⚪")
            
            lines.append(f"║  {p_icon} {t_icon} {project.name[:18]:<18} │ {project.pages:>2} pages │ {project.client[:10]:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY PHASE                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for phase in DesignPhase:
            count = sum(1 for p in self.projects.values() if p.phase == phase)
            icon = phase_icons.get(phase.value, "⚪")
            lines.append(f"║    {icon} {phase.value.capitalize():<12} │ {count:>2} projects                  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🎨 New Design]  [📤 Handoff]  [🖼️ Assets]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Beautiful experiences!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    wd = WebDesigner("Saigon Digital Hub")
    
    print("🌐 Web Designer")
    print("=" * 60)
    print()
    
    p1 = wd.create_project("Homepage Redesign", "Sunrise Realty", WebProjectType.CORPORATE, 8, "Lisa")
    p2 = wd.create_project("Product Landing", "Coffee Lab", WebProjectType.LANDING, 3, "Tom")
    p3 = wd.create_project("Shop Launch", "Fashion Brand", WebProjectType.ECOMMERCE, 15, "Lisa")
    
    # Advance phases
    wd.advance_phase(p1)  # Mockup
    wd.advance_phase(p1)  # Prototype
    wd.advance_phase(p2)  # Mockup
    
    print(wd.format_dashboard())
