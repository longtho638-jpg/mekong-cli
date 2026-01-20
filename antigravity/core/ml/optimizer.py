"""ML Optimizer - Main orchestration class for AI-powered pricing optimization."""

import logging
from typing import Any, Dict

from .analytics import (
    create_default_metrics,
    generate_analytics_report,
    update_metrics,
)
from .inference import (
    calculate_statistical_optimization,
    predict_conversion_rate_ml,
)
from .scoring import (
    calculate_viral_multiplier,
)
from .models import (
    ML_AVAILABLE,
    TF_AVAILABLE,
    TORCH_AVAILABLE,
    AIPricingAgent,
    GameChangingFeature,
    MLOptimizationResult,
    QuantumOptimizer,
    create_ensemble_model,
    create_pytorch_model,
    create_sklearn_model,
    create_tensorflow_model,
)
from .training import (
    analyze_market_conditions,
    calculate_immediate_reward,
    create_ab_test,
    get_recent_performance,
)

logger = logging.getLogger(__name__)


class MLOptimizer:
    """MAX LEVEL AI-powered pricing optimization engine."""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.training_data = []
        self.ab_tests = {}
        self.quantum_states = {}
        self.ai_agents = {}
        self.blockchain_prices = {}
        self.model_save_path = "data/antigravity_ml_models"

        # Game-changing metrics
        self.game_changing_metrics = create_default_metrics()

        # Initialize advanced models
        self._initialize_advanced_models()

    def _initialize_advanced_models(self):
        """Initialize advanced ML models."""
        if not ML_AVAILABLE:
            return

        # Neural Network for price optimization
        if TF_AVAILABLE:
            self.models["neural_pricing"] = create_tensorflow_model()
        elif TORCH_AVAILABLE:
            self.models["neural_pricing"] = create_pytorch_model()
        else:
            # Fallback to advanced sklearn model
            self.models["neural_pricing"] = create_sklearn_model()

        # Ensemble model for robustness
        self.models["ensemble"] = create_ensemble_model(self.models["neural_pricing"])

        # Quantum-inspired optimization
        self.models["quantum_optimization"] = QuantumOptimizer()

        # AI Agents for autonomous pricing
        self.ai_agents["pricing_agent"] = AIPricingAgent()

        logger.info("Advanced ML models initialized")

    def calculate_ai_optimized_price(
        self, base_price: float, features: Dict[str, Any], context: Dict[str, Any] = None
    ) -> MLOptimizationResult:
        """
        Calculate AI-optimized price using autonomous agents.

        Args:
            base_price: Starting price point
            features: Feature dictionary
            context: Optional context information

        Returns:
            MLOptimizationResult with optimization details
        """
        if not ML_AVAILABLE or "pricing_agent" not in self.ai_agents:
            return calculate_statistical_optimization(
                base_price, features, self.models, self.training_data
            )

        # Get AI agent decision
        pricing_agent = self.ai_agents["pricing_agent"]
        state = {
            "base_price": base_price,
            "features": features,
            "historical_performance": get_recent_performance(self.training_data),
            "market_conditions": analyze_market_conditions(),
        }

        action = pricing_agent.select_action(state)

        # Apply AI decision to pricing
        optimized_price = base_price
        quantum_result = None

        if action == "increase_price":
            optimized_price *= 1.1
        elif action == "decrease_price":
            optimized_price *= 0.9
        elif action == "quantum_jump":
            # Apply quantum optimization
            quantum_result = self.models["quantum_optimization"].optimize_price(features)
            optimized_price = quantum_result["optimal_price"]

        # Train AI agent
        reward = calculate_immediate_reward(optimized_price, base_price)
        pricing_agent.update_policy(reward, state, action)

        return MLOptimizationResult(
            optimal_price=optimized_price,
            confidence_score=0.85,  # High confidence in AI agent
            predicted_conversion_rate=predict_conversion_rate_ml(
                optimized_price, features, self.models
            ),
            viral_multiplier=calculate_viral_multiplier(features),
            strategy_used="ai_agent_autonomous",
            optimization_features=["ai_decision", "quantum_optimization", "autonomous_learning"],
            quantum_fingerprint=quantum_result.get("quantum_fingerprint")
            if quantum_result
            else None,
            training_data_points=len(self.training_data),
        )

    def create_advanced_ab_test(
        self,
        test_id: str,
        name: str,
        control_price: float,
        variant_configs: Dict[str, Dict[str, Any]],
        duration_days: int = 7,
    ):
        """
        Create advanced A/B test with statistical power.

        Args:
            test_id: Unique test identifier
            name: Human-readable test name
            control_price: Control group price
            variant_configs: Variant configurations
            duration_days: Test duration

        Returns:
            ABTestAdvanced configuration
        """
        return create_ab_test(test_id, name, control_price, variant_configs, duration_days)

    def update_game_changing_metrics(self, feature: GameChangingFeature, value: float):
        """
        Update game-changing metrics.

        Args:
            feature: Feature category to update
            value: Value to add
        """
        self.game_changing_metrics = update_metrics(
            self.game_changing_metrics, feature, value
        )

    def get_game_changing_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive game-changing analytics.

        Returns:
            Analytics dictionary with all metrics
        """
        return generate_analytics_report(
            self.game_changing_metrics,
            self.models,
            self.ai_agents,
            self.quantum_states,
        )
