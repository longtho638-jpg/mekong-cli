"""
📰 Journalist - News & Stories
================================

Create compelling news and stories.
Truth that resonates!

Roles:
- News articles
- Interviews
- Feature stories
- Press releases
"""

from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class StoryType(Enum):
    """Story types."""
    NEWS = "news"
    FEATURE = "feature"
    INTERVIEW = "interview"
    OPINION = "opinion"
    REVIEW = "review"
    PRESS_RELEASE = "press_release"


class StoryStatus(Enum):
    """Story status."""
    PITCHED = "pitched"
    RESEARCHING = "researching"
    INTERVIEWING = "interviewing"
    WRITING = "writing"
    FACT_CHECK = "fact_check"
    PUBLISHED = "published"


@dataclass
class Story:
    """A news story."""
    id: str
    headline: str
    client: str
    story_type: StoryType
    sources: List[str]
    status: StoryStatus = StoryStatus.PITCHED
    journalist: str = ""
    word_count: int = 0
    publication: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=3))


class Journalist:
    """
    Journalist System.
    
    News and stories workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.stories: Dict[str, Story] = {}
    
    def pitch_story(
        self,
        headline: str,
        client: str,
        story_type: StoryType,
        journalist: str = "",
        publication: str = "",
        due_days: int = 3
    ) -> Story:
        """Pitch a new story."""
        story = Story(
            id=f"STY-{uuid.uuid4().hex[:6].upper()}",
            headline=headline,
            client=client,
            story_type=story_type,
            sources=[],
            journalist=journalist,
            publication=publication,
            deadline=datetime.now() + timedelta(days=due_days)
        )
        self.stories[story.id] = story
        return story
    
    def add_source(self, story: Story, source: str):
        """Add a source to story."""
        story.sources.append(source)
    
    def update_status(self, story: Story, status: StoryStatus, word_count: int = 0):
        """Update story status."""
        story.status = status
        if word_count:
            story.word_count = word_count
    
    def get_active_stories(self) -> List[Story]:
        """Get active stories."""
        return [s for s in self.stories.values() if s.status != StoryStatus.PUBLISHED]
    
    def format_dashboard(self) -> str:
        """Format journalist dashboard."""
        active = len(self.get_active_stories())
        published = sum(1 for s in self.stories.values() if s.status == StoryStatus.PUBLISHED)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  📰 JOURNALIST                                            ║",
            f"║  {len(self.stories)} stories │ {active} active │ {published} published         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 STORY BOARD                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"news": "📰", "feature": "⭐", "interview": "🎤", 
                     "opinion": "💭", "review": "📝", "press_release": "📢"}
        status_icons = {"pitched": "💡", "researching": "🔍", "interviewing": "🎤",
                       "writing": "✏️", "fact_check": "✅", "published": "🚀"}
        
        for story in list(self.stories.values())[:5]:
            t_icon = type_icons.get(story.story_type.value, "📰")
            s_icon = status_icons.get(story.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {story.headline[:22]:<22} │ {len(story.sources)} sources │ {story.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for stype in list(StoryType)[:4]:
            count = sum(1 for s in self.stories.values() if s.story_type == stype)
            icon = type_icons.get(stype.value, "📰")
            lines.append(f"║    {icon} {stype.value.replace('_', ' ').title():<15} │ {count:>2} stories               ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [💡 Pitch]  [🔍 Research]  [✏️ Write]                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Truth that resonates!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    journalist = Journalist("Saigon Digital Hub")
    
    print("📰 Journalist")
    print("=" * 60)
    print()
    
    s1 = journalist.pitch_story("New Office Opening", "Sunrise Realty", StoryType.NEWS, "Alex", "VN Express")
    s2 = journalist.pitch_story("Founder Interview", "Coffee Lab", StoryType.INTERVIEW, "Sarah", "Forbes VN")
    s3 = journalist.pitch_story("Tech Trends 2025", "Tech Startup", StoryType.FEATURE, "Alex")
    
    # Add sources and update
    journalist.add_source(s1, "CEO")
    journalist.add_source(s1, "PR Manager")
    journalist.update_status(s1, StoryStatus.WRITING, 800)
    journalist.update_status(s2, StoryStatus.INTERVIEWING)
    
    print(journalist.format_dashboard())
