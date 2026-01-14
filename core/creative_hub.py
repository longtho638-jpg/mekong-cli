"""
🎨 Creative Hub - Department Integration
==========================================

Central hub connecting all Creative roles with their operational tools.

Integrates:
- Art Director
- Video Editor
- Web Designer
- Graphic Designer
- UX Designer
- Illustrator
- Animator
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.art_director import ArtDirector, ProjectType, ReviewStatus
    from core.video_editor import VideoEditor, VideoType
    from core.web_designer import WebDesigner, WebProjectType
    from core.graphic_designer import GraphicDesigner, AssetCategory
    from core.ux_designer import UXDesigner, UXPhase
    from core.illustrator import Illustrator, IllustrationType
    from core.animator import Animator, AnimationType
except ImportError:
    from art_director import ArtDirector, ProjectType, ReviewStatus
    from video_editor import VideoEditor, VideoType
    from web_designer import WebDesigner, WebProjectType
    from graphic_designer import GraphicDesigner, AssetCategory
    from ux_designer import UXDesigner, UXPhase
    from illustrator import Illustrator, IllustrationType
    from animator import Animator, AnimationType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CreativeMetrics:
    """Department-wide metrics container."""
    total_projects: int = 0
    in_progress: int = 0
    pending_review: int = 0
    videos_in_production: int = 0
    designs_in_queue: int = 0
    animations_rendering: int = 0


class CreativeHub:
    """
    Creative Hub System.
    
    Orchestrates all creative production roles and aggregates high-level metrics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Creative Hub for {agency_name}")
        try:
            self.art_director = ArtDirector(agency_name)
            self.video_editor = VideoEditor(agency_name)
            self.web_designer = WebDesigner(agency_name)
            self.graphic_designer = GraphicDesigner(agency_name)
            self.ux_designer = UXDesigner(agency_name)
            self.illustrator = Illustrator(agency_name)
            self.animator = Animator(agency_name)
        except Exception as e:
            logger.error(f"Sub-module initialization error: {e}")
            raise
    
    def get_department_metrics(self) -> CreativeMetrics:
        """Aggregate data from all specialized creative sub-modules."""
        metrics = CreativeMetrics()
        
        try:
            # Aggregate counts safely
            counts = [
                len(self.art_director.briefs),
                len(self.video_editor.projects),
                len(self.web_designer.projects),
                len(self.graphic_designer.assets),
                len(self.ux_designer.projects),
                len(self.illustrator.projects),
                len(self.animator.projects)
            ]
            metrics.total_projects = sum(counts)
            
            # Specific status filtering
            metrics.pending_review = len(self.art_director.get_by_status(ReviewStatus.IN_REVIEW))
            
            # Check production statuses (handling potential variations in status naming)
            metrics.videos_in_production = len([
                p for p in self.video_editor.projects.values() 
                if getattr(p.status, 'value', str(p.status)) == "editing"
            ])
            
            metrics.designs_in_queue = len(self.graphic_designer.get_queue())
            
            metrics.animations_rendering = len([
                p for p in self.animator.projects.values() 
                if getattr(p.status, 'value', str(p.status)) == "rendering"
            ])
            
            metrics.in_progress = metrics.total_projects - metrics.pending_review
            
        except Exception as e:
            logger.warning(f"Error aggregating creative metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render Creative Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 CREATIVE HUB{' ' * 42}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PRODUCTION METRICS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📋 Total Projects:     {m.total_projects:>5}                          ║",
            f"║    🔄 In Progress:        {m.in_progress:>5}                          ║",
            f"║    👁️ Pending Review:     {m.pending_review:>5}                          ║",
            f"║    🎬 Videos in Prod:     {m.videos_in_production:>5}                          ║",
            f"║    🖼️ Designs in Queue:   {m.designs_in_queue:>5}                          ║",
            f"║    ⚙️ Animations Render:  {m.animations_rendering:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SPECIALIZED ROLES                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🎨 Art Dir │ {len(self.art_director.briefs):>2}    🎬 Video │ {len(self.video_editor.projects):>2}    🌐 Web │ {len(self.web_designer.projects):>2} ║",
            f"║    🖼️ Graphic │ {len(self.graphic_designer.assets):>2}    🎯 UX    │ {len(self.ux_designer.projects):>2}    ✏️ Ill │ {len(self.illustrator.projects):>2} ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📋 Briefs]  [🎨 Portfolio]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Creative!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎨 Initializing Creative Hub...")
    print("=" * 60)
    
    try:
        hub = CreativeHub("Saigon Digital Hub")
        # Add sample project
        hub.art_director.create_brief("Logo", "Sunrise", ProjectType.BRANDING, ["Mdn"], "All", ["Tst"], ["Lg"], 14)
        
        print("\n" + hub.format_hub_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")
