from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Optional

from backend.services.llm.types import LLMResponse, TokenUsage


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    Follows the Adapter pattern to unify Gemini, OpenAI, and Claude.
    """

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> LLMResponse:
        """Generate text from a prompt."""
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream text generation."""
        pass

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Chat with history."""
        pass

class GeminiProvider(LLMProvider):
    """Google Gemini Provider using google-genai SDK."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        # Lazy import to avoid hard dependency if not used
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.genai = genai

    async def generate_text(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> LLMResponse:
        model_name = model or "gemini-1.5-flash"

        full_prompt = prompt
        m = None
        if system_instruction:
            m = self.genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
        else:
            m = self.genai.GenerativeModel(model_name)

        response = await m.generate_content_async(
            full_prompt,
            generation_config=self.genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature
            )
        )

        usage = None
        if response.usage_metadata:
             usage = TokenUsage(
                 prompt_tokens=response.usage_metadata.prompt_token_count,
                 completion_tokens=response.usage_metadata.candidates_token_count,
                 total_tokens=response.usage_metadata.total_token_count
             )

        return LLMResponse(content=response.text, usage=usage)

    async def generate_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        model_name = model or "gemini-1.5-flash"

        if system_instruction:
            m = self.genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
        else:
            m = self.genai.GenerativeModel(model_name)

        response = await m.generate_content_async(
            prompt,
            stream=True,
            generation_config=self.genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature
            )
        )

        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        model_name = model or "gemini-1.5-flash"
        m = self.genai.GenerativeModel(model_name)

        history = []
        last_message = None

        for msg in messages[:-1]: # All except last are history
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        last_message = messages[-1]["content"] if messages else ""

        chat = m.start_chat(history=history)
        response = await chat.send_message_async(
            last_message,
            generation_config=self.genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature
            )
        )

        usage = None
        if response.usage_metadata:
             usage = TokenUsage(
                 prompt_tokens=response.usage_metadata.prompt_token_count,
                 completion_tokens=response.usage_metadata.candidates_token_count,
                 total_tokens=response.usage_metadata.total_token_count
             )

        return LLMResponse(content=response.text, usage=usage)

class OpenAIProvider(LLMProvider):
    """OpenAI Provider (Placeholder - requires openai package)."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=api_key)
        except ImportError:
            self.client = None

    async def generate_text(self, prompt: str, model: Optional[str] = None, max_tokens: Optional[int] = None, temperature: float = 0.7, system_instruction: Optional[str] = None) -> LLMResponse:
        if not self.client:
            raise ImportError("openai package not installed")

        model = model or "gpt-4o"
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )

        usage = None
        if response.usage:
            usage = TokenUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens
            )

        return LLMResponse(content=response.choices[0].message.content or "", usage=usage)

    async def generate_stream(self, prompt: str, model: Optional[str] = None, max_tokens: Optional[int] = None, temperature: float = 0.7, system_instruction: Optional[str] = None) -> AsyncGenerator[str, None]:
        if not self.client:
            raise ImportError("openai package not installed")

        model = model or "gpt-4o"
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    async def chat(self, messages: List[Dict[str, str]], model: Optional[str] = None, max_tokens: Optional[int] = None, temperature: float = 0.7) -> LLMResponse:
        if not self.client:
            raise ImportError("openai package not installed")

        model = model or "gpt-4o"
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )

        usage = None
        if response.usage:
            usage = TokenUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens
            )

        return LLMResponse(content=response.choices[0].message.content or "", usage=usage)
