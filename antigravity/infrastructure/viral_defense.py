"""
🛡️ ViralDefense - Auto-Scaling & Graceful Degradation
======================================================

Protect the platform when traffic goes viral.
Auto-scale, degrade gracefully, never crash.

Binh Pháp: "Địa" - Defense positioning for any terrain
"""

import logging
import threading
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class DefenseLevel(Enum):
    """Defense levels for degradation."""

    NORMAL = 0  # All features enabled
    YELLOW = 1  # Disable heavy features
    ORANGE = 2  # Core features only
    RED = 3  # Emergency static mode


class ScaleAction(Enum):
    """Scaling actions."""

    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    ADD_WORKERS = "add_workers"
    REMOVE_WORKERS = "remove_workers"
    ENABLE_CDN = "enable_cdn"
    STATIC_FALLBACK = "static_fallback"


@dataclass
class ScaleTrigger:
    """Auto-scale trigger configuration."""

    name: str
    metric: str
    threshold: float
    action: ScaleAction
    cooldown_seconds: int = 60
    last_triggered: Optional[datetime] = None

    def can_trigger(self) -> bool:
        """Check if trigger is ready (cooldown passed)."""
        if not self.last_triggered:
            return True
        elapsed = (datetime.now() - self.last_triggered).seconds
        return elapsed >= self.cooldown_seconds


@dataclass
class DegradationRule:
    """Feature degradation rule."""

    feature: str
    disable_at_level: DefenseLevel
    fallback_value: Any = None
    description: str = ""


class ViralDefense:
    """
    🛡️ Viral Traffic Defense System

    - Auto-scaling triggers
    - Graceful degradation
    - Static fallback pages
    - CDN-ready assets
    """

    # Thresholds
    CPU_SCALE_UP = 80.0
    CPU_SCALE_DOWN = 30.0
    MEMORY_ALERT = 90.0
    QUEUE_DEPTH_SCALE = 100

    def __init__(self):
        self.level = DefenseLevel.NORMAL
        self.triggers: Dict[str, ScaleTrigger] = {}
        self.degradation_rules: Dict[str, DegradationRule] = {}
        self.scale_history: List[Dict] = []
        self._lock = threading.Lock()

        # Initialize defaults
        self._init_triggers()
        self._init_degradation()

    def _init_triggers(self):
        """Initialize auto-scale triggers."""
        self.triggers = {
            "cpu_high": ScaleTrigger(
                "cpu_high", "cpu_usage", 80.0, ScaleAction.SCALE_UP, 120
            ),
            "cpu_low": ScaleTrigger(
                "cpu_low", "cpu_usage", 30.0, ScaleAction.SCALE_DOWN, 300
            ),
            "queue_high": ScaleTrigger(
                "queue_high", "queue_depth", 100.0, ScaleAction.ADD_WORKERS, 60
            ),
            "memory_critical": ScaleTrigger(
                "memory_critical",
                "memory_usage",
                90.0,
                ScaleAction.STATIC_FALLBACK,
                0,  # Immediate
            ),
            "viral_detected": ScaleTrigger(
                "viral_detected",
                "requests_per_second",
                1000.0,
                ScaleAction.ENABLE_CDN,
                30,
            ),
        }

    def _init_degradation(self):
        """Initialize degradation rules."""
        self.degradation_rules = {
            "real_time_analytics": DegradationRule(
                "real_time_analytics",
                DefenseLevel.YELLOW,
                fallback_value={"message": "Analytics delayed"},
                description="Real-time analytics - defer to batch",
            ),
            "ai_features": DegradationRule(
                "ai_features",
                DefenseLevel.YELLOW,
                fallback_value=None,
                description="AI-powered features",
            ),
            "image_generation": DegradationRule(
                "image_generation",
                DefenseLevel.ORANGE,
                fallback_value={"url": "/static/placeholder.png"},
                description="Dynamic image generation",
            ),
            "search": DegradationRule(
                "search",
                DefenseLevel.ORANGE,
                fallback_value={
                    "results": [],
                    "message": "Search temporarily unavailable",
                },
                description="Full-text search",
            ),
            "webhooks": DegradationRule(
                "webhooks",
                DefenseLevel.RED,
                fallback_value={"queued": True},
                description="Webhook processing - queue only",
            ),
        }

    def check_triggers(self, metrics: Dict[str, float]) -> List[ScaleAction]:
        """Check triggers and return needed actions."""
        actions = []

        for name, trigger in self.triggers.items():
            if not trigger.can_trigger():
                continue

            value = metrics.get(trigger.metric, 0)

            # Check if threshold exceeded
            if trigger.action in [
                ScaleAction.SCALE_UP,
                ScaleAction.ADD_WORKERS,
                ScaleAction.ENABLE_CDN,
                ScaleAction.STATIC_FALLBACK,
            ]:
                # These trigger when value is HIGH
                if value >= trigger.threshold:
                    actions.append(trigger.action)
                    trigger.last_triggered = datetime.now()
                    self._log_scale_event(name, trigger.action, value)
            else:
                # SCALE_DOWN triggers when value is LOW
                if value <= trigger.threshold:
                    actions.append(trigger.action)
                    trigger.last_triggered = datetime.now()
                    self._log_scale_event(name, trigger.action, value)

        return actions

    def _log_scale_event(self, trigger: str, action: ScaleAction, value: float):
        """Log scaling event."""
        event = {
            "trigger": trigger,
            "action": action.value,
            "value": value,
            "timestamp": datetime.now().isoformat(),
        }
        self.scale_history.append(event)
        logger.warning(f"🔄 SCALE: {trigger} triggered {action.value} (value={value})")

    def set_defense_level(self, level: DefenseLevel):
        """Set defense level and apply degradation."""
        with self._lock:
            old_level = self.level
            self.level = level

            if level.value > old_level.value:
                logger.warning(f"🛡️ Defense ESCALATED: {old_level.name} → {level.name}")
            elif level.value < old_level.value:
                logger.info(f"✅ Defense DE-ESCALATED: {old_level.name} → {level.name}")

    def is_feature_enabled(self, feature: str) -> bool:
        """Check if feature is enabled at current defense level."""
        rule = self.degradation_rules.get(feature)
        if not rule:
            return True  # Unknown features enabled by default

        return self.level.value < rule.disable_at_level.value

    def get_fallback(self, feature: str) -> Any:
        """Get fallback value for degraded feature."""
        rule = self.degradation_rules.get(feature)
        return rule.fallback_value if rule else None

    def execute_action(self, action: ScaleAction) -> bool:
        """Execute scaling action."""
        logger.info(f"Executing scale action: {action.value}")

        if action == ScaleAction.SCALE_UP:
            # In cloud: trigger auto-scaling group
            # Local: log and alert
            logger.warning("📈 SCALE UP requested - add more instances")
            return True

        elif action == ScaleAction.SCALE_DOWN:
            logger.info("📉 SCALE DOWN - reducing instances")
            return True

        elif action == ScaleAction.ADD_WORKERS:
            logger.warning("👷 Adding workers to queues")
            return True

        elif action == ScaleAction.ENABLE_CDN:
            logger.warning("🌐 CDN mode enabled - serving static assets")
            return True

        elif action == ScaleAction.STATIC_FALLBACK:
            logger.critical("🚨 STATIC FALLBACK - serving static pages only")
            self.set_defense_level(DefenseLevel.RED)
            return True

        return False

    def get_status(self) -> Dict[str, Any]:
        """Get defense status."""
        return {
            "level": self.level.name,
            "triggers": {
                name: {
                    "threshold": t.threshold,
                    "action": t.action.value,
                    "last_triggered": t.last_triggered.isoformat()
                    if t.last_triggered
                    else None,
                }
                for name, t in self.triggers.items()
            },
            "degraded_features": [
                feature
                for feature, rule in self.degradation_rules.items()
                if self.level.value >= rule.disable_at_level.value
            ],
            "recent_events": self.scale_history[-10:],  # Last 10 events
        }

    def get_static_fallback_html(self) -> str:
        """Get static fallback page HTML."""
        return """
<!DOCTYPE html>
<html>
<head>
    <title>AgencyOS - High Traffic Mode</title>
    <style>
        body { font-family: system-ui; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        p { color: #666; }
        .status { background: #f0f0f0; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 We're Going Viral!</h1>
        <div class="status">
            <p>Traffic is exceptionally high right now.</p>
            <p>We're scaling up to handle the load.</p>
            <p>Please refresh in a few minutes.</p>
        </div>
        <p><small>AgencyOS - Built for Scale</small></p>
    </div>
</body>
</html>
        """


# Global singleton
_defense = ViralDefense()


def get_defense() -> ViralDefense:
    """Get global viral defense instance."""
    return _defense


# Convenience functions
def check_triggers(metrics: Dict) -> List[ScaleAction]:
    return _defense.check_triggers(metrics)


def is_feature_enabled(feature: str) -> bool:
    return _defense.is_feature_enabled(feature)


def get_defense_status() -> Dict:
    return _defense.get_status()


# Decorator for protected features
def degradable(feature: str):
    """Decorator for features that can be degraded."""

    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            if not _defense.is_feature_enabled(feature):
                fallback = _defense.get_fallback(feature)
                logger.info(f"Feature {feature} degraded, returning fallback")
                return fallback
            return func(*args, **kwargs)

        return wrapper

    return decorator
