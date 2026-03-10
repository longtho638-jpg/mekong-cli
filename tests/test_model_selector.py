"""Tests for ALGO 2 — Model Selector."""

from __future__ import annotations


from src.core.model_selector import (
    ModelConfig,
    SystemState,
    detect_provider,
    select_model,
    _lookup_matrix,
    CONTEXT_WINDOW_MAP,
)
from src.core.task_classifier import TaskProfile


def _make_profile(**overrides) -> TaskProfile:
    """Helper to create TaskProfile with defaults."""
    defaults = {
        "complexity": "simple",
        "domain": "code",
        "agent_role": "cto",
        "requires_reasoning": False,
        "requires_creativity": False,
        "data_sensitivity": "public",
        "estimated_tokens": 1200,
        "mcu_cost": 1,
        "preferred_tier": "api_cheap",
    }
    defaults.update(overrides)
    return TaskProfile(**defaults)


def _make_state(**overrides) -> SystemState:
    """Helper to create SystemState with defaults."""
    defaults = {
        "local_available": True,
        "local_models": ["deepseek-coder-v2:16b", "llama3.2:3b", "qwen2.5:7b", "mistral:7b"],
        "api_keys": {"anthropic": True, "google": True, "openai": False},
        "local_load": 0.3,
        "tenant_tier": "growth",
    }
    defaults.update(overrides)
    return SystemState(**defaults)


class TestDetectProvider:
    def test_ollama(self):
        assert detect_provider("ollama:llama3.2:3b") == "ollama"

    def test_anthropic(self):
        assert detect_provider("claude-sonnet-4-6") == "anthropic"

    def test_google(self):
        assert detect_provider("gemini-2.0-flash") == "google"

    def test_openai(self):
        assert detect_provider("gpt-4o-mini") == "openai"

    def test_unknown(self):
        assert detect_provider("some-random-model") == "unknown"


class TestLookupMatrix:
    def test_exact_match(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        assert _lookup_matrix(profile) == "gemini-2.0-flash"

    def test_sensitive_cto(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="sensitive")
        assert _lookup_matrix(profile) == "ollama:deepseek-coder-v2:16b"

    def test_wildcard_sensitivity(self):
        profile = _make_profile(agent_role="cmo", complexity="simple",
                                requires_reasoning=False, data_sensitivity="internal")
        result = _lookup_matrix(profile)
        assert result == "gemini-2.0-flash"

    def test_complex_cto_public(self):
        profile = _make_profile(agent_role="cto", complexity="complex",
                                requires_reasoning=True, data_sensitivity="public")
        assert _lookup_matrix(profile) == "claude-opus-4-6"

    def test_cs_simple(self):
        profile = _make_profile(agent_role="cs", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        assert _lookup_matrix(profile) == "ollama:mistral:7b"


class TestSelectModel:
    def test_basic_selection(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        state = _make_state()
        config = select_model(profile, state)
        assert isinstance(config, ModelConfig)
        assert config.model_id == "gemini-2.0-flash"
        assert config.provider == "google"

    def test_local_unavailable_falls_back(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="sensitive")
        state = _make_state(local_available=False)
        config = select_model(profile, state)
        # Should fallback from ollama to API
        assert not config.model_id.startswith("ollama:")

    def test_vram_pressure_downgrades(self):
        profile = _make_profile(agent_role="cto", complexity="standard",
                                requires_reasoning=True, data_sensitivity="sensitive")
        state = _make_state(local_load=0.9)
        config = select_model(profile, state)
        # Should downgrade from 33b to smaller
        assert config.model_id != "ollama:deepseek-coder-v2:33b"

    def test_starter_no_opus(self):
        profile = _make_profile(agent_role="cto", complexity="complex",
                                requires_reasoning=True, data_sensitivity="public")
        state = _make_state(tenant_tier="starter")
        config = select_model(profile, state)
        assert config.model_id != "claude-opus-4-6"

    def test_starter_prefers_local_non_critical(self):
        profile = _make_profile(agent_role="coo", complexity="simple",
                                requires_reasoning=False, domain="ops")
        state = _make_state(tenant_tier="starter")
        config = select_model(profile, state)
        assert config.model_id.startswith("ollama:")

    def test_temperature_matches_domain(self):
        profile = _make_profile(domain="creative", agent_role="cmo",
                                complexity="simple", requires_reasoning=False)
        state = _make_state()
        config = select_model(profile, state)
        assert config.temperature == 0.8

    def test_max_tokens_is_75pct_context(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        state = _make_state()
        config = select_model(profile, state)
        expected_ctx = CONTEXT_WINDOW_MAP.get(config.model_id, 128000)
        assert config.max_tokens == int(expected_ctx * 0.75)

    def test_missing_api_key_falls_back_to_local(self):
        profile = _make_profile(agent_role="sales", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        state = _make_state(api_keys={"anthropic": False, "google": False, "openai": False})
        config = select_model(profile, state)
        # Should use local since no API keys
        assert config.model_id.startswith("ollama:")

    def test_model_not_pulled_falls_back(self):
        profile = _make_profile(agent_role="coo", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        state = _make_state(local_models=[])  # no models pulled
        config = select_model(profile, state)
        # Falls back to API since no local models
        assert not config.model_id.startswith("ollama:")

    def test_cost_fields_populated(self):
        profile = _make_profile(agent_role="cto", complexity="simple",
                                requires_reasoning=False, data_sensitivity="public")
        state = _make_state()
        config = select_model(profile, state)
        assert config.cost_per_mtok_input >= 0
        assert config.cost_per_mtok_output >= 0
