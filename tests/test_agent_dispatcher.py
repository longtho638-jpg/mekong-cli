"""Tests for ALGO 8 — Agent Dispatcher."""

from __future__ import annotations

from src.core.agent_dispatcher import (
    DEFAULT_PROMPTS,
    build_message_chain,
    inject_codebase_context,
    inject_metrics_context,
    load_agent_prompt,
)


class TestDefaultPrompts:
    def test_all_roles_have_prompts(self):
        expected_roles = ["cto", "editor", "analyst", "cfo", "cmo", "devops", "pm", "support"]
        for role in expected_roles:
            assert role in DEFAULT_PROMPTS
            assert len(DEFAULT_PROMPTS[role]) > 10

    def test_cto_mentions_code(self):
        assert "code" in DEFAULT_PROMPTS["cto"].lower()


class TestLoadAgentPrompt:
    def test_known_role_returns_prompt(self):
        prompt = load_agent_prompt("cto")
        assert len(prompt) > 0
        assert "CTO" in prompt

    def test_unknown_role_returns_generic(self):
        prompt = load_agent_prompt("unknown_role_xyz")
        assert "unknown_role_xyz" in prompt

    def test_all_defaults_loadable(self):
        for role in DEFAULT_PROMPTS:
            prompt = load_agent_prompt(role)
            assert len(prompt) > 0


class TestInjectCodebaseContext:
    def test_adds_context_to_last_message(self):
        messages = [{"role": "user", "content": "fix the bug"}]
        result = inject_codebase_context(messages, "fix the bug")
        assert "[Context:" in result[-1]["content"]
        assert "fix the bug" in result[-1]["content"]

    def test_preserves_original_messages(self):
        messages = [{"role": "user", "content": "hello"}]
        inject_codebase_context(messages, "hello")
        # Original should not be mutated
        assert "[Context:" not in messages[0]["content"]

    def test_empty_messages(self):
        result = inject_codebase_context([], "goal")
        assert result == []


class TestInjectMetricsContext:
    def test_adds_tenant_context(self):
        messages = [{"role": "user", "content": "analyze revenue"}]
        result = inject_metrics_context(messages, "tenant-123")
        assert "tenant-123" in result[-1]["content"]

    def test_preserves_original(self):
        messages = [{"role": "user", "content": "analyze"}]
        inject_metrics_context(messages, "t1")
        assert "[Context:" not in messages[0]["content"]


class TestBuildMessageChain:
    def test_returns_messages_and_prompt(self):
        messages, prompt = build_message_chain(
            goal="write tests",
            agent_role="cto",
            domain="code",
        )
        assert len(messages) > 0
        assert len(prompt) > 0

    def test_code_domain_injects_context(self):
        messages, _ = build_message_chain(
            goal="fix bug",
            agent_role="cto",
            domain="code",
        )
        assert "[Context:" in messages[-1]["content"]

    def test_analysis_domain_injects_metrics(self):
        messages, _ = build_message_chain(
            goal="analyze data",
            agent_role="analyst",
            domain="analysis",
            tenant_id="t-42",
        )
        assert "t-42" in messages[-1]["content"]

    def test_other_domain_no_injection(self):
        messages, _ = build_message_chain(
            goal="write blog post",
            agent_role="editor",
            domain="creative",
        )
        assert "[Context:" not in messages[-1]["content"]
        assert messages[-1]["content"] == "write blog post"
