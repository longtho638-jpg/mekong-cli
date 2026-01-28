from typing import Optional
from backend.services.llm.content import ContentService

class ContentGenerator:
    """
    Facade for Content Generation Service.
    Wraps backend.services.llm.content.ContentService.
    """

    def __init__(self):
        self._service = ContentService()

    async def generate_blog_post(
        self,
        topic: str,
        keywords: Optional[str] = None,
        tone: str = "professional",
        length: str = "medium"
    ) -> str:
        return await self._service.generate_blog_post(topic, keywords, tone, length)

    async def generate_social_media_caption(
        self,
        content_description: str,
        platform: str = "linkedin"
    ) -> str:
        return await self._service.generate_social_media_caption(content_description, platform)

    async def optimize_seo(self, content: str) -> str:
        return await self._service.optimize_seo(content)
