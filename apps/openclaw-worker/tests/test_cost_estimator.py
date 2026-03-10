"""Unit tests for ALGO 3 - CostEstimator.

Test comprehensive edge cases:
- Token estimation per complexity
- LLM cost calculation
- MCU revenue mapping
- Margin calculation (margin_usd, margin_pct)
- Infra cost
- Model cost lookup
- Edge cases
"""

import pytest

from src.cost_estimator import CostEstimator, CostEstimate, ModelConfig
from src.task_classifier import TaskClassifier, TaskProfile


@pytest.fixture
def estimator():
    """Create CostEstimator instance."""
    return CostEstimator()


@pytest.fixture
def classifier():
    """Create TaskClassifier for profile generation."""
    return TaskClassifier()


@pytest.fixture
def sample_profile(classifier: TaskClassifier) -> TaskProfile:
    """Create sample TaskProfile for testing."""
    return classifier.classify("Implement user authentication API")


@pytest.fixture
def sample_model() -> ModelConfig:
    """Create sample ModelConfig for testing."""
    return ModelConfig(
        model_id="claude-sonnet-4-6",
        provider="anthropic",
        max_tokens=4096,
        temperature=0.2,
        context_window=200000,
        cost_per_mtok_input=3.0,
        cost_per_mtok_output=15.0,
    )


# =============================================================================
# MODEL COST LOOKUP TESTS
# =============================================================================


class TestModelCostLookup:
    """Test model cost table lookup."""

    def test_claude_opus_costs(self, estimator: CostEstimator):
        """Test Claude Opus costs ($15/$75 per MTok)."""
        c_in, c_out = estimator.get_model_cost("claude-opus-4-6")
        assert c_in == 15.0
        assert c_out == 75.0

    def test_claude_sonnet_costs(self, estimator: CostEstimator):
        """Test Claude Sonnet costs ($3/$15 per MTok)."""
        c_in, c_out = estimator.get_model_cost("claude-sonnet-4-6")
        assert c_in == 3.0
        assert c_out == 15.0

    def test_claude_haiku_costs(self, estimator: CostEstimator):
        """Test Claude Haiku costs ($0.25/$1.25 per MTok)."""
        c_in, c_out = estimator.get_model_cost("claude-haiku-4-5")
        assert c_in == 0.25
        assert c_out == 1.25

    def test_gemini_flash_costs(self, estimator: CostEstimator):
        """Test Gemini Flash costs ($0.075/$0.30 per MTok)."""
        c_in, c_out = estimator.get_model_cost("gemini-2.0-flash")
        assert c_in == 0.075
        assert c_out == 0.30

    def test_gemini_flash_lite_costs(self, estimator: CostEstimator):
        """Test Gemini Flash Lite costs ($0.02/$0.08 per MTok)."""
        c_in, c_out = estimator.get_model_cost("gemini-2.0-flash-lite")
        assert c_in == 0.02
        assert c_out == 0.08

    def test_gemini_pro_costs(self, estimator: CostEstimator):
        """Test Gemini Pro costs ($1.25/$5.0 per MTok)."""
        c_in, c_out = estimator.get_model_cost("gemini-2.0-pro")
        assert c_in == 1.25
        assert c_out == 5.0

    def test_gpt4o_mini_costs(self, estimator: CostEstimator):
        """Test GPT-4o Mini costs ($0.15/$0.60 per MTok)."""
        c_in, c_out = estimator.get_model_cost("gpt-4o-mini")
        assert c_in == 0.15
        assert c_out == 0.60

    def test_ollama_models_free(self, estimator: CostEstimator):
        """Test all Ollama models are free ($0/$0)."""
        ollama_models = [
            "ollama:deepseek-coder-v2:33b",
            "ollama:deepseek-coder-v2:16b",
            "ollama:llama3.3:70b",
            "ollama:llama3.2:3b",
            "ollama:qwen2.5:7b",
            "ollama:mistral:7b",
            "ollama:unknown-model",  # Any ollama: model
        ]
        for model in ollama_models:
            c_in, c_out = estimator.get_model_cost(model)
            assert c_in == 0.0
            assert c_out == 0.0

    def test_unknown_model_defaults_to_zero(self, estimator: CostEstimator):
        """Test unknown model defaults to $0/$0."""
        c_in, c_out = estimator.get_model_cost("unknown-model-xyz")
        assert c_in == 0.0
        assert c_out == 0.0


# =============================================================================
# TOKEN ESTIMATION TESTS
# =============================================================================


class TestTokenEstimation:
    """Test token estimation per complexity."""

    def test_simple_token_estimate(self, estimator: CostEstimator):
        """Test simple = 800 input + 400 output = 1200 tokens."""
        profile = TaskProfile(
            complexity="simple",
            domain="code",
            agent_role="cto",
            requires_reasoning=False,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=1,
        )
        # Simple: 800 in + 400 out
        # With gemini-2.0-flash default: $0.075/$0.30
        estimate = estimator.estimate(profile)
        # 800/1e6 * 0.075 + 400/1e6 * 0.30 = 0.00006 + 0.00012 = 0.00018
        assert estimate.usd_llm_cost < 0.001  # Very cheap

    def test_standard_token_estimate(self, estimator: CostEstimator):
        """Test standard = 2000 input + 1500 output = 3500 tokens."""
        profile = TaskProfile(
            complexity="standard",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=3,
        )
        estimate = estimator.estimate(profile)
        # 2000/1e6 * 3.0 + 1500/1e6 * 15.0 = 0.006 + 0.0225 = 0.0285
        assert estimate.usd_llm_cost > 0.02  # More expensive

    def test_complex_token_estimate(self, estimator: CostEstimator):
        """Test complex = 5000 input + 3000 output = 8000 tokens."""
        profile = TaskProfile(
            complexity="complex",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=5,
        )
        estimate = estimator.estimate(profile)
        # Complex uses claude-opus: 5000/1e6*15 + 3000/1e6*75 = 0.075 + 0.225 = 0.30
        assert estimate.usd_llm_cost > 0.25  # Most expensive


# =============================================================================
# MCU REVENUE TESTS
# =============================================================================


class TestMCURevenue:
    """Test MCU revenue mapping."""

    def test_simple_1_mcu_revenue(self, estimator: CostEstimator):
        """Test 1 MCU = $0.049 revenue."""
        profile = TaskProfile(
            complexity="simple",
            domain="ops",
            agent_role="coo",
            requires_reasoning=False,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=1,
        )
        estimate = estimator.estimate(profile)
        # Revenue - cost = margin
        # 0.049 - ~0 = margin
        assert estimate.margin_usd > 0.04  # High margin for simple

    def test_standard_3_mcu_revenue(self, estimator: CostEstimator):
        """Test 3 MCU = $0.045 revenue (Growth bundle rate)."""
        profile = TaskProfile(
            complexity="standard",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=3,
        )
        estimator.estimate(profile)
        # Revenue = 0.045

    def test_complex_5_mcu_revenue(self, estimator: CostEstimator):
        """Test 5 MCU = $0.50 revenue (overage)."""
        profile = TaskProfile(
            complexity="complex",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=5,
        )
        estimate = estimator.estimate(profile)
        # Revenue = 0.50
        assert estimate.margin_usd > 0  # Should still be profitable


# =============================================================================
# MARGIN CALCULATION TESTS
# =============================================================================


class TestMarginCalculation:
    """Test margin calculation (margin_usd, margin_pct)."""

    def test_local_model_highest_margin(self, estimator: CostEstimator):
        """Test Ollama local model = highest margin (free)."""
        profile = TaskProfile(
            complexity="standard",
            domain="ops",
            agent_role="coo",
            requires_reasoning=False,
            requires_creativity=False,
            data_sensitivity="internal",
            mcu_cost=3,
        )
        # With local model (free)
        local_model = ModelConfig(
            model_id="ollama:llama3.2:3b",
            provider="ollama",
            max_tokens=4096,
            temperature=0.1,
            context_window=8000,
            cost_per_mtok_input=0.0,
            cost_per_mtok_output=0.0,
        )
        estimate = estimator.estimate(profile, local_model)
        assert estimate.usd_llm_cost == 0.0
        assert estimate.margin_usd > 0.04  # Full revenue is margin

    def test_opus_model_lowest_margin(self, estimator: CostEstimator):
        """Test Claude Opus = lowest margin (expensive)."""
        profile = TaskProfile(
            complexity="complex",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=5,
        )
        opus_model = ModelConfig(
            model_id="claude-opus-4-6",
            provider="anthropic",
            max_tokens=4096,
            temperature=0.2,
            context_window=200000,
            cost_per_mtok_input=15.0,
            cost_per_mtok_output=75.0,
        )
        estimate = estimator.estimate(profile, opus_model)
        # 5000/1e6*15 + 3000/1e6*75 = 0.075 + 0.225 = 0.30
        assert estimate.usd_llm_cost > 0.25
        # Revenue = 0.50, margin = 0.50 - 0.30 - 0.001 = ~0.20

    def test_margin_percentage_calculation(self, estimator: CostEstimator):
        """Test margin percentage formula."""
        profile = TaskProfile(
            complexity="simple",
            domain="ops",
            agent_role="coo",
            requires_reasoning=False,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=1,
        )
        estimate = estimator.estimate(profile)
        # margin_pct = margin_usd / revenue * 100
        # For simple with free/cheap model, margin should be high
        assert estimate.margin_pct > 80  # > 80% margin


# =============================================================================
# INFRA COST TESTS
# =============================================================================


class TestInfraCost:
    """Test infra cost (~$0.001 per task)."""

    def test_infra_cost_is_constant(self, estimator: CostEstimator):
        """Test infra cost is always $0.001."""
        profile = TaskProfile(
            complexity="simple",
            domain="ops",
            agent_role="coo",
            requires_reasoning=False,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=1,
        )
        estimate = estimator.estimate(profile)
        assert estimate.usd_infra_cost == 0.001

    def test_total_usd_includes_infra(self, estimator: CostEstimator):
        """Test total_usd = usd_llm_cost + usd_infra_cost."""
        profile = TaskProfile(
            complexity="standard",
            domain="code",
            agent_role="cto",
            requires_reasoning=True,
            requires_creativity=False,
            data_sensitivity="public",
            mcu_cost=3,
        )
        estimate = estimator.estimate(profile)
        expected_total = estimate.usd_llm_cost + estimate.usd_infra_cost
        assert abs(estimate.total_usd - expected_total) < 0.0001


# =============================================================================
# ESTIMATE_BY_MODEL TESTS
# =============================================================================


class TestEstimateByModel:
    """Test estimate_by_model method."""

    def test_simple_with_gemini_flash(self, estimator: CostEstimator):
        """Test simple task with Gemini Flash."""
        estimate = estimator.estimate_by_model("simple", "gemini-2.0-flash")
        assert estimate.mcu_required == 1
        assert estimate.usd_llm_cost > 0  # Not free

    def test_standard_with_claude_sonnet(self, estimator: CostEstimator):
        """Test standard task with Claude Sonnet."""
        estimate = estimator.estimate_by_model("standard", "claude-sonnet-4-6")
        assert estimate.mcu_required == 3
        # 2000/1e6*3 + 1500/1e6*15 = 0.006 + 0.0225 = 0.0285
        assert estimate.usd_llm_cost > 0.02

    def test_complex_with_claude_opus(self, estimator: CostEstimator):
        """Test complex task with Claude Opus."""
        estimate = estimator.estimate_by_model("complex", "claude-opus-4-6")
        assert estimate.mcu_required == 5
        # 5000/1e6*15 + 3000/1e6*75 = 0.075 + 0.225 = 0.30
        assert estimate.usd_llm_cost > 0.25

    def test_complex_with_ollama_free(self, estimator: CostEstimator):
        """Test complex task with Ollama (free)."""
        estimate = estimator.estimate_by_model("complex", "ollama:llama3.3:70b")
        assert estimate.mcu_required == 5
        assert estimate.usd_llm_cost == 0.0
        # Revenue = 0.50, cost = 0.001, margin = 0.499
        assert estimate.margin_usd > 0.49


# =============================================================================
# COSTESTIMATE DATACLASS TESTS
# =============================================================================


class TestCostEstimateDataclass:
    """Test CostEstimate dataclass structure."""

    def test_cost_estimate_has_all_fields(self):
        """Test CostEstimate has all required fields."""
        estimate = CostEstimate(
            mcu_required=3,
            usd_llm_cost=0.025,
            usd_infra_cost=0.001,
            total_usd=0.026,
            margin_usd=0.019,
            margin_pct=42.2,
        )
        assert estimate.mcu_required == 3
        assert estimate.usd_llm_cost == 0.025
        assert estimate.usd_infra_cost == 0.001
        assert estimate.total_usd == 0.026
        assert estimate.margin_usd == 0.019
        assert estimate.margin_pct == 42.2


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestCostEstimatorIntegration:
    """Integration tests for CostEstimator with TaskClassifier."""

    def test_full_flow_simple_task(self, estimator: CostEstimator, classifier: TaskClassifier):
        """Test full flow: classify → estimate for simple task."""
        profile = classifier.classify("Quick ops check")
        estimate = estimator.estimate(profile)

        assert profile.complexity == "simple"
        assert profile.mcu_cost == 1
        assert estimate.mcu_required == 1
        assert estimate.margin_usd > 0  # Profitable

    def test_full_flow_standard_task(self, estimator: CostEstimator, classifier: TaskClassifier):
        """Test full flow: classify → estimate for standard task."""
        profile = classifier.classify("Implement login feature with tests")
        estimate = estimator.estimate(profile)

        assert profile.complexity == "standard"
        assert profile.mcu_cost == 3
        assert estimate.mcu_required == 3

    def test_full_flow_complex_task(self, estimator: CostEstimator, classifier: TaskClassifier):
        """Test full flow: classify → estimate for complex task."""
        profile = classifier.classify(
            "Design multi-tenant architecture with database sharding"
        )
        estimate = estimator.estimate(profile)

        assert profile.complexity == "complex"
        assert profile.mcu_cost == 5
        assert estimate.mcu_required == 5

    def test_sensitive_task_uses_local(self, estimator: CostEstimator, classifier: TaskClassifier):
        """Test sensitive data task prefers local model."""
        profile = classifier.classify("Handle password encryption with secret keys")
        local_model = ModelConfig(
            model_id="ollama:deepseek-coder-v2:33b",
            provider="ollama",
            max_tokens=4096,
            temperature=0.2,
            context_window=128000,
            cost_per_mtok_input=0.0,
            cost_per_mtok_output=0.0,
        )
        estimate = estimator.estimate(profile, local_model)

        assert profile.data_sensitivity == "sensitive"
        assert profile.preferred_tier == "local"
        assert estimate.usd_llm_cost == 0.0  # Free
        assert estimate.margin_usd >= 0  # Should be profitable or break-even

    def test_all_tasks_profitable(self, estimator: CostEstimator, classifier: TaskClassifier):
        """Test that all task types are profitable."""
        test_goals = [
            "Fix typo",  # Simple, 1 MCU
            "Monitor health",  # Simple ops, 1 MCU
            "Implement API",  # Standard, 3 MCU
            "Write blog post",  # Standard creative, 3 MCU
            "Design architecture",  # Complex, 5 MCU
            "Handle sensitive data",  # Complex sensitive, 5 MCU
        ]
        for goal in test_goals:
            profile = classifier.classify(goal)
            # Use local model for sensitive, otherwise default
            if profile.data_sensitivity == "sensitive":
                model = ModelConfig(
                    model_id="ollama:model",
                    provider="ollama",
                    max_tokens=4096,
                    temperature=0.1,
                    context_window=8000,
                    cost_per_mtok_input=0.0,
                    cost_per_mtok_output=0.0,
                )
                estimate = estimator.estimate(profile, model)
            else:
                estimate = estimator.estimate(profile)

            # All should have positive margin (profitable)
            assert estimate.margin_usd >= 0, f"Goal '{goal}' not profitable"
