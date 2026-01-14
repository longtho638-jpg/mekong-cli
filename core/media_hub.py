"""
📺 Media Hub - Department Integration
=======================================

Central hub connecting all Media & Communications roles with their operational tools.

Integrates:
- Content Writer
- Journalist
- PR Specialist
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import existing Ops modules with fallback for direct testing
try:
    from core.content_generator import ContentGenerator, ContentPillar
    from core.content_writer import ContentWriter, ContentType
    from core.journalist import Journalist, StoryType
    from core.pr_specialist import PRSpecialist, PRActivityType
except ImportError:
    from content_generator import ContentGenerator, ContentPillar
    from content_writer import ContentWriter, ContentType
    from journalist import Journalist, StoryType
    from pr_specialist import PRSpecialist, PRActivityType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class MediaMetrics:
    """Department-wide media metrics container."""
    total_content_pieces: int = 0
    total_stories: int = 0
    total_pr_activities: int = 0
    coverage_count: int = 0
    words_written: int = 0
    media_contacts: int = 0


class MediaHub:
    """
    Media & Communications Hub System.
    
    Orchestrates content creation, news reporting, and public relations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Media Hub for {agency_name}")
        try:
            self.content_ops = ContentGenerator(agency_name, "Digital Marketing", "Vietnam", "Content")
            self.content_writer = ContentWriter(agency_name)
            self.journalist = Journalist(agency_name)
            self.pr_specialist = PRSpecialist(agency_name)
        except Exception as e:
            logger.error(f"Media Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> MediaMetrics:
        """Aggregate data from all media sub-modules."""
        metrics = MediaMetrics()
        
        try:
            # 1. Content Metrics
            metrics.total_content_pieces = len(self.content_writer.content)
            metrics.words_written = sum(c.word_count for c in self.content_writer.content.values())
            
            # 2. Journalist Metrics
            metrics.total_stories = len(self.journalist.stories)
            
            # 3. PR Metrics
            metrics.total_pr_activities = len(self.pr_specialist.activities)
            metrics.media_contacts = len(self.pr_specialist.contacts)
            
            cov_stats = self.pr_specialist.get_coverage_stats()
            metrics.coverage_count = cov_stats.get("total", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating Media metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Media Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📺 MEDIA & COMMUNICATIONS HUB{' ' * 27}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PRODUCTION METRICS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    ✍️ Content Pieces:     {m.total_content_pieces:>5}                          ║",
            f"║    📰 Stories:            {m.total_stories:>5}                          ║",
            f"║    🎙️ PR Activities:      {m.total_pr_activities:>5}                          ║",
            f"║    📈 Media Coverage:     {m.coverage_count:>5}                          ║",
            f"║    📝 Words Written:      {m.words_written:>5}                          ║",
            f"║    📇 Media Contacts:     {m.media_contacts:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    ✍️ Writer (Blog/Social) │ 📰 Journalist (News)         ║",
            "║    🎙️ PR (Outreach)        │ 📝 Generator (AI Ideas)      ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📋 Content]  [🎙️ PR]  [⚙️ Settings]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Voice!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📺 Initializing Media Hub...")
    print("=" * 60)
    
    try:
        hub = MediaHub("Saigon Digital Hub")
        # Sample data
        hub.content_writer.create_content("Blog Post", "Client A", ContentType.BLOG_POST, 1000)
        
        print("\n" + hub.format_hub_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")
