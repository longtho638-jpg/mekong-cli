"""Model Alias Map — translate canonical model names to provider-specific names.

When model_selector picks "claude-sonnet-4-6" but the active provider is DashScope,
this module translates it to "qwen3-coder-plus" before the API call.

Each provider has its own namespace. The map groups models by CAPABILITY TIER
so equivalent models are swapped, not random ones.
"""

from __future__ import annotations

# Canonical → Provider-specific model name mapping
# Tiers: flagship, standard, fast, local
MODEL_ALIASES: dict[str, dict[str, str]] = {
    # --- FLAGSHIP (complex reasoning, code architecture) ---
    "claude-opus-4-6": {
        "qwen": "qwen3-coder-plus",         # best Qwen coding model
        "deepseek": "deepseek-chat",          # DeepSeek V3
        "openrouter": "anthropic/claude-opus-4",
        "agentrouter": "claude-opus-4-6-20250514",
        "openai-direct": "gpt-4o",
        "ollama-local": "deepseek-coder-v2:33b",
    },
    # --- STANDARD (daily coding, analysis) ---
    "claude-sonnet-4-6": {
        "qwen": "qwen3-coder-plus",
        "deepseek": "deepseek-chat",
        "openrouter": "anthropic/claude-sonnet-4",
        "agentrouter": "claude-sonnet-4-6-20250514",
        "openai-direct": "gpt-4o",
        "ollama-local": "deepseek-coder-v2:16b",
    },
    # --- FAST (simple tasks, support, triage) ---
    "claude-haiku-4-5": {
        "qwen": "qwen-turbo",
        "deepseek": "deepseek-chat",
        "openrouter": "anthropic/claude-haiku-4-5",
        "agentrouter": "claude-haiku-4-5-20251001",
        "openai-direct": "gpt-4o-mini",
        "ollama-local": "llama3.2:3b",
    },
    # --- GEMINI MODELS → map to equivalent tier ---
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
        canonical_model: Model ID from model_selector (e.g. "claude-sonnet-4-6")
        provider_name: Active provider name (e.g. "qwen", "deepseek", "openrouter")

    Returns:
        Provider-specific model name. Falls back to canonical if no alias found.

    Examples:
        >>> resolve_model("claude-sonnet-4-6", "qwen")
        'qwen3-coder-plus'
        >>> resolve_model("claude-sonnet-4-6", "anthropic-direct")
        'claude-sonnet-4-6'  # native, no translation needed
        >>> resolve_model("unknown-model", "qwen")
        'unknown-model'  # no alias, pass through
    """
    # Skip translation for ollama local models (already correct format)
    if canonical_model.startswith("ollama:"):
        return canonical_model.split(":", 1)[1]

    # Skip if provider is "primary" (user explicitly set LLM_MODEL)
    if provider_name == "primary":
        return canonical_model

    aliases = MODEL_ALIASES.get(canonical_model)
    if not aliases:
        return canonical_model  # unknown model, pass through

    return aliases.get(provider_name, canonical_model)
