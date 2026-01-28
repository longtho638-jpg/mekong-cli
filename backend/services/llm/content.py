from typing import Dict, Optional

from backend.services.llm.service import LLMService


class ContentService:
    """
    Service for specialized content generation tasks.
    Uses LLMService to generate structured content.
    """

    def __init__(self):
        self.llm_service = LLMService()

    async def generate_blog_post(
        self,
        topic: str,
        keywords: Optional[str] = None,
        tone: str = "professional",
        length: str = "medium"
    ) -> str:
        """
        Generate a blog post based on parameters.
        """
        system_instruction = f"""
        You are an expert content writer and SEO specialist.
        Write a blog post in a {tone} tone.
        Target length: {length}.
        Ensure the content is engaging, well-structured with H2/H3 headings, and SEO-optimized.
        Output in Markdown format.
        """

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
        content_description: str,
        platform: str = "linkedin"
    ) -> str:
        """
        Generate a social media caption.
        """
        system_instruction = f"""
        You are a social media manager.
        Write a caption for {platform}.
        Include relevant hashtags and emojis.
        Keep it concise and engaging.
        """

        prompt = f"Content description: {content_description}"

        return await self.llm_service.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.9
        )

    async def optimize_seo(self, content: str) -> str:
        """
        Optimize existing content for SEO.
        """
        system_instruction = """
        You are an SEO expert.
        Analyze the provided content and rewrite it to improve SEO.
        - Improve readability.
        - Optimize headings.
        - Ensure keyword density is natural.
        - Add a meta description at the end.
        Output the rewritten content in Markdown.
        """

        return await self.llm_service.generate_text(
            prompt=f"Content to optimize:\n{content}",
            system_instruction=system_instruction,
            temperature=0.5
        )
