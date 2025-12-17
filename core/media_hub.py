"""
📺 Media Hub - Department Integration
=======================================

Central hub connecting all Media & Communications roles
with their operational tools.

Integrates:
- Content Writer → content_generator.py
- Journalist → news & stories
- PR Specialist → public relations
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import existing Ops modules
from core.content_generator import ContentGenerator, ContentPillar

# Import role modules
from core.content_writer import ContentWriter, ContentType
from core.journalist import Journalist, StoryType
from core.pr_specialist import PRSpecialist, PRActivityType


@dataclass
class MediaMetrics:
    """Department-wide metrics."""
    total_content_pieces: int
    total_stories: int
    total_pr_activities: int
    coverage_count: int
    words_written: int
    media_contacts: int


class MediaHub:
    """
    Media & Communications Hub.
    
    Connects all media roles with their tools.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize Ops modules
        self.content_ops = ContentGenerator(agency_name, "Digital Marketing", "Vietnam", "Content")
        
        # Initialize role modules
        self.content_writer = ContentWriter(agency_name)
        self.journalist = Journalist(agency_name)
        self.pr_specialist = PRSpecialist(agency_name)
    
    def get_department_metrics(self) -> MediaMetrics:
        """Get department-wide metrics."""
        coverage_stats = self.pr_specialist.get_coverage_stats()
        
        return MediaMetrics(
            total_content_pieces=len(self.content_writer.content),
            total_stories=len(self.journalist.stories),
            total_pr_activities=len(self.pr_specialist.activities),
            coverage_count=coverage_stats.get("total", 0),
            words_written=sum(c.word_count for c in self.content_writer.content.values()),
            media_contacts=len(self.pr_specialist.contacts)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📺 MEDIA & COMMUNICATIONS HUB                            ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    ✍️ Content Pieces:     {metrics.total_content_pieces:>5}                          ║",
            f"║    📰 Stories:            {metrics.total_stories:>5}                          ║",
            f"║    🎙️ PR Activities:      {metrics.total_pr_activities:>5}                          ║",
            f"║    📈 Media Coverage:     {metrics.coverage_count:>5}                          ║",
            f"║    📝 Words Written:      {metrics.words_written:>5}                          ║",
            f"║    📇 Media Contacts:     {metrics.media_contacts:>5}                          ║",
            "║                                                           ║",
            "║  🔗 ROLE → OPS CONNECTIONS                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    ✍️ Content Writer     → content_generator.py          ║",
            "║    📰 Journalist         → news workflows                ║",
            "║    🎙️ PR Specialist      → media relations               ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    ✍️ Content Writer    │ {len(self.content_writer.content):>2} pieces                 ║",
            f"║    📰 Journalist        │ {len(self.journalist.stories):>2} stories                 ║",
            f"║    🎙️ PR Specialist     │ {len(self.pr_specialist.activities):>2} campaigns              ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📋 Content]  [⚙️ Settings]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Voice of the brand!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = MediaHub("Saigon Digital Hub")
    
    print("📺 Media & Communications Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.content_writer.create_content("Blog Post", "Client A", ContentType.BLOG_POST, 1000)
    hub.journalist.pitch_story("News Story", "Client B", StoryType.NEWS)
    hub.pr_specialist.create_activity("Press Release", "Client C", PRActivityType.PRESS_RELEASE)
    hub.pr_specialist.add_contact("John Doe", "Tech News", "john@tech.com", "Tech")
    
    print(hub.format_hub_dashboard())
