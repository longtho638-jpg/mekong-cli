"""
Anthropic SDK Engine — Structured tool calling for OCOP RaaS.

Enterprise-grade AI engine using the official Anthropic SDK
with native tool definitions and strict JSON output.

Usage:
    from src.ai.anthropic_engine import AnthropicEngine

    engine = AnthropicEngine()
    result = engine.analyze_export_readiness(
        product_name="Khoai lang Bình Minh",
        specifications={"weight_kg": 25, "grade": "A"}
    )
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

# Anthropic SDK tool definition for export readiness analysis
OCOP_EXPORT_TOOL = {
    "name": "analyze_ocop_export_readiness",
    "description": (
        "Analyze a Vietnamese OCOP agricultural product for export readiness. "
        "Returns FDA compliance status, target market recommendation, "
        "and a suggested Alibaba listing title."
    ),
    "input_schema": {
        "type": "object",
        "required": ["product_name"],
        "properties": {
            "product_name": {
                "type": "string",
                "description": "Vietnamese product name (e.g., 'Khoai lang Bình Minh')",
            },
            "specifications": {
                "type": "object",
                "description": "Product specs (weight, grade, certifications, etc.)",
                "properties": {
                    "weight_kg": {"type": "number"},
                    "grade": {"type": "string"},
                    "certifications": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "origin_province": {"type": "string"},
                    "harvest_date": {"type": "string"},
                },
            },
        },
    },
}


@dataclass
class ExportReadinessResult:
    """Structured result from export readiness analysis."""

    fda_compliance_status: str
    target_market: str
    suggested_alibaba_title: str
    raw_response: dict[str, Any] | None = None
    error: str | None = None


class AnthropicEngine:
    """Anthropic SDK client with OCOP tool bindings.

    Loads ANTHROPIC_API_KEY from environment.
    Handles rate limits with exponential backoff (max 3 retries).
    """

    MAX_RETRIES = 3
    BASE_DELAY = 1.0

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self._model = model or os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        self._client = None

    def _get_client(self) -> Any:
        """Lazy-init Anthropic client."""
        if self._client is None:
            try:
                import anthropic  # noqa: F811
            except ImportError:
                raise ImportError(
                    "anthropic SDK not installed. Run: pip install anthropic"
                )

            if not self._api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY not set. "
                    "Set it in .env or pass api_key to AnthropicEngine()."
                )

            self._client = anthropic.Anthropic(api_key=self._api_key)
        return self._client

    def analyze_export_readiness(
        self,
        product_name: str,
        specifications: dict[str, Any] | None = None,
    ) -> ExportReadinessResult:
        """Analyze OCOP product for export readiness using Anthropic tool calling.

        Args:
            product_name: Vietnamese product name
            specifications: Optional product specs dict

        Returns:
            ExportReadinessResult with FDA status, target market, Alibaba title
        """
        specs_text = ""
        if specifications:
            specs_text = f"\nSpecifications: {json.dumps(specifications, ensure_ascii=False)}"

        prompt = (
            f"Analyze this Vietnamese OCOP agricultural product for international export readiness.\n"
            f"Product: {product_name}{specs_text}\n\n"
            f"Use the analyze_ocop_export_readiness tool to provide your analysis."
        )

        return self._call_with_retry(prompt)

    def _call_with_retry(self, prompt: str) -> ExportReadinessResult:
        """Call Anthropic API with exponential backoff on rate limits."""
        import anthropic

        client = self._get_client()
        last_error = None

        for attempt in range(self.MAX_RETRIES):
            try:
                response = client.messages.create(
                    model=self._model,
                    max_tokens=1024,
                    tools=[OCOP_EXPORT_TOOL],
                    messages=[{"role": "user", "content": prompt}],
                )
                return self._parse_response(response)

            except anthropic.RateLimitError as e:
                last_error = e
                delay = self.BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "Rate limited (attempt %d/%d), retrying in %.1fs",
                    attempt + 1, self.MAX_RETRIES, delay,
                )
                time.sleep(delay)

            except anthropic.APITimeoutError as e:
                last_error = e
                delay = self.BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "API timeout (attempt %d/%d), retrying in %.1fs",
                    attempt + 1, self.MAX_RETRIES, delay,
                )
                time.sleep(delay)

            except anthropic.APIError as e:
                logger.error("Anthropic API error: %s", e)
                return ExportReadinessResult(
                    fda_compliance_status="error",
                    target_market="unknown",
                    suggested_alibaba_title="",
                    error=str(e),
                )

        # All retries exhausted
        return ExportReadinessResult(
            fda_compliance_status="error",
            target_market="unknown",
            suggested_alibaba_title="",
            error=f"Max retries ({self.MAX_RETRIES}) exhausted: {last_error}",
        )

    def _parse_response(self, response: Any) -> ExportReadinessResult:
        """Parse Anthropic response, extracting tool_use blocks."""
        for block in response.content:
            if block.type == "tool_use" and block.name == "analyze_ocop_export_readiness":
                data = block.input
                return ExportReadinessResult(
                    fda_compliance_status=data.get("fda_compliance_status", "unknown"),
                    target_market=data.get("target_market", "unknown"),
                    suggested_alibaba_title=data.get("suggested_alibaba_title", ""),
                    raw_response=data,
                )

        # Fallback: no tool_use block found
        text_content = ""
        for block in response.content:
            if block.type == "text":
                text_content = block.text
                break

        return ExportReadinessResult(
            fda_compliance_status="pending_review",
            target_market="unknown",
            suggested_alibaba_title="",
            raw_response={"text": text_content},
            error="No tool_use block in response",
        )


def analyze_ocop_export_readiness(
    product_name: str,
    specifications: dict[str, Any] | None = None,
    api_key: str | None = None,
) -> ExportReadinessResult:
    """Convenience function for quick analysis.

    Usage:
        from src.ai.anthropic_engine import analyze_ocop_export_readiness

        result = analyze_ocop_export_readiness(
            product_name="Khoai lang Bình Minh",
            specifications={"weight_kg": 25, "grade": "A"}
        )
        print(result.fda_compliance_status)
        print(result.target_market)
        print(result.suggested_alibaba_title)
    """
    engine = AnthropicEngine(api_key=api_key)
    return engine.analyze_export_readiness(product_name, specifications)
