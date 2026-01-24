"""
Content Production Engine Logic
==================================

Automates the generation of strategic, localized content for multiple channels.
Bridges the gap between raw data and audience engagement by applying
specialized templates and regional tones.
"""

import logging
from antigravity.core.mixins import StatsMixin
from antigravity.core.patterns import singleton_factory
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from .ideation import ContentIdeator
from .models import ContentIdea, ContentPiece, ContentType
from .production import ContentProducer
from .scheduling import ContentScheduler

# Configure logging
logger = logging.getLogger(__name__)


class ContentInventoryDict(TypedDict):
    total_ideas: int
    drafts_completed: int


class ContentQualityDict(TypedDict):
    avg_virality: float


class ContentFactoryStatsDict(TypedDict):
    """Production performance summary"""
    inventory: ContentInventoryDict
    quality: ContentQualityDict


class ContentFactory(StatsMixin):
    """
    Content Production Engine

    Powers the 'Content Machine' crew. Turns agency niches into localized
    stories that drive engagement and leads.
    """

    def __init__(self, niche: str = "Digital Marketing", tone: str = "friendly"):
        self.niche = niche
        self.tone = tone
        self.ideas: List[ContentIdea] = []
        self.content_archive: List[ContentPiece] = []

        # Sub-components
        self.ideator = ContentIdeator(niche)
        self.producer = ContentProducer(niche)
        self.scheduler = ContentScheduler()

    def generate_ideas(self, count: int = 10) -> List[ContentIdea]:
        """Brainstorms new content concepts using specialized templates."""
        new_ideas = self.ideator.generate_ideas(count)
        self.ideas.extend(new_ideas)
        return new_ideas

    def create_post(self, idea: ContentIdea) -> ContentPiece:
        """Hydrates a concept into a full content piece based on platform standards."""
        piece = self.producer.create_post(idea)
        self.content_archive.append(piece)
        return piece

    def generate_social_update(self, changelog: str) -> ContentPiece:
        """Generates a social media update from technical changes."""
        piece = self.producer.generate_from_changelog(changelog)
        self.content_archive.append(piece)
        return piece

    def write_article(self, topic: str) -> str:
        """Writes a full article on a given topic."""
        idea = ContentIdea(
            title=topic,
            topic=topic,
            content_type=ContentType.BLOG,
            virality_score=85
        )
        piece = self.create_post(idea)
        return piece.body

    def get_calendar(self, days: int = 7) -> List[Dict[str, Any]]:
        """Generates a scheduled posting timeline."""
        # Ensure we have enough ideas
        if len(self.ideas) < days:
            self.generate_ideas(days - len(self.ideas) + 5)

        result = self.scheduler.create_schedule(self.ideas, days)
        return result  # type: ignore[return-value]

    def _collect_stats(self) -> Dict[str, object]:
        """Summarizes production performance."""
        return {
            "inventory": {
                "total_ideas": len(self.ideas),
                "drafts_completed": len(self.content_archive),
            },
            "quality": {
                "avg_virality": sum(i.virality_score for i in self.ideas) / len(self.ideas)
                if self.ideas
                else 0.0
            },
        }


@singleton_factory
def get_content_factory() -> ContentFactory:
    """Access the shared content factory engine."""
    return ContentFactory()
