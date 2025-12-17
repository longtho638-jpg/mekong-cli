"""
✏️ Illustrator - Custom Illustrations
========================================

Create unique illustrations.
Art that tells stories!

Roles:
- Custom illustrations
- Icon design
- Infographics
- Character design
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class IllustrationStyle(Enum):
    """Illustration styles."""
    FLAT = "flat"
    LINE_ART = "line_art"
    ISOMETRIC = "isometric"
    HAND_DRAWN = "hand_drawn"
    REALISTIC = "realistic"
    CARTOON = "cartoon"


class IllustrationType(Enum):
    """Illustration types."""
    HERO = "hero"
    SPOT = "spot"
    ICON_SET = "icon_set"
    INFOGRAPHIC = "infographic"
    CHARACTER = "character"
    PATTERN = "pattern"


@dataclass
class IllustrationProject:
    """An illustration project."""
    id: str
    name: str
    client: str
    illus_type: IllustrationType
    style: IllustrationStyle
    pieces: int
    completed: int = 0
    illustrator: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=7))


class Illustrator:
    """
    Illustrator System.
    
    Custom illustrations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, IllustrationProject] = {}
    
    def create_project(
        self,
        name: str,
        client: str,
        illus_type: IllustrationType,
        style: IllustrationStyle,
        pieces: int,
        illustrator: str = "",
        due_days: int = 7
    ) -> IllustrationProject:
        """Create an illustration project."""
        project = IllustrationProject(
            id=f"ILL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            illus_type=illus_type,
            style=style,
            pieces=pieces,
            illustrator=illustrator,
            deadline=datetime.now() + timedelta(days=due_days)
        )
        self.projects[project.id] = project
        return project
    
    def complete_piece(self, project: IllustrationProject):
        """Mark a piece as complete."""
        if project.completed < project.pieces:
            project.completed += 1
    
    def get_progress(self, project: IllustrationProject) -> float:
        """Get project progress."""
        return (project.completed / project.pieces * 100) if project.pieces else 0
    
    def format_dashboard(self) -> str:
        """Format illustrator dashboard."""
        total_pieces = sum(p.pieces for p in self.projects.values())
        completed = sum(p.completed for p in self.projects.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ✏️ ILLUSTRATOR                                           ║",
            f"║  {len(self.projects)} projects │ {completed}/{total_pieces} pieces complete       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎨 ACTIVE PROJECTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"hero": "🖼️", "spot": "✨", "icon_set": "🔲", "infographic": "📊", "character": "👤", "pattern": "🔳"}
        style_icons = {"flat": "◼️", "line_art": "✏️", "isometric": "📐", "hand_drawn": "🖌️", "realistic": "🎨", "cartoon": "🎭"}
        
        for project in list(self.projects.values())[:5]:
            t_icon = type_icons.get(project.illus_type.value, "🎨")
            progress = self.get_progress(project)
            bar = "█" * int(progress / 20) + "░" * (5 - int(progress / 20))
            
            lines.append(f"║  {t_icon} {project.name[:18]:<18} │ {bar} │ {project.completed}/{project.pieces}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY STYLE                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for style in list(IllustrationStyle)[:4]:
            count = sum(1 for p in self.projects.values() if p.style == style)
            icon = style_icons.get(style.value, "🎨")
            lines.append(f"║    {icon} {style.value.replace('_', ' ').capitalize():<15} │ {count:>2} projects          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Project]  [🎨 Draw]  [📤 Export]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Art that tells stories!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    illus = Illustrator("Saigon Digital Hub")
    
    print("✏️ Illustrator")
    print("=" * 60)
    print()
    
    p1 = illus.create_project("Website Heroes", "Sunrise Realty", IllustrationType.HERO, IllustrationStyle.FLAT, 5, "Nina")
    p2 = illus.create_project("App Icons", "Coffee Lab", IllustrationType.ICON_SET, IllustrationStyle.LINE_ART, 20, "Leo")
    p3 = illus.create_project("Brand Mascot", "Fashion Brand", IllustrationType.CHARACTER, IllustrationStyle.CARTOON, 3, "Nina")
    
    # Complete some pieces
    for _ in range(3):
        illus.complete_piece(p1)
    for _ in range(12):
        illus.complete_piece(p2)
    
    print(illus.format_dashboard())
