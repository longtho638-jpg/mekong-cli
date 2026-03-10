"""Tests for ALGO 7 — Fallback Chain (INSURANCE).

CRITICAL RULE: data_sensitivity == "sensitive" → NEVER call API.
"""

from __future__ import annotations

import pytest

from src.core.fallback_chain import (
    FALLBACK_HIERARCHY,
    MAX_RETRIES,
    RETRY_DELAY_SECONDS,
    FallbackResult,
    RateLimitError,
    get_fallback_models,
    rebuild_config,
)


class TestFallbackHierarchy:
    def test_all_api_models_have_fallbacks(self):
        api_models = [m for m in FALLBACK_HIERARCHY if not m.startswith("ollama:")]
        assert len(api_models) >= 5
        for model in api_models:
            assert len(FALLBACK_HIERARCHY[model]) >= 1

    def test_local_models_have_fallbacks(self):
        local_models = [m for m in FALLBACK_HIERARCHY if m.startswith("ollama:")]
        assert len(local_models) >= 3
        for model in local_models:
            assert len(FALLBACK_HIERARCHY[model]) >= 1

    def test_opus_fallback_order(self):
        fb = FALLBACK_HIERARCHY["claude-opus-4-6"]
        assert fb[0] == "claude-sonnet-4-6"

    def test_no_self_referencing(self):
        for model, fallbacks in FALLBACK_HIERARCHY.items():
            assert model not in fallbacks, f"{model} references itself"


class TestRetryConfig:
    def test_max_retries(self):
        assert MAX_RETRIES == 3

    def test_exponential_backoff(self):
        assert RETRY_DELAY_SECONDS == [1, 3, 9]
        # Each delay should be >= previous
        for i in range(1, len(RETRY_DELAY_SECONDS)):
            assert RETRY_DELAY_SECONDS[i] > RETRY_DELAY_SECONDS[i - 1]


class TestGetFallbackModels:
    def test_returns_ordered_fallbacks(self):
        result = get_fallback_models("claude-opus-4-6", [])
        assert result == ["claude-sonnet-4-6", "gemini-2.0-pro"]

    def test_excludes_attempted(self):
        result = get_fallback_models(
            "claude-opus-4-6", ["claude-sonnet-4-6"]
        )
        assert "claude-sonnet-4-6" not in result
        assert "gemini-2.0-pro" in result

    def test_all_attempted_returns_empty(self):
        result = get_fallback_models(
            "claude-opus-4-6", ["claude-sonnet-4-6", "gemini-2.0-pro"]
        )
        assert result == []

    def test_unknown_model_returns_empty(self):
        result = get_fallback_models("unknown-model", [])
        assert result == []

    # CRITICAL: Sensitive data tests
    def test_sensitive_blocks_all_api_fallbacks(self):
        """INSURANCE RULE: sensitive data → NO API calls."""
        result = get_fallback_models(
            "ollama:llama3.2:3b", [], data_sensitivity="sensitive"
        )
        for model in result:
            assert model.startswith("ollama:"), (
                f"Sensitive data leaked to API model: {model}"
            )

    def test_sensitive_blocks_api_from_local_fallback(self):
        """When local model fails with sensitive data, API fallbacks are blocked."""
        result = get_fallback_models(
            "ollama:deepseek-coder-v2:33b", [], data_sensitivity="sensitive"
        )
        # deepseek fallbacks are ["claude-sonnet-4-6", "gemini-2.0-flash"]
        # ALL should be blocked for sensitive data
        assert result == []

    def test_sensitive_keeps_local_fallbacks(self):
        """Sensitive data can still fall back to other local models."""
        result = get_fallback_models(
            "gemini-2.0-flash-lite", [], data_sensitivity="sensitive"
        )
        # fallbacks: ["gpt-4o-mini", "ollama:llama3.2:3b"]
        # Only ollama should remain
        assert result == ["ollama:llama3.2:3b"]

    def test_public_allows_api_fallbacks(self):
        """Public data allows all fallbacks including API."""
        result = get_fallback_models(
            "ollama:deepseek-coder-v2:33b", [], data_sensitivity="public"
        )
        assert "claude-sonnet-4-6" in result

    def test_internal_allows_api_fallbacks(self):
        """Internal data allows API fallbacks (only sensitive blocks)."""
        result = get_fallback_models(
            "ollama:mistral:7b", [], data_sensitivity="internal"
        )
        assert "claude-haiku-4-5" in result


class TestRebuildConfig:
    def test_rebuilds_with_provider(self):
        config = rebuild_config("claude-sonnet-4-6")
        assert config.model_id == "claude-sonnet-4-6"
        assert config.provider == "anthropic"

    def test_rebuilds_local_model(self):
        config = rebuild_config("ollama:llama3.2:3b")
        assert config.provider == "ollama"

    def test_preserves_temperature(self):
        config = rebuild_config("gpt-4o-mini", temperature=0.7)
        assert config.temperature == 0.7

    def test_preserves_max_tokens(self):
        config = rebuild_config("gemini-2.0-flash", max_tokens=8192)
        assert config.max_tokens == 8192


class TestFallbackResult:
    def test_success_result(self):
        r = FallbackResult(
            success=True,
            model_used="claude-sonnet-4-6",
            tokens_output=100,
            attempts=["claude-opus-4-6", "claude-sonnet-4-6"],
            output="Hello world",
        )
        assert r.success is True
        assert r.model_used == "claude-sonnet-4-6"
        assert len(r.attempts) == 2

    def test_failure_result(self):
        r = FallbackResult(
            success=False,
            error="all_models_failed",
            attempts=["model-a", "model-b"],
        )
        assert r.success is False
        assert r.model_used is None
        assert r.error == "all_models_failed"

    def test_default_values(self):
        r = FallbackResult(success=True)
        assert r.tokens_output == 0
        assert r.attempts == []
        assert r.output == ""


class TestRateLimitError:
    def test_is_exception(self):
        assert issubclass(RateLimitError, Exception)

    def test_can_raise(self):
        with pytest.raises(RateLimitError):
            raise RateLimitError("429 Too Many Requests")
