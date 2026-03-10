"""Tests for ALGO 6 — API Adapter."""

from __future__ import annotations

import pytest

from src.core.api_adapter import (
    detect_provider,
    format_for_openai,
    format_for_gemini,
    _get_api_key,
    APIAdapter,
)
from src.core.model_selector import ModelConfig


class TestDetectProvider:
    def test_anthropic(self):
        assert detect_provider("claude-sonnet-4-6") == "anthropic"
        assert detect_provider("claude-opus-4-6") == "anthropic"

    def test_google(self):
        assert detect_provider("gemini-2.0-flash") == "google"
        assert detect_provider("gemini-2.0-pro") == "google"

    def test_openai(self):
        assert detect_provider("gpt-4o") == "openai"
        assert detect_provider("gpt-4o-mini") == "openai"

    def test_ollama(self):
        assert detect_provider("ollama:llama3.2:3b") == "ollama"

    def test_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown provider"):
            detect_provider("unknown-model-xyz")


class TestFormatForOpenAI:
    def test_with_system_prompt(self):
        messages = [{"role": "user", "content": "hi"}]
        result = format_for_openai(messages, "You are helpful.")
        assert result[0] == {"role": "system", "content": "You are helpful."}
        assert result[1] == {"role": "user", "content": "hi"}

    def test_without_system_prompt(self):
        messages = [{"role": "user", "content": "hi"}]
        result = format_for_openai(messages, None)
        assert len(result) == 1
        assert result[0]["role"] == "user"

    def test_preserves_message_order(self):
        messages = [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "hi"},
            {"role": "user", "content": "bye"},
        ]
        result = format_for_openai(messages, None)
        assert len(result) == 3


class TestFormatForGemini:
    def test_with_system_prompt(self):
        messages = [{"role": "user", "content": "hi"}]
        result = format_for_gemini(messages, "Be helpful.")
        # system prompt becomes user+model pair
        assert result[0]["role"] == "user"
        assert result[1]["role"] == "model"
        assert result[2]["role"] == "user"
        assert len(result) == 3

    def test_without_system_prompt(self):
        messages = [{"role": "user", "content": "hi"}]
        result = format_for_gemini(messages, None)
        assert len(result) == 1
        assert result[0]["parts"][0]["text"] == "hi"

    def test_assistant_mapped_to_model(self):
        messages = [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "hi there"},
        ]
        result = format_for_gemini(messages, None)
        assert result[1]["role"] == "model"


class TestGetApiKey:
    def test_missing_key_raises(self):
        with pytest.raises(EnvironmentError, match="Missing API key"):
            _get_api_key("anthropic")

    def test_with_key(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-123")
        assert _get_api_key("anthropic") == "test-key-123"

    def test_google_key(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "google-key")
        assert _get_api_key("google") == "google-key"

    def test_openai_key(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "openai-key")
        assert _get_api_key("openai") == "openai-key"


class TestAPIAdapterSyncFallback:
    def test_sync_anthropic_returns_empty_on_error(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "fake")
        adapter = APIAdapter()
        config = ModelConfig(
            model_id="claude-haiku-4-5",
            provider="anthropic",
            max_tokens=100,
            temperature=0.3,
        )
        # Will fail to connect — should return empty string
        result = adapter._sync_anthropic(config, [{"role": "user", "content": "hi"}], None, "fake")
        assert result == ""

    def test_sync_google_returns_empty_on_error(self):
        adapter = APIAdapter()
        config = ModelConfig(
            model_id="gemini-2.0-flash",
            provider="google",
            max_tokens=100,
            temperature=0.3,
        )
        result = adapter._sync_google(config, [{"role": "user", "content": "hi"}], None, "fake")
        assert result == ""

    def test_sync_openai_returns_empty_on_error(self):
        adapter = APIAdapter()
        config = ModelConfig(
            model_id="gpt-4o-mini",
            provider="openai",
            max_tokens=100,
            temperature=0.3,
        )
        result = adapter._sync_openai(config, [{"role": "user", "content": "hi"}], None, "fake")
        assert result == ""
