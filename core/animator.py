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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """An animation project."""
    id: str
    name: str
    client: str
    anim_type: AnimationType
    duration_seconds: int
    fps: int = 30
    status: AnimationStatus = AnimationStatus.STORYBOARD
    animator: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))


class Animator:
    """
    Animator System.
    
    Motion design workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, AnimationProject] = {}
    
    def create_project(
        self,
        name: str,
        client: str,
        anim_type: AnimationType,
        duration_seconds: int,
        fps: int = 30,
        animator: str = "",
        due_days: int = 14
    ) -> AnimationProject:
        """Create an animation project."""
        project = AnimationProject(
            id=f"ANM-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            anim_type=anim_type,
            duration_seconds=duration_seconds,
            fps=fps,
            animator=animator,
            deadline=datetime.now() + timedelta(days=due_days)
        )
        self.projects[project.id] = project
        return project
    
    def update_status(self, project: AnimationProject, status: AnimationStatus):
        """Update project status."""
        project.status = status
    
    def calculate_frames(self, project: AnimationProject) -> int:
        """Calculate total frames."""
        return project.duration_seconds * project.fps
    
    def format_dashboard(self) -> str:
        """Format animator dashboard."""
        animating = sum(1 for p in self.projects.values() if p.status == AnimationStatus.ANIMATING)
        rendering = sum(1 for p in self.projects.values() if p.status == AnimationStatus.RENDERING)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎬 ANIMATOR                                              ║",
            f"║  {len(self.projects)} projects │ {animating} animating │ {rendering} rendering   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎥 ACTIVE PROJECTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"motion_graphics": "🎞️", "character_2d": "👤", "character_3d": "🧊", "ui_animation": "📱", "logo_reveal": "✨", "explainer": "💡"}
        status_icons = {"storyboard": "📋", "animating": "🎬", "rendering": "⚙️", "review": "👁️", "delivered": "📤"}
        
        for project in list(self.projects.values())[:5]:
            t_icon = type_icons.get(project.anim_type.value, "🎬")
            s_icon = status_icons.get(project.status.value, "⚪")
            frames = self.calculate_frames(project)
            
            lines.append(f"║  {s_icon} {t_icon} {project.name[:16]:<16} │ {project.duration_seconds:>3}s │ {frames:>4}f │ {project.fps}fps  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for atype in list(AnimationType)[:4]:
            count = sum(1 for p in self.projects.values() if p.anim_type == atype)
            icon = type_icons.get(atype.value, "🎬")
            lines.append(f"║    {icon} {atype.value.replace('_', ' ').capitalize():<18} │ {count:>2} projects       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 PIPELINE STATUS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for status in AnimationStatus:
            count = sum(1 for p in self.projects.values() if p.status == status)
            icon = status_icons.get(status.value, "⚪")
            bar = "█" * count + "░" * max(0, 3 - count)
            lines.append(f"║    {icon} {status.value.capitalize():<12} │ {bar} │ {count:>2}                ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Storyboard]  [🎬 Animate]  [⚙️ Render]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Motion that captivates!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    anim = Animator("Saigon Digital Hub")
    
    print("🎬 Animator")
    print("=" * 60)
    print()
    
    p1 = anim.create_project("Logo Intro", "Sunrise Realty", AnimationType.LOGO_REVEAL, 5, 60, "Max")
    p2 = anim.create_project("Product Explainer", "Coffee Lab", AnimationType.EXPLAINER, 60, 30, "Zoe")
    p3 = anim.create_project("App UI Motion", "Tech Startup", AnimationType.UI_ANIMATION, 15, 60, "Max")
    p4 = anim.create_project("Social Ads", "Fashion Brand", AnimationType.MOTION_GRAPHICS, 30, 30, "Zoe")
    
    # Update statuses
    anim.update_status(p1, AnimationStatus.ANIMATING)
    anim.update_status(p2, AnimationStatus.RENDERING)
    anim.update_status(p3, AnimationStatus.REVIEW)
    
    print(anim.format_dashboard())
