"""
Mekong CLI - LLM Client

Provides LLM integration supporting Google GenAI (Gemini), Antigravity Proxy, and OpenAI.
Priority:
1. GEMINI_API_KEY (Google GenAI - Gemini 2.5 Pro)
2. ANTIGRAVITY_PROXY_URL (custom proxy)
3. OPENAI_API_KEY (direct OpenAI)
4. Fallback: offline mode
"""

import os
import json
import logging
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM call"""

    content: str
    model: str = ""
    usage: Dict[str, int] = None
    raw: Dict[str, Any] = None

    def __post_init__(self):
        if self.usage is None:
            self.usage = {}
        if self.raw is None:
            self.raw = {}


class LLMClient:
    """
    LLMClient supporting Google GenAI (Gemini), Antigravity Proxy, and OpenAI.
    """

    def __init__(
        self,
        proxy_url: Optional[str] = None,
        api_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        model: str = "gemini-2.5-pro",
        timeout: int = 60,
    ):
        self.proxy_url = proxy_url or os.getenv("ANTIGRAVITY_PROXY_URL", "")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model
        self.timeout = timeout
        self._genai_client = None

        # Determine mode
        if self.gemini_key:
            self.mode = "vertex"
            try:
                from google import genai

                self._genai_client = genai.Client(api_key=self.gemini_key)
            except ImportError:
                logger.warning("google-genai not installed, falling back")
                self.mode = "offline"
        elif self.proxy_url:
            self.mode = "proxy"
            self.base_url = self.proxy_url.rstrip("/")
        elif self.api_key:
            self.mode = "openai"
            self.base_url = "https://api.openai.com/v1"
        else:
            self.mode = "offline"
            self.base_url = ""

    @property
    def is_available(self) -> bool:
        """Check if LLM is available"""
        return self.mode != "offline"

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> LLMResponse:
        """
        Send chat completion request.
        """
        if self.mode == "offline":
            return self._offline_response(messages)

        if self.mode == "vertex" and self._genai_client:
            return self._vertex_chat(
                messages, model, temperature, max_tokens, json_mode
            )

        use_model = model or self.model

        payload: Dict[str, Any] = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Content-Type": "application/json",
        }

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            url = f"{self.base_url}/chat/completions"
            logger.debug(f"[LLM] {self.mode} -> {use_model}: {url}")

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            return LLMResponse(
                content=content,
                model=data.get("model", use_model),
                usage=usage,
                raw=data,
            )

        except requests.exceptions.Timeout:
            logger.warning(f"[LLM] Timeout after {self.timeout}s")
            return self._offline_response(messages, error="timeout")
        except requests.exceptions.RequestException as e:
            logger.warning(f"[LLM] Request failed: {e}")
            return self._offline_response(messages, error=str(e))
        except (KeyError, IndexError) as e:
            logger.warning(f"[LLM] Unexpected response format: {e}")
            return self._offline_response(messages, error=str(e))

    def _vertex_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Handle chat via Google GenAI SDK."""
        use_model = model or self.model

        system_instruction = None
        prompt_text = ""

        for m in messages:
            role = m["role"]
            content = m["content"]
            if role == "system":
                system_instruction = content
            elif role == "user":
                # Ensure we capture the user prompt.
                # If there are multiple, this takes the last one, which is typical for simple agents.
                prompt_text = content

        config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            config["response_mime_type"] = "application/json"

        if system_instruction:
            config["system_instruction"] = system_instruction

        try:
            logger.debug(f"[LLM] vertex -> {use_model}")
            response = self._genai_client.models.generate_content(
                model=use_model,
                contents=prompt_text,
                config=config,
            )

            # Helper to safely get total tokens
            tokens = 0
            if response.usage_metadata:
                tokens = response.usage_metadata.total_token_count

            return LLMResponse(
                content=response.text,
                model=use_model,
                usage={"total_tokens": tokens},
                raw={"finish_reason": "success"},
            )
        except Exception as e:
            logger.error(f"[LLM] Vertex call failed: {e}")
            return self._offline_response(messages, error=str(e))

    def generate(self, prompt: str, **kwargs) -> str:
        """
        Simple text generation helper.
        """
        messages = [{"role": "user", "content": prompt}]
        response = self.chat(messages, **kwargs)
        return response.content

    def generate_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Generate and parse JSON response.
        """
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. Always respond with valid JSON.",
            },
            {"role": "user", "content": prompt},
        ]
        response = self.chat(messages, json_mode=True, **kwargs)

        try:
            return json.loads(response.content)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re

            json_match = re.search(
                r"```(?:json)?\s*\n(.*?)\n```", response.content, re.DOTALL
            )
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            # Last resort: return as-is wrapped
            return {"raw_content": response.content}

    def _offline_response(
        self, messages: List[Dict[str, str]], error: str = ""
    ) -> LLMResponse:
        """Generate offline placeholder response"""
        user_msg = "unknown"
        for m in reversed(messages):
            if m["role"] == "user":
                user_msg = m["content"]
                break

        content = (
            f"[OFFLINE MODE] LLM unavailable"
            f"{f' ({error})' if error else ''}. "
            f"Request: {user_msg[:200]}"
        )
        return LLMResponse(content=content, model="offline")


# Module-level convenience
_default_client: Optional[LLMClient] = None


def get_client() -> LLMClient:
    """Get or create default LLM client"""
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client


__all__ = ["LLMClient", "LLMResponse", "get_client"]
