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

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class IllustrationStyle(Enum):
    """Visual styles for illustrations."""

    FLAT = "flat"
    LINE_ART = "line_art"
    ISOMETRIC = "isometric"
    HAND_DRAWN = "hand_drawn"
    REALISTIC = "realistic"
    CARTOON = "cartoon"


class IllustrationType(Enum):
    """Categorization of illustration work."""

    HERO = "hero"
    SPOT = "spot"
    ICON_SET = "icon_set"
    INFOGRAPHIC = "infographic"
    CHARACTER = "character"
    PATTERN = "pattern"


@dataclass
class IllustrationProject:
    """An individual illustration project record."""

    id: str
    name: str
    client: str
    illus_type: IllustrationType
    style: IllustrationStyle
    pieces: int
    completed: int = 0
    illustrator: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=7))

    def __post_init__(self):
        if self.pieces <= 0:
            raise ValueError("Project must contain at least 1 piece")
        if self.completed < 0 or self.completed > self.pieces:
            raise ValueError("Invalid completion count")


class Illustrator:
    """
    Illustrator System.

    Orchestrates the creation, tracking, and delivery of specialized illustration assets.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, IllustrationProject] = {}
        logger.info(f"Illustrator system initialized for {agency_name}")

    def create_project(
        self,
        name: str,
        client: str,
        illus_type: IllustrationType,
        style: IllustrationStyle,
        pieces: int,
        illustrator: str = "Illustrator AI",
        due_days: int = 7,
    ) -> IllustrationProject:
        """Register a new illustration project."""
        if not name or not client:
            raise ValueError("Name and client are mandatory")

        project = IllustrationProject(
            id=f"ILL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            illus_type=illus_type,
            style=style,
            pieces=int(pieces),
            illustrator=illustrator,
            deadline=datetime.now() + timedelta(days=due_days),
        )
        self.projects[project.id] = project
        logger.info(f"Project created: {name} ({pieces} pieces)")
        return project

    def mark_piece_complete(self, project_id: str) -> bool:
        """Increment completion count for a specific project."""
        if project_id not in self.projects:
            return False

        p = self.projects[project_id]
        if p.completed < p.pieces:
            p.completed += 1
            logger.info(f"Piece completed for {p.name} ({p.completed}/{p.pieces})")
            return True
        return False

    def format_dashboard(self) -> str:
        """Render the Illustrator Dashboard."""
        total_p = len(self.projects)
        total_pieces = sum(p.pieces for p in self.projects.values())
        done_pieces = sum(p.completed for p in self.projects.values())

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ✏️ ILLUSTRATOR DASHBOARD{' ' * 35}║",
            f"║  {total_p} projects │ {done_pieces}/{total_pieces} total pieces finished {' ' * 14}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎨 ACTIVE PROJECTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        type_icons = {
            IllustrationType.HERO: "🖼️",
            IllustrationType.ICON_SET: "🔲",
            IllustrationType.CHARACTER: "👤",
            IllustrationType.PATTERN: "🔳",
        }

        for p in list(self.projects.values())[:5]:
            icon = type_icons.get(p.illus_type, "🎨")
            prog = (p.completed / p.pieces) * 100
            bar = "█" * int(prog / 10) + "░" * (10 - int(prog / 10))
            name_disp = (p.name[:18] + "..") if len(p.name) > 20 else p.name
            lines.append(f"║  {icon} {name_disp:<20} │ {bar} │ {p.completed}/{p.pieces} done  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [➕ New Project]  [🎨 Draw]  [📤 Export]  [⚙️ Settings]  ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Stories!           ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("✏️ Initializing Illustrator...")
    print("=" * 60)

    try:
        illus_system = Illustrator("Saigon Digital Hub")

        # Seed
        p1 = illus_system.create_project(
            "Heroes", "Sunrise", IllustrationType.HERO, IllustrationStyle.FLAT, 5
        )
        illus_system.mark_piece_complete(p1.id)

        print("\n" + illus_system.format_dashboard())

    except Exception as e:
        logger.error(f"Illustrator Error: {e}")
