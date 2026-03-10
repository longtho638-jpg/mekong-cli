"""ALGO 7 — Fallback Chain.

Handles model failures with ordered fallback hierarchy.
CRITICAL RULE: data_sensitivity == "sensitive" → NEVER call API, only local models.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine

from src.core.model_selector import ModelConfig, detect_provider
from src.core.cost_estimator import COST_TABLE

logger = logging.getLogger(__name__)

FALLBACK_HIERARCHY: dict[str, list[str]] = {
    "claude-opus-4-6": ["claude-sonnet-4-6", "gemini-2.0-pro"],
    "claude-sonnet-4-6": ["claude-haiku-4-5", "gemini-2.0-flash"],
    "claude-haiku-4-5": ["gemini-2.0-flash", "gpt-4o-mini"],
    "gemini-2.0-pro": ["claude-sonnet-4-6", "gpt-4o"],
    "gemini-2.0-flash": ["gpt-4o-mini", "claude-haiku-4-5"],
    "gemini-2.0-flash-lite": ["gpt-4o-mini", "ollama:llama3.2:3b"],
    "ollama:deepseek-coder-v2:33b": ["claude-sonnet-4-6", "gemini-2.0-flash"],
    "ollama:llama3.3:70b": ["gemini-2.0-flash", "gpt-4o-mini"],
    "ollama:llama3.2:3b": ["gemini-2.0-flash-lite"],
    "ollama:qwen2.5:7b": ["gemini-2.0-flash-lite"],
    "ollama:mistral:7b": ["claude-haiku-4-5", "gemini-2.0-flash"],
}

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = [1, 3, 9]


@dataclass
class FallbackResult:
    """Result of fallback chain execution."""

    success: bool
    model_used: str | None = None
    tokens_output: int = 0
    error: str = ""
    attempts: list[str] = field(default_factory=list)
    output: str = ""


def rebuild_config(model_id: str, temperature: float = 0.3, max_tokens: int = 4096) -> ModelConfig:
    """Rebuild ModelConfig for a fallback model."""
    provider = detect_provider(model_id)
    costs = COST_TABLE.get(model_id, (0.0, 0.0))
    return ModelConfig(
        model_id=model_id,
        provider=provider,
        max_tokens=max_tokens,
        temperature=temperature,
        context_window=32000,
        cost_per_mtok_input=costs[0],
        cost_per_mtok_output=costs[1],
    )


def get_fallback_models(
    model_id: str,
    attempted: list[str],
    data_sensitivity: str = "public",
) -> list[str]:
    """Get available fallback models, respecting sensitivity constraints.

    CRITICAL: If data_sensitivity == "sensitive", API models are BLOCKED.
    Only local (ollama:) models are allowed for sensitive data.
    """
    fallbacks = FALLBACK_HIERARCHY.get(model_id, [])
    candidates = [m for m in fallbacks if m not in attempted]

    if data_sensitivity == "sensitive":
        api_candidates = [m for m in candidates if not m.startswith("ollama:")]
        if api_candidates:
            logger.warning(
                "Sensitive data: blocking API fallbacks %s", api_candidates
            )
        candidates = [m for m in candidates if m.startswith("ollama:")]

    return candidates


async def execute_with_fallback(
    model_config: ModelConfig,
    messages: list[dict],
    system_prompt: str | None,
    on_token_cb: Callable[[str], Coroutine[Any, Any, None]] | None,
    data_sensitivity: str = "public",
) -> FallbackResult:
    """Execute LLM call with automatic fallback on failure.

    Args:
        model_config: Initial model configuration.
        messages: Chat messages.
        system_prompt: Optional system prompt.
        on_token_cb: Async callback for streaming tokens.
        data_sensitivity: "public", "internal", or "sensitive".

    Returns:
        FallbackResult with success/failure and metadata.
    """
    attempted: list[str] = []
    current_config = model_config
    collected_output: list[str] = []

    for attempt in range(MAX_RETRIES):
        current_model = current_config.model_id
        attempted.append(current_model)
        tokens_used = 0

        try:
            if current_model.startswith("ollama:"):
                from src.core.local_adapter import OllamaAdapter

                adapter = OllamaAdapter()
                async for token in adapter.generate(
                    current_model, messages,
                    temperature=current_config.temperature,
                    max_tokens=current_config.max_tokens,
                ):
                    if on_token_cb:
                        await on_token_cb(token)
                    collected_output.append(token)
                    tokens_used += 1
            else:
                from src.core.api_adapter import APIAdapter

                api_adapter = APIAdapter()
                async for token in api_adapter.generate(
                    current_config, messages, system_prompt
                ):
                    if on_token_cb:
                        await on_token_cb(token)
                    collected_output.append(token)
                    tokens_used += 1

            return FallbackResult(
                success=True,
                model_used=current_model,
                tokens_output=tokens_used,
                attempts=attempted,
                output="".join(collected_output),
            )

        except RateLimitError:
            logger.warning("Rate limit: %s (attempt %d)", current_model, attempt + 1)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS[attempt])
            continue

        except (ConnectionError, TimeoutError, OSError) as e:
            logger.warning("Model unavailable: %s — %s", current_model, e)
            next_models = get_fallback_models(
                current_model, attempted, data_sensitivity
            )

            if not next_models:
                break

            current_config = rebuild_config(
                next_models[0],
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens,
            )
            logger.info("Falling back to: %s", next_models[0])
            collected_output.clear()

    return FallbackResult(
        success=False,
        model_used=None,
        error="all_models_failed",
        attempts=attempted,
    )


class RateLimitError(Exception):
    """Raised when API returns 429 rate limit."""
