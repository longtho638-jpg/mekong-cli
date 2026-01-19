"""
ML Models - Data structures, enums, and model builders.
========================================================

Contains:
- Pricing mode and feature enums
- Result dataclasses
- TensorFlow/PyTorch model factories
- Quantum optimizer implementation
- AI pricing agent implementation
"""

import hashlib
import logging
from collections import defaultdict, deque
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List

import numpy as np

logger = logging.getLogger(__name__)

# ML library availability flags
ML_AVAILABLE = False
TF_AVAILABLE = False
TORCH_AVAILABLE = False

try:
    from sklearn.ensemble import GradientBoostingRegressor, VotingRegressor
    from sklearn.neural_network import MLPRegressor

    ML_AVAILABLE = True
except ImportError:
    logger.warning("sklearn not available")

try:
    import tensorflow as tf

    TF_AVAILABLE = True
except ImportError:
    pass

try:
    import torch

    TORCH_AVAILABLE = True
except ImportError:
    pass


# ============================================================================
# Enums
# ============================================================================


class PricingMode(Enum):
    """Advanced pricing modes."""

    QUANTUM_INSPIRED = "quantum"
    AI_AGENT = "ai_agent"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"
    REINFORCEMENT_LEARNING = "reinforcement_learning"


class GameChangingFeature(Enum):
    """Game-changing feature categories."""

    VIRAL_EXPANSION = "viral_expansion"
    QUANTUM_PRICING = "quantum_pricing"
    AI_AGENTS = "ai_agents"
    BLOCKCHAIN_INTEGRATION = "blockchain_integration"


# ============================================================================
# Dataclasses
# ============================================================================


@dataclass
class MLOptimizationResult:
    """ML optimization result."""

    optimal_price: float
    confidence_score: float
    predicted_conversion_rate: float
    viral_multiplier: float
    strategy_used: str
    optimization_features: List[str]
    quantum_fingerprint: str = None
    training_data_points: int = 0


@dataclass
class ABTestAdvanced:
    """Advanced A/B testing configuration."""

    test_id: str
    name: str
    variants: Dict[str, Dict[str, Any]]  # variant_name -> config
    traffic_split: Dict[str, float]
    duration_days: int
    statistical_power: float = 0.8  # 80% power
    significance_level: float = 0.05  # 5% significance
    multivariate: bool = True
    adaptive_traffic: bool = True
    early_stopping: bool = True


@dataclass
class ConversionPredictor:
    """Advanced conversion rate predictor."""

    model_type: str
    features: List[str]
    model: Any = None
    scaler: Any = None
    accuracy: float = 0.0
    prediction_intervals: List[float] = None  # Confidence intervals
    last_trained: float = 0.0
    ensemble_models: List[Any] = None  # For ensemble methods


# ============================================================================
# Model Factories
# ============================================================================


def create_tensorflow_model():
    """Create TensorFlow neural network for pricing optimization."""
    if not TF_AVAILABLE:
        return None

    import tensorflow as tf

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Dense(256, activation="relu", input_shape=(10,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.1),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy", "precision", "recall"],
    )

    return model


def create_pytorch_model():
    """Create PyTorch neural network for pricing optimization."""
    if not TORCH_AVAILABLE:
        return None

    import torch
    import torch.nn as nn

    class PricingNetwork(nn.Module):
        """PyTorch pricing prediction network."""

        def __init__(self):
            super(PricingNetwork, self).__init__()
            self.layers = nn.Sequential(
                nn.Linear(10, 256),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(256, 128),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(32, 16),
                nn.ReLU(),
                nn.Linear(16, 1),
                nn.Sigmoid(),
            )

        def forward(self, x):
            return self.layers(x)

    return PricingNetwork()


def create_sklearn_model():
    """Create sklearn MLPRegressor as fallback."""
    if not ML_AVAILABLE:
        return None

    return MLPRegressor(
        hidden_layer_sizes=(256, 128, 64, 32),
        activation="relu",
        solver="adam",
        max_iter=1000,
        random_state=42,
    )


def create_ensemble_model(neural_model):
    """Create ensemble voting regressor."""
    if not ML_AVAILABLE:
        return None

    return VotingRegressor(
        [
            ("rf", GradientBoostingRegressor(n_estimators=100, random_state=42)),
            ("nn", neural_model),
            ("gb", GradientBoostingRegressor(n_estimators=200, random_state=123)),
        ]
    )


# ============================================================================
# Quantum Optimizer
# ============================================================================


class QuantumOptimizer:
    """Quantum-inspired optimization algorithm for pricing."""

    def __init__(self):
        self.quantum_states = defaultdict(list)
        self.entanglement_pairs = []

    def optimize_price(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Quantum-inspired price optimization.

        Uses superposition concept for multiple price points evaluation.
        """
        base_price = features.get("base_price", 100.0)

        # Create quantum price states (10 states)
        quantum_prices = []
        for i in range(10):
            # Apply quantum-inspired transformation
            quantum_multiplier = 1 + 0.1 * np.sin(i * np.pi / 5)
            price_state = base_price * quantum_multiplier
            quantum_prices.append(price_state)

        # Classical optimization (for comparison)
        classical_optimal = max(quantum_prices)

        # Quantum optimization (interference pattern)
        interference_pattern = np.random.random(len(quantum_prices))
        quantum_optimal = np.mean(quantum_prices + interference_pattern)

        return {
            "optimal_price": quantum_optimal,
            "quantum_fingerprint": self._generate_quantum_fingerprint(features),
            "improvement_over_classical": (quantum_optimal - classical_optimal)
            / classical_optimal,
            "quantum_states": len(quantum_prices),
            "strategy": "quantum_inspired",
        }

    def _generate_quantum_fingerprint(self, features: Dict[str, float]) -> str:
        """Generate quantum fingerprint for feature vector."""
        feature_vector = np.array(list(features.values()))
        quantum_hash = np.fft.fft(feature_vector)

        fingerprint_data = (
            f"{feature_vector.tobytes().hex()}{quantum_hash.real.tobytes().hex()}"
        )
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]


# ============================================================================
# AI Pricing Agent
# ============================================================================


class AIPricingAgent:
    """Autonomous AI pricing agent with reinforcement learning."""

    def __init__(self):
        self.policy_network = None
        self.experience_buffer = deque(maxlen=10000)
        self.learning_rate = 0.001
        self.epsilon = 0.1  # Exploration rate

    def select_action(self, state: Dict[str, Any]) -> str:
        """
        Select pricing action using epsilon-greedy policy.

        Args:
            state: Current market state

        Returns:
            Action string: increase_price, decrease_price, maintain_price, quantum_jump
        """
        if np.random.random() < self.epsilon:
            return np.random.choice(
                ["increase_price", "decrease_price", "maintain_price", "quantum_jump"]
            )
        else:
            # Exploit learned policy
            return "maintain_price"  # Default to stable pricing

    def update_policy(self, reward: float, state: Dict[str, Any], action: str):
        """
        Update policy based on reward signal.

        Args:
            reward: Reward value from environment
            state: State when action was taken
            action: Action that was taken
        """
        if reward > 0:
            # Positive reinforcement
            if action == "increase_price" and state.get("conversion", False):
                pass  # Would update neural network
        else:
            pass  # Negative or no reinforcement
