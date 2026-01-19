"""
Unified LLM Client
==================
Simple wrapper to execute prompts against configured providers.
"""

import logging
from typing import Optional

from core.config import get_settings

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self):
        self.settings = get_settings()
        self.provider = "gemini"  # Default

        # Check available keys
        if self.settings.GEMINI_API_KEY:
            self.provider = "gemini"
        elif self.settings.ANTHROPIC_API_KEY:
            self.provider = "anthropic"
        elif self.settings.OPENAI_API_KEY:
            self.provider = "openai"
        else:
            self.provider = "mock"

    def complete(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Execute completion."""
        if self.provider == "mock":
            return f"[MOCK LLM] Processed: {prompt[:50]}..."

        try:
            if self.provider == "gemini":
                return self._call_gemini(prompt, system_instruction)
            # Add other providers here
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            return f"Error executing task: {e}"

        return "[MOCK LLM] Provider not implemented yet"

    def _call_gemini(self, prompt: str, system: Optional[str]) -> str:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.settings.GEMINI_API_KEY)

            config = types.GenerateContentConfig(system_instruction=system) if system else None

            response = client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt, config=config
            )
            return response.text
        except ImportError:
            logger.warning("google-genai package not installed")
            return "[Missing Dependency: google-genai]"
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            raise e
