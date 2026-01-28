from typing import AsyncGenerator, Dict, List, Optional

from backend.api.config.settings import settings
from backend.services.llm.provider import GeminiProvider, LLMProvider, OpenAIProvider


class LLMService:
    """
    Unified LLM Service.
    Manages provider selection and high-level interactions.
    """

    _instance = None
    _provider: Optional[LLMProvider] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
        return cls._instance

    def _get_provider(self, provider_name: Optional[str] = None) -> LLMProvider:
        """
        Factory method to get the LLM provider.
        """
        name = provider_name or settings.default_llm_provider

        if self._provider and self._provider.__class__.__name__.lower().startswith(name):
            return self._provider

        if name == "gemini":
            if not settings.google_api_key:
                 # Fallback for dev/testing if no key provided, though it will fail on call
                 # In a real scenario, we might raise error here or use a mock
                 pass
            self._provider = GeminiProvider(api_key=settings.google_api_key or "")
        elif name == "openai":
            self._provider = OpenAIProvider(api_key=settings.openai_api_key or "")
        elif name == "anthropic":
             # Placeholder for Claude implementation
             raise NotImplementedError("Anthropic provider not yet implemented")
        else:
            # Default to Gemini
            self._provider = GeminiProvider(api_key=settings.google_api_key or "")

        return self._provider

    async def generate_text(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> str:
        """
        Generate text using the configured provider.
        """
        llm = self._get_provider(provider)
        target_model = model or settings.default_llm_model
        return await llm.generate_text(
            prompt=prompt,
            model=target_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system_instruction=system_instruction
        )

    async def generate_stream(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream text generation.
        """
        llm = self._get_provider(provider)
        target_model = model or settings.default_llm_model
        async for chunk in llm.generate_stream(
            prompt=prompt,
            model=target_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system_instruction=system_instruction
        ):
            yield chunk

    async def chat(
        self,
        messages: List[Dict[str, str]],
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Chat with history.
        """
        llm = self._get_provider(provider)
        target_model = model or settings.default_llm_model
        return await llm.chat(
            messages=messages,
            model=target_model,
            max_tokens=max_tokens,
            temperature=temperature
        )
