"""ALGO 2 — Model Selector.

Selects the optimal LLM model based on TaskProfile and system state.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from src.core.task_classifier import TaskProfile


@dataclass
class SystemState:
    """Current system state for model selection."""

    local_available: bool = False
    local_models: list[str] = field(default_factory=list)
    api_keys: dict[str, bool] = field(default_factory=dict)
    local_load: float = 0.0
    tenant_tier: str = "starter"


@dataclass
class ModelConfig:
    """Selected model configuration."""

    model_id: str
    provider: Literal["ollama", "anthropic", "google", "openai"]
    max_tokens: int
    temperature: float
    context_window: int = 0
    cost_per_mtok_input: float = 0.0
    cost_per_mtok_output: float = 0.0


# (agent_role, complexity, requires_reasoning, data_sensitivity) → model_id
# "*" means wildcard match
MODEL_ROUTING_MATRIX: dict[tuple[str, str, bool | str, str], str] = {
    # CTO: CODE
    ("cto", "simple", False, "public"): "gemini-2.0-flash",
    ("cto", "simple", False, "internal"): "gemini-2.0-flash",
    ("cto", "simple", False, "sensitive"): "ollama:deepseek-coder-v2:16b",
    ("cto", "standard", True, "public"): "claude-sonnet-4-6",
    ("cto", "standard", True, "internal"): "claude-sonnet-4-6",
    ("cto", "standard", True, "sensitive"): "ollama:deepseek-coder-v2:33b",
    ("cto", "complex", True, "public"): "claude-opus-4-6",
    ("cto", "complex", True, "internal"): "claude-opus-4-6",
    ("cto", "complex", True, "sensitive"): "ollama:deepseek-coder-v2:33b",
    # CMO/EDITOR: CREATIVE
    ("cmo", "simple", False, "*"): "gemini-2.0-flash",
    ("cmo", "standard", True, "*"): "gemini-2.0-flash",
    ("cmo", "complex", True, "*"): "gemini-2.0-pro",
    ("editor", "simple", False, "*"): "gemini-2.0-flash",
    ("editor", "standard", False, "*"): "gemini-2.0-flash",
    ("editor", "complex", False, "*"): "gemini-2.0-flash",
    # COO: OPS (prefer local)
    ("coo", "simple", False, "*"): "ollama:llama3.2:3b",
    ("coo", "standard", False, "*"): "ollama:llama3.2:3b",
    ("coo", "complex", False, "*"): "ollama:llama3.2:3b",
    # CFO/DATA: ANALYSIS
    ("cfo", "simple", False, "sensitive"): "ollama:qwen2.5:7b",
    ("cfo", "simple", False, "public"): "gemini-2.0-flash-lite",
    ("cfo", "standard", False, "sensitive"): "ollama:qwen2.5:7b",
    ("cfo", "standard", False, "public"): "gemini-2.0-flash-lite",
    ("cfo", "complex", False, "sensitive"): "ollama:qwen2.5:7b",
    ("cfo", "complex", False, "public"): "gemini-2.0-flash-lite",
    ("data", "simple", False, "sensitive"): "ollama:qwen2.5:7b",
    ("data", "simple", False, "public"): "gemini-2.0-flash-lite",
    ("data", "standard", False, "sensitive"): "ollama:qwen2.5:7b",
    ("data", "standard", False, "public"): "gemini-2.0-flash-lite",
    ("data", "complex", False, "sensitive"): "ollama:qwen2.5:7b",
    ("data", "complex", False, "public"): "gemini-2.0-flash-lite",
    # CS: SUPPORT
    ("cs", "simple", False, "*"): "ollama:mistral:7b",
    ("cs", "standard", False, "*"): "claude-haiku-4-5",
    ("cs", "complex", True, "*"): "claude-haiku-4-5",
    # SALES
    ("sales", "simple", False, "*"): "claude-haiku-4-5",
    ("sales", "standard", True, "*"): "claude-sonnet-4-6",
    ("sales", "complex", True, "*"): "claude-sonnet-4-6",
}

CONTEXT_WINDOW_MAP: dict[str, int] = {
    "claude-opus-4-6": 200000,
    "claude-sonnet-4-6": 200000,
    "claude-haiku-4-5": 200000,
    "gemini-2.0-flash": 1000000,
    "gemini-2.0-flash-lite": 1000000,
    "gemini-2.0-pro": 1000000,
    "gpt-4o-mini": 128000,
    "gpt-4o": 128000,
    "ollama:deepseek-coder-v2:33b": 128000,
    "ollama:deepseek-coder-v2:16b": 128000,
    "ollama:llama3.2:3b": 128000,
    "ollama:llama3.3:70b": 128000,
    "ollama:qwen2.5:7b": 128000,
    "ollama:mistral:7b": 32000,
}

TEMP_MAP: dict[str, float] = {
    "code": 0.2,
    "ops": 0.1,
    "analysis": 0.3,
    "creative": 0.8,
    "sales": 0.7,
    "support": 0.4,
}

# Best local model per domain (for starter tier override)
BEST_LOCAL_FOR_DOMAIN: dict[str, str] = {
    "code": "ollama:deepseek-coder-v2:16b",
    "creative": "ollama:llama3.2:3b",
    "ops": "ollama:llama3.2:3b",
    "analysis": "ollama:qwen2.5:7b",
    "sales": "ollama:mistral:7b",
    "support": "ollama:mistral:7b",
}

# Smaller local model fallback for VRAM pressure
LOCAL_DOWNGRADE: dict[str, str] = {
    "ollama:deepseek-coder-v2:33b": "ollama:deepseek-coder-v2:16b",
    "ollama:deepseek-coder-v2:16b": "ollama:llama3.2:3b",
    "ollama:llama3.3:70b": "ollama:deepseek-coder-v2:33b",
    "ollama:qwen2.5:7b": "ollama:llama3.2:3b",
    "ollama:mistral:7b": "ollama:llama3.2:3b",
}


def detect_provider(model_id: str) -> str:
    """Detect the provider from a model ID."""
    if model_id.startswith("ollama:"):
        return "ollama"
    if "claude" in model_id:
        return "anthropic"
    if "gemini" in model_id:
        return "google"
    if "gpt" in model_id:
        return "openai"
    return "unknown"


def _lookup_matrix(profile: TaskProfile) -> str | None:
    """Look up model from routing matrix with wildcard fallback."""
    key = (profile.agent_role, profile.complexity,
           profile.requires_reasoning, profile.data_sensitivity)

    # Exact match first
    if key in MODEL_ROUTING_MATRIX:
        return MODEL_ROUTING_MATRIX[key]

    # Wildcard sensitivity match
    wildcard_key = (profile.agent_role, profile.complexity,
                    profile.requires_reasoning, "*")
    if wildcard_key in MODEL_ROUTING_MATRIX:
        return MODEL_ROUTING_MATRIX[wildcard_key]

    # Wildcard complexity + sensitivity
    for comp in ["simple", "standard", "complex"]:
        for reasoning in [True, False]:
            wk = (profile.agent_role, comp, reasoning, "*")
            if wk in MODEL_ROUTING_MATRIX:
                return MODEL_ROUTING_MATRIX[wk]

    return None


def select_model(profile: TaskProfile, state: SystemState) -> ModelConfig:
    """Select the best model for a task profile given system state.

    Args:
        profile: Classified task profile.
        state: Current system state.

    Returns:
        ModelConfig with selected model and parameters.
    """
    model_id = _lookup_matrix(profile) or "gemini-2.0-flash"

    # Step 2: Availability check
    if model_id.startswith("ollama:"):
        ollama_model = model_id.split(":", 1)[1] if ":" in model_id else model_id
        if not state.local_available:
            model_id = "gemini-2.0-flash"  # API fallback
        elif state.local_load > 0.85:
            model_id = LOCAL_DOWNGRADE.get(model_id, model_id)
        elif ollama_model not in state.local_models:
            model_id = "gemini-2.0-flash"  # model not pulled
    else:
        provider = detect_provider(model_id)
        if not state.api_keys.get(provider, False):
            # Try different provider
            if state.local_available:
                model_id = BEST_LOCAL_FOR_DOMAIN.get(profile.domain, "ollama:llama3.2:3b")
            else:
                model_id = "gemini-2.0-flash"  # last resort

    # Step 3: Tenant tier override
    if state.tenant_tier == "starter" and model_id == "claude-opus-4-6":
        model_id = "claude-sonnet-4-6"

    if (state.tenant_tier == "starter"
            and state.local_available
            and profile.domain not in ("code", "sales")):
        model_id = BEST_LOCAL_FOR_DOMAIN.get(profile.domain, model_id)

    # Step 4: Build ModelConfig
    ctx_window = CONTEXT_WINDOW_MAP.get(model_id, 128000)
    temperature = TEMP_MAP.get(profile.domain, 0.3)
    provider = detect_provider(model_id)

    from src.core.cost_estimator import COST_TABLE
    costs = COST_TABLE.get(model_id, (0.0, 0.0))

    return ModelConfig(
        model_id=model_id,
        provider=provider,  # type: ignore[arg-type]
        max_tokens=int(ctx_window * 0.75),
        temperature=temperature,
        context_window=ctx_window,
        cost_per_mtok_input=costs[0],
        cost_per_mtok_output=costs[1],
    )

# --- Task Complexity Override (Superpowers-inspired) ---
# When task is mechanical, use cheaper model regardless of agent role

TASK_TIER_OVERRIDE: dict[str, str | None] = {
    "mechanical": "gemini-2.0-flash-lite",  # isolated functions, clear specs
    "integration": None,                     # keep matrix default
    "architecture": None,                    # keep matrix default (or upgrade)
}


def select_model_with_tier(
    profile: TaskProfile,
    state: SystemState,
    task_tier: str = "integration",
) -> ModelConfig:
    """Enhanced model selection with task complexity tier.

    Args:
        profile: Classified task profile.
        state: Current system state.
        task_tier: "mechanical", "integration", or "architecture".

    Returns:
        ModelConfig — may override matrix selection for mechanical tasks.
    """
    override = TASK_TIER_OVERRIDE.get(task_tier)
    if override:
        # Use cheap model for mechanical tasks
        provider = detect_provider(override)
        from src.core.cost_estimator import COST_TABLE
        costs = COST_TABLE.get(override, (0.0, 0.0))
        ctx = CONTEXT_WINDOW_MAP.get(override, 128000)
        return ModelConfig(
            model_id=override,
            provider=provider,
            max_tokens=int(ctx * 0.75),
            temperature=0.2,
            context_window=ctx,
            cost_per_mtok_input=costs[0],
            cost_per_mtok_output=costs[1],
        )
    # Default: use existing matrix logic
    return select_model(profile, state)
