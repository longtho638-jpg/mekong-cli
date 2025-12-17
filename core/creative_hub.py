"""
🎨 Creative Hub - Department Integration
==========================================

Central hub connecting all Creative roles
with their operational tools.

Integrates:
- Art Director → creative briefs
- Video Editor → video production
- Web Designer → web design
- Graphic Designer → visual assets
- UX Designer → user experience
- Illustrator → illustrations
- Animator → motion graphics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.art_director import ArtDirector, ProjectType, ReviewStatus
from core.video_editor import VideoEditor, VideoType
from core.web_designer import WebDesigner, WebProjectType
from core.graphic_designer import GraphicDesigner, AssetCategory
from core.ux_designer import UXDesigner, UXPhase
from core.illustrator import Illustrator, IllustrationType
from core.animator import Animator, AnimationType


@dataclass
class CreativeMetrics:
    """Department-wide metrics."""
    total_projects: int
    in_progress: int
    pending_review: int
    videos_in_production: int
    designs_in_queue: int
    animations_rendering: int


class CreativeHub:
    """
    Creative Hub.
    
    Connects all Creative roles with their tools.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.art_director = ArtDirector(agency_name)
        self.video_editor = VideoEditor(agency_name)
        self.web_designer = WebDesigner(agency_name)
        self.graphic_designer = GraphicDesigner(agency_name)
        self.ux_designer = UXDesigner(agency_name)
        self.illustrator = Illustrator(agency_name)
        self.animator = Animator(agency_name)
    
    def get_department_metrics(self) -> CreativeMetrics:
        """Get department-wide metrics."""
        total = (len(self.art_director.briefs) + 
                len(self.video_editor.projects) + 
                len(self.web_designer.projects) +
                len(self.graphic_designer.assets) +
                len(self.ux_designer.projects) +
                len(self.illustrator.projects) +
                len(self.animator.projects))
        
        pending_review = len(self.art_director.get_by_status(ReviewStatus.IN_REVIEW))
        
        return CreativeMetrics(
            total_projects=total,
            in_progress=total - pending_review,
            pending_review=pending_review,
            videos_in_production=len([p for p in self.video_editor.projects.values() 
                                     if p.status.value == "editing"]),
            designs_in_queue=len(self.graphic_designer.get_queue()),
            animations_rendering=len([p for p in self.animator.projects.values() 
                                     if p.status.value == "rendering"])
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 CREATIVE HUB                                          ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Total Projects:     {metrics.total_projects:>5}                          ║",
            f"║    🔄 In Progress:        {metrics.in_progress:>5}                          ║",
            f"║    👁️ Pending Review:     {metrics.pending_review:>5}                          ║",
            f"║    🎬 Videos in Prod:     {metrics.videos_in_production:>5}                          ║",
            f"║    🖼️ Designs in Queue:   {metrics.designs_in_queue:>5}                          ║",
            f"║    ⚙️ Animations Render:  {metrics.animations_rendering:>5}                          ║",
            "║                                                           ║",
            "║  🔗 CREATIVE ROLES                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🎨 Art Director        │ {len(self.art_director.briefs):>2} briefs               ║",
            f"║    🎬 Video Editor        │ {len(self.video_editor.projects):>2} videos               ║",
            f"║    🌐 Web Designer        │ {len(self.web_designer.projects):>2} designs              ║",
            f"║    🖼️ Graphic Designer    │ {len(self.graphic_designer.assets):>2} assets               ║",
            f"║    🎯 UX Designer         │ {len(self.ux_designer.projects):>2} projects             ║",
            f"║    ✏️ Illustrator         │ {len(self.illustrator.projects):>2} illustrations       ║",
            f"║    🎬 Animator            │ {len(self.animator.projects):>2} animations           ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📋 Briefs]  [⚙️ Settings]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Creative Excellence!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = CreativeHub("Saigon Digital Hub")
    
    print("🎨 Creative Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.art_director.create_brief("Brand Refresh", "Sunrise Realty", ProjectType.BRANDING,
        ["Modern"], "Adults", ["Trust"], ["Logo"], 14)
    hub.video_editor.create_project("Promo Video", "Coffee Lab", VideoType.PROMO, 60)
    hub.web_designer.create_project("Website", "Tech Startup", WebProjectType.CORPORATE, 8)
    
    print(hub.format_hub_dashboard())
