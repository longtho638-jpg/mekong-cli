"""
🎬 Video Editor - Video Production
====================================

Create compelling video content.
Stories that move people!

Roles:
- Video editing
- Motion graphics
- Color grading
- Audio sync
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class VideoType(Enum):
    """Video types."""
    PROMO = "promo"
    EXPLAINER = "explainer"
    TESTIMONIAL = "testimonial"
    SOCIAL = "social"
    AD = "ad"
    TUTORIAL = "tutorial"


class VideoStatus(Enum):
    """Video production status."""
    BRIEFED = "briefed"
    EDITING = "editing"
    REVIEW = "review"
    REVISING = "revising"
    APPROVED = "approved"
    DELIVERED = "delivered"


@dataclass
class VideoProject:
    """A video project."""
    id: str
    name: str
    client: str
    video_type: VideoType
    duration_seconds: int
    format: str  # 16:9, 9:16, 1:1
    status: VideoStatus = VideoStatus.BRIEFED
    editor: str = ""
    revisions: int = 0
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=7))


class VideoEditor:
    """
    Video Editor System.
    
    Video production workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, VideoProject] = {}
    
    def create_project(
        self,
        name: str,
        client: str,
        video_type: VideoType,
        duration_seconds: int,
        video_format: str = "16:9",
        editor: str = "",
        days_to_deadline: int = 7
    ) -> VideoProject:
        """Create a video project."""
        project = VideoProject(
            id=f"VID-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            video_type=video_type,
            duration_seconds=duration_seconds,
            format=video_format,
            editor=editor,
            deadline=datetime.now() + timedelta(days=days_to_deadline)
        )
        self.projects[project.id] = project
        return project
    
    def update_status(self, project: VideoProject, status: VideoStatus):
        """Update project status."""
        if status == VideoStatus.REVISING:
            project.revisions += 1
        project.status = status
    
    def get_by_status(self, status: VideoStatus) -> List[VideoProject]:
        """Get projects by status."""
        return [p for p in self.projects.values() if p.status == status]
    
    def format_dashboard(self) -> str:
        """Format video editor dashboard."""
        editing = len(self.get_by_status(VideoStatus.EDITING))
        review = len(self.get_by_status(VideoStatus.REVIEW))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎬 VIDEO EDITOR                                          ║",
            f"║  {len(self.projects)} projects │ {editing} editing │ {review} in review     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📹 ACTIVE PROJECTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"promo": "📢", "explainer": "💡", "testimonial": "💬", "social": "📱", "ad": "📺", "tutorial": "📚"}
        status_icons = {"briefed": "📋", "editing": "✂️", "review": "👁️", "revising": "🔄", "approved": "✅", "delivered": "📤"}
        
        for project in list(self.projects.values())[:5]:
            t_icon = type_icons.get(project.video_type.value, "🎬")
            s_icon = status_icons.get(project.status.value, "⚪")
            duration = f"{project.duration_seconds}s"
            
            lines.append(f"║  {s_icon} {t_icon} {project.name[:18]:<18} │ {duration:>4} │ {project.format:<5}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY FORMAT                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        formats = {"16:9": "🖥️ Landscape", "9:16": "📱 Portrait", "1:1": "⬜ Square"}
        for fmt, label in formats.items():
            count = sum(1 for p in self.projects.values() if p.format == fmt)
            lines.append(f"║    {label:<15} │ {count:>2} videos                    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📹 New Project]  [✂️ Timeline]  [📤 Deliver]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Stories that move!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ve = VideoEditor("Saigon Digital Hub")
    
    print("🎬 Video Editor")
    print("=" * 60)
    print()
    
    ve.create_project("Brand Story", "Sunrise Realty", VideoType.PROMO, 60, "16:9", "Mike")
    ve.create_project("Coffee Process", "Coffee Lab", VideoType.EXPLAINER, 90, "16:9", "Sarah")
    ve.create_project("IG Reel Promo", "Fashion Brand", VideoType.SOCIAL, 30, "9:16", "Mike")
    ve.create_project("Customer Interview", "Tech Startup", VideoType.TESTIMONIAL, 120, "16:9", "Sarah")
    
    # Update statuses
    ve.update_status(list(ve.projects.values())[0], VideoStatus.EDITING)
    ve.update_status(list(ve.projects.values())[1], VideoStatus.REVIEW)
    
    print(ve.format_dashboard())
