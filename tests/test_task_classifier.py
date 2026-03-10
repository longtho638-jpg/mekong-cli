"""Tests for ALGO 1 — Task Classifier."""

from __future__ import annotations

import pytest

from src.core.task_classifier import (
    TaskProfile,
    classify_task,
    _count_signals,
    _detect_domain,
    _assign_agent,
    _score_complexity,
    _detect_reasoning,
    _detect_creativity,
    _detect_sensitivity,
    MCU_MAP,
)


class TestCountSignals:
    def test_counts_matching_keywords(self):
        assert _count_signals("fix the bug in api", ["fix", "bug", "api"]) == 3

    def test_no_matches(self):
        assert _count_signals("hello world", ["fix", "bug"]) == 0

    def test_partial_match(self):
        assert _count_signals("deploy the code", ["deploy", "build"]) == 1


class TestDetectDomain:
    def test_code_domain(self):
        assert _detect_domain("implement a new api function") == "code"

    def test_creative_domain(self):
        assert _detect_domain("write a blog post about marketing") == "creative"

    def test_ops_domain(self):
        assert _detect_domain("monitor health check status") == "ops"

    def test_analysis_domain(self):
        assert _detect_domain("analyze revenue report and trends") == "analysis"

    def test_sales_domain(self):
        assert _detect_domain("upsell offer for trial upgrade") == "sales"

    def test_support_domain(self):
        assert _detect_domain("user report about error message complaint") == "support"

    def test_default_to_code(self):
        assert _detect_domain("something completely unrelated xyz") == "code"


class TestAssignAgent:
    def test_code_to_cto(self):
        assert _assign_agent("implement feature", "code") == "cto"

    def test_creative_to_cmo(self):
        assert _assign_agent("write content", "creative") == "cmo"

    def test_ops_to_coo(self):
        assert _assign_agent("check status", "ops") == "coo"

    def test_analysis_to_data(self):
        assert _assign_agent("analyze metrics", "analysis") == "data"

    def test_override_changelog_to_editor(self):
        assert _assign_agent("update changelog", "code") == "editor"

    def test_override_docs_to_editor(self):
        assert _assign_agent("write docs for api", "creative") == "editor"

    def test_override_revenue_to_cfo(self):
        assert _assign_agent("check revenue status", "analysis") == "cfo"

    def test_override_polar_to_cfo(self):
        assert _assign_agent("setup polar billing", "ops") == "cfo"

    def test_override_marketing_email_to_cmo(self):
        assert _assign_agent("send marketing email campaign", "sales") == "cmo"


class TestScoreComplexity:
    def test_simple_short_ops(self):
        assert _score_complexity("check status", "ops") == "simple"

    def test_standard_medium_code(self):
        # 7 words (< 15) = +1, "module" signal = +2, code domain = +2 → score 5 = complex
        # Use shorter goal without file scope signals for standard
        assert _score_complexity("implement a new feature for users", "code") == "standard"

    def test_complex_long_code_with_signals(self):
        goal = "refactor the entire system architecture with multiple modules and implement all the changes needed for the new file structure"
        assert _score_complexity(goal, "code") == "complex"

    def test_ops_gets_penalty(self):
        # ops domain subtracts 1 from score
        result = _score_complexity("check uptime", "ops")
        assert result == "simple"


class TestDetectReasoning:
    def test_code_always_reasoning(self):
        assert _detect_reasoning("do something", "code", "simple") is True

    def test_sales_always_reasoning(self):
        assert _detect_reasoning("do something", "sales", "simple") is True

    def test_complex_always_reasoning(self):
        assert _detect_reasoning("do something", "ops", "complex") is True

    def test_architecture_keyword(self):
        assert _detect_reasoning("design the architecture", "creative", "simple") is True

    def test_no_reasoning_simple_ops(self):
        assert _detect_reasoning("check status", "ops", "simple") is False


class TestDetectCreativity:
    def test_creative_domain(self):
        assert _detect_creativity("write content", "creative") is True

    def test_sales_domain(self):
        assert _detect_creativity("upsell offer", "sales") is True

    def test_engaging_keyword(self):
        assert _detect_creativity("make it engaging and catchy", "code") is True

    def test_no_creativity_code(self):
        assert _detect_creativity("fix the bug", "code") is False


class TestDetectSensitivity:
    def test_sensitive_password(self):
        assert _detect_sensitivity("reset user password") == "sensitive"

    def test_sensitive_token(self):
        assert _detect_sensitivity("generate api token") == "sensitive"

    def test_sensitive_secret(self):
        assert _detect_sensitivity("store secret key") == "sensitive"

    def test_internal_customer(self):
        assert _detect_sensitivity("export customer data") == "internal"

    def test_internal_billing(self):
        assert _detect_sensitivity("check billing records") == "internal"

    def test_public_default(self):
        assert _detect_sensitivity("write a blog post") == "public"


class TestClassifyTask:
    def test_returns_task_profile(self):
        result = classify_task("fix the bug in api")
        assert isinstance(result, TaskProfile)

    def test_simple_code_task(self):
        result = classify_task("fix bug")
        assert result.domain == "code"
        assert result.agent_role == "cto"
        assert result.mcu_cost in (1, 3, 5)
        assert result.requires_reasoning is True  # code domain

    def test_creative_task(self):
        result = classify_task("write a blog post about our product launch")
        assert result.domain == "creative"
        assert result.requires_creativity is True

    def test_sensitive_task_forces_local(self):
        result = classify_task("handle password reset token")
        assert result.data_sensitivity == "sensitive"
        assert result.preferred_tier == "local"

    def test_mcu_cost_matches_complexity(self):
        result = classify_task("check status")
        assert result.mcu_cost == MCU_MAP[result.complexity]

    def test_estimated_tokens_positive(self):
        result = classify_task("implement authentication")
        assert result.estimated_tokens > 0

    def test_context_param_accepted(self):
        result = classify_task("fix bug", context={"tenant_id": "t1"})
        assert isinstance(result, TaskProfile)

    def test_complex_multifile_task(self):
        goal = "refactor the entire system architecture with multiple modules and redesign all the file structure for better performance"
        result = classify_task(goal)
        assert result.complexity == "complex"
        assert result.mcu_cost == 5

    def test_support_domain(self):
        result = classify_task("user report about error message in ticket")
        assert result.domain == "support"
        assert result.agent_role == "cs"

    def test_changelog_override(self):
        result = classify_task("update the changelog with recent changes")
        assert result.agent_role == "editor"
