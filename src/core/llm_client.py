"""
Mekong CLI - LLM Client

Provides LLM integration via Antigravity Proxy or direct API.
Supports OpenAI-compatible endpoints (Antigravity, OpenAI, Gemini).
"""

import os
import json
import logging
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
    LLM client supporting Antigravity Proxy and OpenAI-compatible APIs.

    Priority:
    1. ANTIGRAVITY_PROXY_URL (custom proxy with model routing)
    2. OPENAI_API_KEY (direct OpenAI)
    3. Fallback: offline mode (returns structured placeholder)
    """

    def __init__(
        self,
        proxy_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        timeout: int = 60,
    ):
        self.proxy_url = proxy_url or os.getenv("ANTIGRAVITY_PROXY_URL", "")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model
        self.timeout = timeout

        # Determine mode
        if self.proxy_url:
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

        Args:
            messages: List of {"role": "...", "content": "..."} messages
            model: Override default model
            temperature: Sampling temperature
            max_tokens: Max response tokens
            json_mode: Request JSON output format

        Returns:
            LLMResponse with content
        """
        if self.mode == "offline":
            return self._offline_response(messages)

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
            logger.debug(f"[LLM] {self.mode} → {use_model}: {url}")

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

    def generate(self, prompt: str, **kwargs) -> str:
        """
        Simple text generation helper.

        Args:
            prompt: User prompt
            **kwargs: Passed to chat()

        Returns:
            Generated text content
        """
        messages = [{"role": "user", "content": prompt}]
        response = self.chat(messages, **kwargs)
        return response.content

    def generate_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Generate and parse JSON response.

        Args:
            prompt: User prompt (should ask for JSON)
            **kwargs: Passed to chat()

        Returns:
            Parsed JSON dict
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

            json_match = re.search(r"```(?:json)?\s*\n(.*?)\n```", response.content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            # Last resort: return as-is wrapped
            return {"raw_content": response.content}

    def _offline_response(
        self, messages: List[Dict[str, str]], error: str = ""
    ) -> LLMResponse:
        """Generate offline placeholder response"""
        user_msg = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"),
            "unknown request",
        )
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
