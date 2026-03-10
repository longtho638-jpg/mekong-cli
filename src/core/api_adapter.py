"""ALGO 6 — API Adapter.

Unified interface for cloud LLM providers (Anthropic, Google, OpenAI).
Routes to correct SDK based on model_id detection.
"""

from __future__ import annotations

import json
import logging
import os
from typing import AsyncIterator

from src.core.model_selector import ModelConfig

logger = logging.getLogger(__name__)


def detect_provider(model_id: str) -> str:
    """Detect cloud provider from model ID."""
    if model_id.startswith("ollama:"):
        return "ollama"
    if "claude" in model_id:
        return "anthropic"
    if "gemini" in model_id:
        return "google"
    if "gpt" in model_id:
        return "openai"
    raise ValueError(f"Unknown provider for model: {model_id}")


def _get_api_key(provider: str) -> str:
    """Get API key for provider from environment."""
    key_map = {
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GOOGLE_API_KEY",
        "openai": "OPENAI_API_KEY",
    }
    env_var = key_map.get(provider, "")
    key = os.getenv(env_var, "")
    if not key:
        raise EnvironmentError(f"Missing API key: {env_var}")
    return key


def format_for_openai(messages: list[dict], system_prompt: str | None) -> list[dict]:
    """Format messages for OpenAI API (system as first message)."""
    result = []
    if system_prompt:
        result.append({"role": "system", "content": system_prompt})
    result.extend(messages)
    return result


def format_for_gemini(messages: list[dict], system_prompt: str | None) -> list[dict]:
    """Format messages for Gemini API."""
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": system_prompt}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    return contents


class APIAdapter:
    """Unified adapter for cloud LLM providers."""

    async def generate(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream generate from cloud provider.

        Args:
            model_config: Model configuration with provider info.
            messages: Chat messages in OpenAI format.
            system_prompt: Optional system prompt.

        Yields:
            Text chunks from the model.
        """
        provider = detect_provider(model_config.model_id)

        if provider == "anthropic":
            async for token in self._generate_anthropic(model_config, messages, system_prompt):
                yield token
        elif provider == "google":
            async for token in self._generate_google(model_config, messages, system_prompt):
                yield token
        elif provider == "openai":
            async for token in self._generate_openai(model_config, messages, system_prompt):
                yield token
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _generate_anthropic(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via Anthropic API using HTTP."""
        import aiohttp

        api_key = _get_api_key("anthropic")
        base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")

        payload = {
            "model": config.model_id,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "messages": messages,
            "stream": True,
        }
        if system_prompt:
            payload["system"] = system_prompt

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/v1/messages",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=300),
            ) as resp:
                async for line in resp.content:
                    text = line.decode("utf-8").strip()
                    if not text or not text.startswith("data: "):
                        continue
                    data_str = text[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        event = json.loads(data_str)
                        delta = event.get("delta", {})
                        content = delta.get("text", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

    async def _generate_google(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via Google Gemini API using HTTP."""
        import aiohttp

        api_key = _get_api_key("google")
        contents = format_for_gemini(messages, system_prompt)

        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": config.max_tokens,
                "temperature": config.temperature,
            },
        }

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{config.model_id}:streamGenerateContent?alt=sse&key={api_key}"
        )

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300),
            ) as resp:
                async for line in resp.content:
                    text = line.decode("utf-8").strip()
                    if not text or not text.startswith("data: "):
                        continue
                    try:
                        event = json.loads(text[6:])
                        candidates = event.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                if part.get("text"):
                                    yield part["text"]
                    except json.JSONDecodeError:
                        continue

    async def _generate_openai(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via OpenAI API using HTTP."""
        import aiohttp

        api_key = _get_api_key("openai")
        formatted = format_for_openai(messages, system_prompt)

        payload = {
            "model": config.model_id,
            "messages": formatted,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "stream": True,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=300),
            ) as resp:
                async for line in resp.content:
                    text = line.decode("utf-8").strip()
                    if not text or not text.startswith("data: "):
                        continue
                    data_str = text[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        event = json.loads(data_str)
                        delta = event["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    def generate_sync(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> str:
        """Synchronous generation (non-streaming) for simple use cases."""
        import urllib.request

        provider = detect_provider(model_config.model_id)
        api_key = _get_api_key(provider)

        if provider == "anthropic":
            return self._sync_anthropic(model_config, messages, system_prompt, api_key)
        if provider == "google":
            return self._sync_google(model_config, messages, system_prompt, api_key)
        if provider == "openai":
            return self._sync_openai(model_config, messages, system_prompt, api_key)
        return ""

    def _sync_anthropic(self, config: ModelConfig, messages: list[dict], system_prompt: str | None, api_key: str) -> str:
        import urllib.request

        base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
        payload = {
            "model": config.model_id,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "messages": messages,
        }
        if system_prompt:
            payload["system"] = system_prompt

        req = urllib.request.Request(
            f"{base_url}/v1/messages",
            data=json.dumps(payload).encode(),
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                content_blocks = data.get("content", [])
                return "".join(b.get("text", "") for b in content_blocks)
        except Exception as e:
            logger.error("Anthropic sync failed: %s", e)
            return ""

    def _sync_google(self, config: ModelConfig, messages: list[dict], system_prompt: str | None, api_key: str) -> str:
        import urllib.request

        contents = format_for_gemini(messages, system_prompt)
        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": config.max_tokens,
                "temperature": config.temperature,
            },
        }
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{config.model_id}:generateContent?key={api_key}"
        )
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
                return ""
        except Exception as e:
            logger.error("Google sync failed: %s", e)
            return ""

    def _sync_openai(self, config: ModelConfig, messages: list[dict], system_prompt: str | None, api_key: str) -> str:
        import urllib.request

        formatted = format_for_openai(messages, system_prompt)
        payload = {
            "model": config.model_id,
            "messages": formatted,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error("OpenAI sync failed: %s", e)
            return ""
