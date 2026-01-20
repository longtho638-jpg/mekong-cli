"""
ML Models - Factory Functions.
==============================

TensorFlow/PyTorch/sklearn model factories.
"""

import logging

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
