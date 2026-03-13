"""Tests for subagent reviewer and model alias modules."""

from __future__ import annotations

import pytest


# === Model Alias Tests ===

class TestModelAlias:
    """Test model alias resolution."""

    def test_qwen_mapping(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-sonnet-4-6", "qwen") == "qwen3-coder-plus"

    def test_deepseek_mapping(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-sonnet-4-6", "deepseek") == "deepseek-chat"

    def test_openrouter_mapping(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-sonnet-4-6", "openrouter") == "anthropic/claude-sonnet-4"

    def test_native_provider_passthrough(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-sonnet-4-6", "anthropic-direct") == "claude-sonnet-4-6"

    def test_primary_passthrough(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-sonnet-4-6", "primary") == "claude-sonnet-4-6"

    def test_ollama_strip_prefix(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("ollama:qwen2.5:7b", "qwen") == "qwen2.5:7b"

    def test_unknown_model_passthrough(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("unknown-model-xyz", "qwen") == "unknown-model-xyz"

    def test_empty_model(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("", "qwen") == ""

    def test_haiku_to_qwen_turbo(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-haiku-4-5", "qwen") == "qwen-turbo"

    def test_gemini_to_qwen(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("gemini-2.0-flash", "qwen") == "qwen-turbo"

    def test_opus_to_qwen(self) -> None:
        from src.core.model_alias import resolve_model
        assert resolve_model("claude-opus-4-6", "qwen") == "qwen3-coder-plus"


# === Subagent Status Parsing Tests ===

class TestStatusParsing:
    """Test subagent status extraction."""

    def test_done_status(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, _ = _parse_status("Some output\n<status>DONE</status>")
        assert status == "DONE"

    def test_done_with_concerns(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, concerns = _parse_status(
            "Output here\n<status>DONE_WITH_CONCERNS</status>\nMissing edge case test"
        )
        assert status == "DONE_WITH_CONCERNS"
        assert "edge case" in concerns

    def test_blocked_status(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, details = _parse_status(
            "<status>BLOCKED</status>\nNeed database credentials"
        )
        assert status == "BLOCKED"
        assert "credentials" in details

    def test_needs_context(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, _ = _parse_status("<status>NEEDS_CONTEXT</status>\nWhich API version?")
        assert status == "NEEDS_CONTEXT"

    def test_no_status_tag_defaults_done(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, _ = _parse_status("Just some output without status tag")
        assert status == "DONE"

    def test_status_mid_output(self) -> None:
        from src.core.subagent_reviewer import _parse_status
        status, _ = _parse_status(
            "Line 1\nLine 2\n<status>DONE_WITH_CONCERNS</status>\nConcern here"
        )
        assert status == "DONE_WITH_CONCERNS"
