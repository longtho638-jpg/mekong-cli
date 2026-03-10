"""Mekong CLI - Cost Tracker.

LiteLLM-inspired per-token cost tracking for LLM calls.
Calculates cost from LLMResponse usage data using model pricing database.
Tracks cumulative spend per provider, model, and session.

Pattern source: litellm/cost_calculator.py + model_prices_and_context_window.json
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .event_bus import get_event_bus

# Model pricing database (USD per token)
# Mirrors litellm's model_prices_and_context_window.json schema
MODEL_PRICES: dict[str, dict[str, float]] = {
    "gemini-2.5-pro": {
        "input_cost_per_token": 1.25e-06,
        "output_cost_per_token": 10.0e-06,
        "max_input_tokens": 1048576,
    },
    "gemini-2.0-flash": {
        "input_cost_per_token": 0.1e-06,
        "output_cost_per_token": 0.4e-06,
        "max_input_tokens": 1048576,
    },
    "gemini-3-pro-high": {
        "input_cost_per_token": 1.25e-06,
        "output_cost_per_token": 10.0e-06,
        "max_input_tokens": 1048576,
    },
    "gemini-3-pro-preview": {
        "input_cost_per_token": 1.25e-06,
        "output_cost_per_token": 10.0e-06,
        "max_input_tokens": 1048576,
    },
    "gemini-3-flash-preview": {
        "input_cost_per_token": 0.15e-06,
        "output_cost_per_token": 0.6e-06,
        "max_input_tokens": 1048576,
    },
    "claude-opus-4-6": {
        "input_cost_per_token": 15.0e-06,
        "output_cost_per_token": 75.0e-06,
        "max_input_tokens": 200000,
    },
    "claude-sonnet-4-6": {
        "input_cost_per_token": 3.0e-06,
        "output_cost_per_token": 15.0e-06,
        "max_input_tokens": 200000,
    },
    "claude-haiku-4-5": {
        "input_cost_per_token": 0.8e-06,
        "output_cost_per_token": 4.0e-06,
        "max_input_tokens": 200000,
    },
    "gpt-4o": {
        "input_cost_per_token": 2.5e-06,
        "output_cost_per_token": 10.0e-06,
        "max_input_tokens": 128000,
    },
    "gpt-4o-mini": {
        "input_cost_per_token": 0.15e-06,
        "output_cost_per_token": 0.6e-06,
        "max_input_tokens": 128000,
    },
    "o3-mini": {
        "input_cost_per_token": 1.1e-06,
        "output_cost_per_token": 4.4e-06,
        "max_input_tokens": 200000,
    },
}


@dataclass
class CostEntry:
    """Single LLM call cost record."""

    model: str
    provider: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class SpendSummary:
    """Aggregated spend summary."""

    total_cost_usd: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_calls: int = 0
    by_model: dict[str, float] = field(default_factory=dict)
    by_provider: dict[str, float] = field(default_factory=dict)


class CostTracker:
    """Tracks LLM call costs per session with persistence.

    Inspired by litellm's completion_cost() + ProxyLogging spend tracking.
    """

    def __init__(self, persist_path: str | None = None) -> None:
        """Initialize cost tracker.

        Args:
            persist_path: Path for spend log. Defaults to .mekong/spend.jsonl

        """
        self._entries: list[CostEntry] = []
        self._persist_path = Path(persist_path) if persist_path else Path(".mekong/spend.jsonl")
        self._event_bus = get_event_bus()

    def completion_cost(
        self,
        model: str,
        usage: dict[str, int] | None = None,
        provider: str = "",
    ) -> float:
        """Calculate cost for an LLM completion call.

        Mirrors litellm's completion_cost() pipeline:
        1. Normalize model name
        2. Lookup pricing
        3. Calculate component costs
        4. Record entry

        Args:
            model: Model identifier (e.g., "gemini-2.5-pro")
            usage: Token usage dict with prompt_tokens/completion_tokens/total_tokens
            provider: Provider name for tracking

        Returns:
            Total cost in USD

        """
        if not usage:
            return 0.0

        # Normalize model name (strip provider prefix if present)
        clean_model = model.split("/")[-1] if "/" in model else model

        # Lookup pricing
        pricing = MODEL_PRICES.get(clean_model, {})
        input_rate = pricing.get("input_cost_per_token", 0.0)
        output_rate = pricing.get("output_cost_per_token", 0.0)

        # Extract token counts (handle both litellm and OpenAI formats)
        input_tokens = usage.get("prompt_tokens", usage.get("input_tokens", 0))
        output_tokens = usage.get("completion_tokens", usage.get("output_tokens", 0))
        total_tokens = usage.get("total_tokens", input_tokens + output_tokens)

        # Calculate cost
        cost = (input_tokens * input_rate) + (output_tokens * output_rate)

        # Record entry
        entry = CostEntry(
            model=clean_model,
            provider=provider,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            cost_usd=round(cost, 8),
        )
        self._entries.append(entry)
        self._persist_entry(entry)

        return cost

    def get_summary(self) -> SpendSummary:
        """Get aggregated spend summary for current session."""
        summary = SpendSummary(total_calls=len(self._entries))

        for entry in self._entries:
            summary.total_cost_usd += entry.cost_usd
            summary.total_input_tokens += entry.input_tokens
            summary.total_output_tokens += entry.output_tokens

            model_key = entry.model
            summary.by_model[model_key] = summary.by_model.get(model_key, 0.0) + entry.cost_usd

            if entry.provider:
                summary.by_provider[entry.provider] = (
                    summary.by_provider.get(entry.provider, 0.0) + entry.cost_usd
                )

        summary.total_cost_usd = round(summary.total_cost_usd, 6)
        return summary

    def get_model_info(self, model: str) -> dict[str, Any]:
        """Get pricing and context window info for a model.

        Args:
            model: Model identifier

        Returns:
            Dict with pricing and capabilities

        """
        clean = model.split("/")[-1] if "/" in model else model
        return MODEL_PRICES.get(clean, {})

    def _persist_entry(self, entry: CostEntry) -> None:
        """Append cost entry to spend log file."""
        self._persist_path.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "model": entry.model,
            "provider": entry.provider,
            "input_tokens": entry.input_tokens,
            "output_tokens": entry.output_tokens,
            "cost_usd": entry.cost_usd,
            "timestamp": entry.timestamp,
        }
        with open(self._persist_path, "a") as f:
            f.write(json.dumps(record) + "\n")

    def clear(self) -> None:
        """Clear in-memory entries."""
        self._entries.clear()


# Module-level singleton
_default_tracker: CostTracker | None = None


def get_cost_tracker() -> CostTracker:
    """Get or create the default cost tracker."""
    global _default_tracker
    if _default_tracker is None:
        _default_tracker = CostTracker()
    return _default_tracker


__all__ = [
    "MODEL_PRICES",
    "CostEntry",
    "CostTracker",
    "SpendSummary",
    "get_cost_tracker",
]
