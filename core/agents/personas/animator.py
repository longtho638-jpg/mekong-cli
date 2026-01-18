"""
🎬 Animator - Motion Design
==============================

Create stunning animations.
Motion that captivates!

Roles:
- Motion graphics
- 2D/3D animation
- Character animation
- UI animations
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


class AnimationType(Enum):
    """Animation types."""

    MOTION_GRAPHICS = "motion_graphics"
    CHARACTER_2D = "character_2d"
    CHARACTER_3D = "character_3d"
    UI_ANIMATION = "ui_animation"
    LOGO_REVEAL = "logo_reveal"
    EXPLAINER = "explainer"


class AnimationStatus(Enum):
    """Animation status."""

    STORYBOARD = "storyboard"
    ANIMATING = "animating"
    RENDERING = "rendering"
    REVIEW = "review"
    DELIVERED = "delivered"


@dataclass
class AnimationProject:
    """An animation project entity."""

    id: str
    name: str
    client: str
    anim_type: AnimationType
    duration_seconds: int
    fps: int = 30
    status: AnimationStatus = AnimationStatus.STORYBOARD
    animator: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))

    @property
    def total_frames(self) -> int:
        """Calculate total frame count."""
        return self.duration_seconds * self.fps


class Animator:
    """
    Animator System.

    Manages animation projects and pipeline.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, AnimationProject] = {}
        logger.info(f"Animator initialized for {agency_name}")

    def create_project(
        self,
        name: str,
        client: str,
        anim_type: AnimationType,
        duration_seconds: int,
        fps: int = 30,
        animator: str = "",
        due_days: int = 14,
    ) -> AnimationProject:
        """Create a new animation project."""
        if duration_seconds <= 0:
            raise ValueError("Duration must be positive")
        if fps <= 0:
            raise ValueError("FPS must be positive")

        project = AnimationProject(
            id=f"ANM-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            anim_type=anim_type,
            duration_seconds=duration_seconds,
            fps=fps,
            animator=animator,
            deadline=datetime.now() + timedelta(days=due_days),
        )
        self.projects[project.id] = project
        logger.info(f"Project created: {name} for {client} ({anim_type.value})")
        return project

    def update_status(self, project: AnimationProject, status: AnimationStatus):
        """Update project status."""
        old_status = project.status
        project.status = status
        logger.info(f"Project {project.name} status: {old_status.value} -> {status.value}")

    def format_dashboard(self) -> str:
        """Render Animator Dashboard."""
        animating = sum(1 for p in self.projects.values() if p.status == AnimationStatus.ANIMATING)
        rendering = sum(1 for p in self.projects.values() if p.status == AnimationStatus.RENDERING)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎬 ANIMATOR{' ' * 43}║",
            f"║  {len(self.projects)} projects │ {animating} animating │ {rendering} rendering{' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎥 ACTIVE PROJECTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        type_icons = {
            AnimationType.MOTION_GRAPHICS: "🎞️",
            AnimationType.CHARACTER_2D: "👤",
            AnimationType.CHARACTER_3D: "🧊",
            AnimationType.UI_ANIMATION: "📱",
            AnimationType.LOGO_REVEAL: "✨",
            AnimationType.EXPLAINER: "💡",
        }
        status_icons = {
            AnimationStatus.STORYBOARD: "📋",
            AnimationStatus.ANIMATING: "🎬",
            AnimationStatus.RENDERING: "⚙️",
            AnimationStatus.REVIEW: "👁️",
            AnimationStatus.DELIVERED: "📤",
        }

        for project in list(self.projects.values())[:5]:
            t_icon = type_icons.get(project.anim_type, "🎬")
            s_icon = status_icons.get(project.status, "⚪")
            frames = project.total_frames

            lines.append(
                f"║  {s_icon} {t_icon} {project.name[:16]:<16} │ {project.duration_seconds:>3}s │ {frames:>4}f │ {project.fps}fps  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📊 BY TYPE                                               ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        for atype in list(AnimationType)[:4]:
            count = sum(1 for p in self.projects.values() if p.anim_type == atype)
            icon = type_icons.get(atype, "🎬")
            lines.append(
                f"║    {icon} {atype.value.replace('_', ' ').capitalize():<18} │ {count:>2} projects       ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📊 PIPELINE STATUS                                       ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        for status in AnimationStatus:
            count = sum(1 for p in self.projects.values() if p.status == status)
            icon = status_icons.get(status, "⚪")
            bar = "█" * count + "░" * max(0, 3 - count)  # Simple visual bar
            lines.append(
                f"║    {icon} {status.value.capitalize():<12} │ {bar} │ {count:>2}                ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  [📋 Storyboard]  [🎬 Animate]  [⚙️ Render]               ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Captivating!          ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎬 Initializing Animator...")
    print("=" * 60)

    try:
        anim = Animator("Saigon Digital Hub")

        p1 = anim.create_project(
            "Logo Intro", "Sunrise Realty", AnimationType.LOGO_REVEAL, 5, 60, "Max"
        )
        p2 = anim.create_project(
            "Product Explainer", "Coffee Lab", AnimationType.EXPLAINER, 60, 30, "Zoe"
        )
        p3 = anim.create_project(
            "App UI Motion", "Tech Startup", AnimationType.UI_ANIMATION, 15, 60, "Max"
        )
        p4 = anim.create_project(
            "Social Ads", "Fashion Brand", AnimationType.MOTION_GRAPHICS, 30, 30, "Zoe"
        )

        # Update statuses
        anim.update_status(p1, AnimationStatus.ANIMATING)
        anim.update_status(p2, AnimationStatus.RENDERING)
        anim.update_status(p3, AnimationStatus.REVIEW)

        print("\n" + anim.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
