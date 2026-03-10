from __future__ import annotations

"""Mekong CLI - LLM Provider Abstractions.

Pluggable provider interface. Subclass LLMProvider to add new backends.
Built-in: GeminiProvider, OpenAICompatibleProvider, OfflineProvider.
"""

from abc import ABC, abstractmethod  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from typing import Any, Optional  # noqa: E402

import json  # noqa: E402
import logging  # noqa: E402
import os  # noqa: E402
import random  # noqa: E402
import time  # noqa: E402
import urllib.error  # noqa: E402
import urllib.request  # noqa: E402

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM call."""

    content: str
    model: str = ""
    usage: Optional[dict[str, int]] = None
    raw: Optional[dict[str, Any]] = None

    def __post_init__(self) -> None:
        if self.usage is None:
            self.usage = {}
        if self.raw is None:
            self.raw = {}


class LLMProvider(ABC):
    """Abstract LLM provider. Subclass to add new providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique provider identifier (used as circuit-breaker key)."""
        ...

    @abstractmethod
    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        """Send chat request. Raise on failure (caller handles failover)."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if provider is configured and usable."""
        ...


# ---------------------------------------------------------------------------
# GeminiProvider
# ---------------------------------------------------------------------------

class GeminiProvider(LLMProvider):
    """Google GenAI (Gemini) provider via google-genai SDK."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-pro") -> None:
        self._api_key = api_key
        self._default_model = model
        self._client = None
        self._available = False

        if not api_key:
            return

        # Lazy import — catch if SDK not installed
        try:
            from google import genai  # type: ignore

            # Remove GOOGLE_API_KEY to prevent SDK conflict
            os.environ.pop("GOOGLE_API_KEY", None)
            self._client = genai.Client(api_key=api_key)
            self._available = True
        except ImportError:
            logger.warning("[GeminiProvider] google-genai not installed — disabled")

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return self._available

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        if not self._client:
            msg = "GeminiProvider not available (SDK missing or no key)"
            raise RuntimeError(msg)

        # Remove GOOGLE_API_KEY at call time too
        os.environ.pop("GOOGLE_API_KEY", None)

        # Ensure client is initialized (may be needed after key set post-init)
        if not self._client:
            from google import genai  # type: ignore
            self._client = genai.Client(api_key=self._api_key)

        system_instruction = None
        prompt_parts: list[str] = []

        for m in messages:
            role = m.get("role", "")
            content = m.get("content", "")
            if role == "system":
                system_instruction = content
            elif role == "user":
                prompt_parts.append(content)

        prompt_text = "\n\n".join(prompt_parts) if prompt_parts else ""

        if not prompt_text.strip():
            logger.warning("[GeminiProvider] Empty prompt")
            msg = "Empty prompt"
            raise ValueError(msg)

        config: dict[str, Any] = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            config["response_mime_type"] = "application/json"
        if system_instruction:
            config["system_instruction"] = system_instruction

        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(
                    "[GeminiProvider] %s attempt %d/%d", model, attempt + 1, max_retries,
                )
                response = self._client.models.generate_content(
                    model=model,
                    contents=prompt_text,
                    config=config,
                )

                text = None
                try:
                    text = response.text
                except (ValueError, AttributeError):
                    if (
                        response.candidates
                        and response.candidates[0].content
                        and response.candidates[0].content.parts
                    ):
                        text = response.candidates[0].content.parts[0].text

                finish_reason = "unknown"
                if response.candidates:
                    finish_reason = str(response.candidates[0].finish_reason)

                if not text:
                    logger.warning(
                        "[GeminiProvider] Empty response (attempt %d), reason=%s",
                        attempt + 1, finish_reason,
                    )
                    if attempt < max_retries - 1:
                        time.sleep(random.uniform(0, 2 ** attempt))
                        continue
                    msg = f"Empty response after {max_retries} attempts"
                    raise RuntimeError(msg)

                tokens = 0
                if response.usage_metadata:
                    tokens = response.usage_metadata.total_token_count

                return LLMResponse(
                    content=text,
                    model=model,
                    usage={"total_tokens": tokens},
                    raw={"finish_reason": finish_reason},
                )

            except Exception as e:
                error_str = str(e).lower()
                retryable = any(
                    kw in error_str
                    for kw in ["429", "resource_exhausted", "quota", "503", "500",
                               "deadline", "timeout", "unavailable"]
                )
                if retryable and attempt < max_retries - 1:
                    delay = random.uniform(0, 2 ** attempt)
                    logger.warning(
                        "[GeminiProvider] Retryable error (attempt %d): %s. Retry in %.1fs",
                        attempt + 1, e, delay,
                    )
                    time.sleep(delay)
                    continue
                logger.exception("[GeminiProvider] Failed: %s", e)
                raise

        msg = "GeminiProvider: all retries exhausted"
        raise RuntimeError(msg)


# ---------------------------------------------------------------------------
# OpenAICompatibleProvider
# ---------------------------------------------------------------------------

class OpenAICompatibleProvider(LLMProvider):
    """OpenAI-compatible REST provider.

    Works with: OpenAI, Anthropic proxy, Ollama, vLLM, Antigravity Proxy,
    and any endpoint that implements /chat/completions.
    Uses urllib (stdlib) — no requests dependency.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str = "",
        model: str = "",
        provider_name: str = "openai_compatible",
        timeout: int = 60,
    ) -> None:
        self._base_url = base_url.rstrip("/") if base_url else ""
        self._api_key = api_key
        self._default_model = model
        self._provider_name = provider_name
        self._timeout = timeout

    @property
    def name(self) -> str:
        return self._provider_name

    def is_available(self) -> bool:
        return bool(self._base_url)

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        if not self._base_url:
            msg = f"{self.name}: no base_url configured"
            raise RuntimeError(msg)

        use_model = model or self._default_model
        payload: dict[str, Any] = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        url = f"{self._base_url}/chat/completions"
        logger.debug("[%s] POST %s model=%s", self.name, url, use_model)

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            msg = f"{self.name} HTTP {e.code}: {e.reason}"
            raise RuntimeError(
                msg,
            ) from e
        except urllib.error.URLError as e:
            msg = f"{self.name} connection error: {e}"
            raise RuntimeError(msg) from e

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return LLMResponse(
            content=content,
            model=data.get("model", use_model),
            usage=usage,
            raw=data,
        )


# ---------------------------------------------------------------------------
# OfflineProvider
# ---------------------------------------------------------------------------

class OfflineProvider(LLMProvider):
    """Placeholder provider — returns offline messages when no LLM is available."""

    @property
    def name(self) -> str:
        return "offline"

    def is_available(self) -> bool:
        return True  # Always "available" as last-resort fallback

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        user_msg = "unknown"
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break

        content = f"[OFFLINE MODE] LLM unavailable. Request: {user_msg[:200]}"
        return LLMResponse(content=content, model="offline")


__all__ = [
    "GeminiProvider",
    "LLMProvider",
    "LLMResponse",
    "OfflineProvider",
    "OpenAICompatibleProvider",
]
