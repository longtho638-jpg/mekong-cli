from typing import Dict, Optional
from sqlalchemy.orm import Session

from backend.services.llm.service import LLMService
from backend.services.llm.prompts import PromptTemplates
from backend.services.llm.prompt_service import prompt_service


class ContentService:
    """
    Service for specialized content generation tasks.
    Uses LLMService to generate structured content.
    """

    def __init__(self):
        self.llm_service = LLMService()

    async def generate_blog_post(
        self,
        db: Session,
        topic: str,
        keywords: Optional[str] = None,
        tone: str = "professional",
        length: str = "medium"
    ) -> str:
        """
        Generate a blog post based on parameters.
        """
        # Try to get prompt from DB
        db_prompt = prompt_service.get_prompt_by_slug(db, "blog-post-generator")

        if db_prompt:
            # Use dynamic prompt from DB
            system_instruction = db_prompt.content.format(
                tone=tone,
                length=length
            )
        else:
            # Fallback to hardcoded template
            system_instruction = PromptTemplates.BLOG_POST_SYSTEM.value.format(
                tone=tone,
                length=length
            )

        prompt = f"Topic: {topic}\n"
        if keywords:
            prompt += f"Keywords to include: {keywords}\n"

        return await self.llm_service.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.8
        )

    async def generate_social_media_caption(
        self,
        db: Session,
        content_description: str,
        platform: str = "linkedin"
    ) -> str:
        """
        Generate a social media caption.
        """
        db_prompt = prompt_service.get_prompt_by_slug(db, "social-media-caption")

        if db_prompt:
            system_instruction = db_prompt.content.format(
                platform=platform
            )
        else:
            system_instruction = PromptTemplates.SOCIAL_MEDIA_CAPTION.value.format(
                platform=platform
            )

        prompt = f"Content description: {content_description}"

        return await self.llm_service.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.9
        )

    async def optimize_seo(self, db: Session, content: str) -> str:
        """
        Optimize existing content for SEO.
        """
        db_prompt = prompt_service.get_prompt_by_slug(db, "seo-optimizer")

        if db_prompt:
            system_instruction = db_prompt.content
        else:
            system_instruction = PromptTemplates.SEO_OPTIMIZATION.value

        return await self.llm_service.generate_text(
            prompt=f"Content to optimize:\n{content}",
            system_instruction=system_instruction,
            temperature=0.5
        )
