"""Model Alias Map — translate canonical model names to provider-specific names.

When model_selector picks "claude-sonnet-4-6" but active provider is DashScope,
this translates to "qwen3-coder-plus" before API call.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# Canonical → Provider-specific model name mapping
# Grouped by capability tier
MODEL_ALIASES: dict[str, dict[str, str]] = {
    # FLAGSHIP (complex reasoning, code architecture)
    "claude-opus-4-6": {
        "qwen": "qwen3-coder-plus",
        "deepseek": "deepseek-chat",
        "openrouter": "anthropic/claude-opus-4",
        "agentrouter": "claude-opus-4-6-20250514",
        "openai-direct": "gpt-4o",
        "ollama-local": "deepseek-coder-v2:33b",
    },
    # STANDARD (daily coding, analysis)
    "claude-sonnet-4-6": {
        "qwen": "qwen3-coder-plus",
        "deepseek": "deepseek-chat",
        "openrouter": "anthropic/claude-sonnet-4",
        "agentrouter": "claude-sonnet-4-6-20250514",
        "openai-direct": "gpt-4o",
        "ollama-local": "deepseek-coder-v2:16b",
    },
    # FAST (simple tasks, support, triage)
    "claude-haiku-4-5": {
        "qwen": "qwen-turbo",
        "deepseek": "deepseek-chat",
        "openrouter": "anthropic/claude-haiku-4-5",
        "agentrouter": "claude-haiku-4-5-20251001",
        "openai-direct": "gpt-4o-mini",
        "ollama-local": "llama3.2:3b",
    },
    # GEMINI → equivalent tier
    "gemini-2.0-flash": {
        "qwen": "qwen-turbo",
        "deepseek": "deepseek-chat",
        "openrouter": "google/gemini-2.0-flash-001",
        "anthropic-direct": "claude-haiku-4-5-20251001",
        "openai-direct": "gpt-4o-mini",
        "ollama-local": "llama3.2:3b",
    },
    "gemini-2.0-flash-lite": {
        "qwen": "qwen-turbo",
        "deepseek": "deepseek-chat",
        "openrouter": "google/gemini-2.0-flash-lite-001",
        "openai-direct": "gpt-4o-mini",
        "ollama-local": "llama3.2:3b",
    },
    "gemini-2.0-pro": {
        "qwen": "qwen3-coder-plus",
        "deepseek": "deepseek-chat",
        "openrouter": "google/gemini-2.0-pro-001",
        "openai-direct": "gpt-4o",
        "ollama-local": "deepseek-coder-v2:16b",
    },
}


def resolve_model(canonical_model: str, provider_name: str) -> str:
    """Translate canonical model name to provider-specific name.

    Args:
        canonical_model: From model_selector (e.g. "claude-sonnet-4-6")
        provider_name: Active provider (e.g. "qwen", "deepseek", "openrouter")

    Returns:
        Provider-specific model name. Falls back to canonical if no alias.
    """
    if not canonical_model:
        return canonical_model

    # ollama models already have correct format
    if canonical_model.startswith("ollama:"):
        return canonical_model.split(":", 1)[1]

    # "primary" = user explicitly set LLM_MODEL, respect that
    if provider_name == "primary":
        return canonical_model

    aliases = MODEL_ALIASES.get(canonical_model)
    if not aliases:
        return canonical_model

    resolved = aliases.get(provider_name, canonical_model)
    if resolved != canonical_model:
        logger.debug("[ModelAlias] %s → %s (provider=%s)", canonical_model, resolved, provider_name)
    return resolved
