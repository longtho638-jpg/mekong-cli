"""
Core Viral Defense Logic.
"""

import logging
import threading
from datetime import datetime
from typing import Any, Dict, List

from .models import DefenseLevel, DegradationRule, ScaleAction, ScaleTrigger
from .defaults import (
    CPU_SCALE_UP,
    CPU_SCALE_DOWN,
    MEMORY_ALERT,
    QUEUE_DEPTH_SCALE,
    STATIC_FALLBACK_HTML,
    get_default_degradation_rules,
    get_default_triggers,
)

logger = logging.getLogger(__name__)


class ViralDefense:
    """
    🛡️ Viral Traffic Defense System

    - Auto-scaling triggers
    - Graceful degradation
    - Static fallback pages
    - CDN-ready assets
    """

    # Thresholds (kept for backward compatibility if accessed directly)
    CPU_SCALE_UP = CPU_SCALE_UP
    CPU_SCALE_DOWN = CPU_SCALE_DOWN
    MEMORY_ALERT = MEMORY_ALERT
    QUEUE_DEPTH_SCALE = QUEUE_DEPTH_SCALE

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
        self.triggers = get_default_triggers()

    def _init_degradation(self):
        """Initialize degradation rules."""
        self.degradation_rules = get_default_degradation_rules()

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
                    "last_triggered": t.last_triggered.isoformat() if t.last_triggered else None,
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
        return STATIC_FALLBACK_HTML
