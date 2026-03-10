"""ALGO 5 — Local Adapter (Ollama).

Manages local LLM inference via Ollama API.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from typing import AsyncIterator

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

QUANTIZATION_MAP: dict[str, str] = {
    "llama3.3:70b": "q4_K_M",
    "deepseek-coder-v2:33b": "q4_K_M",
    "deepseek-coder-v2:16b": "q5_K_M",
    "llama3.2:3b": "q8_0",
    "qwen2.5:7b": "q6_K",
    "mistral:7b": "q5_K_M",
}


@dataclass
class OllamaAdapter:
    """Adapter for Ollama local inference."""

    base_url: str = OLLAMA_BASE_URL
    pulled_models: set[str] = field(default_factory=set)

    def health_check(self) -> bool:
        """Check if Ollama is running and responsive."""
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{self.base_url}/api/tags",
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def list_models(self) -> list[str]:
        """List locally available models."""
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{self.base_url}/api/tags",
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                return [m["name"] for m in data.get("models", [])]
        except Exception:
            return []

    def get_vram_load(self) -> float:
        """Estimate VRAM usage (0.0-1.0)."""
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{self.base_url}/api/ps",
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                models = data.get("models", [])
                if not models:
                    return 0.0
                total_size = sum(m.get("size", 0) for m in models)
                gpu_total = int(os.getenv("GPU_TOTAL_VRAM_GB", "8")) * 1_073_741_824
                return min(total_size / gpu_total, 1.0) if gpu_total > 0 else 0.0
        except Exception:
            return 0.0

    async def generate(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Stream generate from Ollama.

        Args:
            model: Ollama model name (without 'ollama:' prefix).
            messages: Chat messages in OpenAI format.
            temperature: Generation temperature.
            max_tokens: Max output tokens.

        Yields:
            Text chunks from the model.
        """
        import aiohttp

        # Strip ollama: prefix if present
        if model.startswith("ollama:"):
            model = model[7:]

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "num_ctx": 4096,
                "num_thread": os.cpu_count() or 4,
            },
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300),
            ) as resp:
                async for line in resp.content:
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        if chunk.get("done"):
                            break
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

    def generate_sync(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        """Synchronous generation for simple use cases."""
        import urllib.request

        if model.startswith("ollama:"):
            model = model[7:]

        payload = json.dumps({
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }).encode()

        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                return data.get("message", {}).get("content", "")
        except Exception as e:
            logger.error("Ollama sync generate failed: %s", e)
            return ""
