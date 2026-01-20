"""
Content Module - Service Logic (Generator)
"""
import logging
from typing import Dict, List

from core.infrastructure.cache import CacheManager

from .entities import ContentIdea, ContentPillar
from .templates import get_default_templates

logger = logging.getLogger(__name__)

class ContentGenerator:
    """
    AI Content Generator System.
    Generates tailored social media strategy based on Agency DNA.
    """

    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        self.cache = CacheManager()

        logger.info(f"Content Generator initialized for {agency_name} ({niche})")
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[ContentPillar, List[Dict]]:
        """Load content templates mapped to variables."""
        cache_key = f"content_templates_{self.niche}_{self.location}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        templates = get_default_templates(self.agency_name, self.niche, self.location, self.skill)

        # In a real scenario, these templates might be fetched from an API or DB
        # Caching them simulates saving that fetch time.
        self.cache.set(cache_key, templates)
        return templates

    def generate_50_ideas(self) -> List[ContentIdea]:
        """Generate full set of 50 content ideas (10 per pillar)."""
        ideas = []
        for pillar, templates in self.templates.items():
            for t in templates:
                idea = ContentIdea(
                    pillar=pillar,
                    title=t["title"],
                    hook=t["hook"],
                    format=t["format"],
                    cta=f"Follow {self.agency_name} for more {self.niche} insights!",
                )
                ideas.append(idea)

        logger.info(f"Successfully generated {len(ideas)} ideas.")
        return ideas

    def format_content_calendar(self, ideas: List[ContentIdea]) -> str:
        """Delegate formatting to Presenter (backward compat helper)."""
        from .presentation import ContentPresenter
        return ContentPresenter.format_calendar_view(self, ideas)

    def format_calendar_view(self, ideas: List[ContentIdea]) -> str:
        """Alias for format_content_calendar."""
        return self.format_content_calendar(ideas)
