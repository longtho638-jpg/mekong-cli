"""
LiteLLM Provider — routes ALL LLM calls through local LiteLLM proxy.
Replaces direct provider calls with unified proxy endpoint.
"""

import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger("litellm_provider")

LITELLM_URL = os.getenv("LITELLM_URL", "http://localhost:4000")
LITELLM_KEY = os.getenv("LITELLM_MASTER_KEY", "sk-mekong-local")


class LiteLLMProvider:
    """Unified LLM provider via LiteLLM proxy."""

    def __init__(self, base_url: str = LITELLM_URL, api_key: str = LITELLM_KEY):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.client = httpx.Client(timeout=120.0)

    def chat(self, messages: list[dict], model: str = "default",
             max_tokens: int = 4096, temperature: float = 0.3,
             team_id: Optional[str] = None) -> dict:
        """Send chat completion through LiteLLM proxy."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if team_id:
            headers["x-litellm-team-id"] = team_id

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            resp = self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", model),
                "cost": data.get("_hidden_params", {}).get("response_cost", 0),
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("LiteLLM budget exceeded — falling back to local")
                return self._fallback_local(messages, max_tokens, temperature)
            raise
        except httpx.ConnectError:
            logger.warning("LiteLLM proxy unreachable — direct provider fallback")
            return self._fallback_direct(messages, max_tokens, temperature)

    def _fallback_local(self, messages, max_tokens, temperature):
        """Direct Ollama call when proxy budget exceeded."""
        try:
            resp = self.client.post(
                "http://localhost:11434/v1/chat/completions",
                json={"model": "qwen2.5-coder:7b", "messages": messages,
                      "max_tokens": max_tokens, "temperature": temperature},
            )
            data = resp.json()
            return {"content": data["choices"][0]["message"]["content"],
                    "usage": data.get("usage", {}), "model": "ollama/qwen2.5-coder:7b", "cost": 0}
        except Exception:
            return {"content": "LLM unavailable", "usage": {}, "model": "none", "cost": 0}

    def _fallback_direct(self, messages, max_tokens, temperature):
        """Direct Qwen call when proxy is down."""
        api_key = os.getenv("DASHSCOPE_API_KEY")
        if not api_key:
            return self._fallback_local(messages, max_tokens, temperature)
        try:
            resp = self.client.post(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                json={"model": "qwen3-coder-plus", "messages": messages,
                      "max_tokens": max_tokens, "temperature": temperature},
                headers={"Authorization": f"Bearer {api_key}"},
            )
            data = resp.json()
            return {"content": data["choices"][0]["message"]["content"],
                    "usage": data.get("usage", {}), "model": "qwen3-coder-plus", "cost": 0}
        except Exception:
            return self._fallback_local(messages, max_tokens, temperature)

    def get_spend(self, team_id: Optional[str] = None) -> dict:
        """Get current spend from LiteLLM."""
        try:
            url = f"{self.base_url}/spend/logs"
            if team_id:
                url += f"?team_id={team_id}"
            resp = self.client.get(url, headers={"Authorization": f"Bearer {self.api_key}"})
            return resp.json()
        except Exception:
            return {"total_spend": 0, "error": "proxy unreachable"}
