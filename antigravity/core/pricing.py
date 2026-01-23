"""
💰 Pricing Utility for AI Models
===============================
Provides token-to-USD conversion for the Antigravity Swarm.
"""

from typing import Dict

# Prices per 1M tokens (USD) - Standard market rates as of early 2026
MODEL_PRICING = {
    "claude-3-5-sonnet": {"input": 3.0, "output": 15.0},
    "claude-3-opus": {"input": 15.0, "output": 75.0},
    "claude-3-5-haiku": {"input": 0.25, "output": 1.25},
    "gemini-1.5-pro": {"input": 1.25, "output": 5.0},  # < 128k context
    "gemini-1.5-flash": {"input": 0.075, "output": 0.3},
    "gemini-2.0-flash": {"input": 0.1, "output": 0.4},
    "gpt-4o": {"input": 2.5, "output": 10.0},
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},
    "default": {"input": 1.0, "output": 5.0},
}

def estimate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    """Estimates the cost of an LLM call in USD."""
    pricing = MODEL_PRICING.get(model_id, MODEL_PRICING["default"])

    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]

    return round(input_cost + output_cost, 6)

def get_all_pricing() -> Dict[str, Dict[str, float]]:
    """Returns the pricing table."""
    return MODEL_PRICING
