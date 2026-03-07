"""Mekong CLI - Usage Metering.

Tracks and streams usage events for anomaly detection.
Monitors: API calls, agent spawns, model usage, token consumption.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

from .anomaly_detector import (
    Anomaly,
    AnomalyCategory,
    UsageAnomalyDetector,
    get_detector,
)
from .event_bus import EventBus, EventType, get_event_bus

logger = logging.getLogger(__name__)


class UsageEventType(str, Enum):
    """Usage-related event types."""

    API_CALL = "usage:api_call"
    AGENT_SPAWN = "usage:agent_spawn"
    MODEL_USAGE = "usage:model_usage"
    LLM_CALL = "usage:llm_call"
    TOKEN_USAGE = "usage:token_usage"
    ANOMALY_DETECTED = "usage:anomaly_detected"


@dataclass
class UsageEvent:
    """A single usage event."""

    event_type: UsageEventType
    category: AnomalyCategory
    metric: str
    value: float
    timestamp: float = field(default_factory=time.time)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "event_type": self.event_type.value,
            "category": self.category.value,
            "metric": self.metric,
            "value": self.value,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


class UsageMetering:
    """Tracks and streams usage events with anomaly detection.

    Usage:
        metering = UsageMetering()
        metering.record_api_call("gateway", "chat/completions")
        metering.record_agent_spawn("planner", "qwen3.5-plus")
        metering.record_token_usage("qwen3.5-plus", 1500, 500)
    """

    def __init__(
        self,
        event_bus: EventBus | None = None,
        detector: UsageAnomalyDetector | None = None,
        baseline_file: str | None = None,
    ) -> None:
        """Initialize usage metering.

        Args:
            event_bus: Event bus for emitting events. Defaults to global bus.
            detector: Anomaly detector. Defaults to singleton detector.
            baseline_file: Path to baseline file for detector.

        """
        self._event_bus = event_bus or get_event_bus()
        self._detector = detector or get_detector(baseline_file)
        self._event_handlers: dict[UsageEventType, list[Callable[[UsageEvent], None]]] = {}

        # Aggregate counters (reset on each record)
        self._api_call_count: int = 0
        self._agent_spawn_count: int = 0
        self._llm_call_count: int = 0
        self._total_input_tokens: int = 0
        self._total_output_tokens: int = 0

    def subscribe(
        self,
        event_type: UsageEventType,
        callback: Callable[[UsageEvent], None],
    ) -> None:
        """Register a callback for a usage event type."""
        self._event_handlers.setdefault(event_type, []).append(callback)

    def _emit_event(self, event: UsageEvent) -> None:
        """Emit event to registered handlers and event bus."""
        # Call registered handlers
        for callback in self._event_handlers.get(event.event_type, []):
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Handler error for {event.event_type}: {e}")

        # Emit to global event bus (use event_type.value directly for compatibility)
        self._event_bus.emit(
            EventType(event.event_type.value),
            event.to_dict(),
        )

    def _check_anomaly(
        self,
        category: AnomalyCategory,
        metric: str,
        value: float,
    ) -> Anomaly | None:
        """Check for anomaly and emit event if detected."""
        anomaly = self._detector.detect_anomaly(category, metric, value)
        if anomaly:
            self._emit_anomaly_event(anomaly)
        return anomaly

    def _emit_anomaly_event(self, anomaly: Anomaly) -> None:
        """Emit anomaly detection event."""
        self._event_bus.emit(
            EventType("usage:anomaly_detected"),
            anomaly.to_event_data(),
        )
        logger.warning(f"Usage anomaly: {anomaly._generate_message()}")

    def record_api_call(
        self,
        endpoint: str,
        method: str = "POST",
        status_code: int = 200,
    ) -> None:
        """Record an API call event.

        Args:
            endpoint: API endpoint (e.g., "chat/completions")
            method: HTTP method
            status_code: Response status code

        """
        self._api_call_count += 1

        event = UsageEvent(
            event_type=UsageEventType.API_CALL,
            category=AnomalyCategory.API_CALLS,
            metric="requests",
            value=1.0,
            metadata={
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
            },
        )
        self._emit_event(event)

        # Check for anomaly on aggregate count
        self._check_anomaly(AnomalyCategory.API_CALLS, "requests", float(self._api_call_count))

    def record_agent_spawn(
        self,
        agent_name: str,
        model: str = "",
        duration: float = 0.0,
    ) -> None:
        """Record an agent spawn event.

        Args:
            agent_name: Name of spawned agent
            model: Model used by agent
            duration: Spawn duration in seconds

        """
        self._agent_spawn_count += 1

        event = UsageEvent(
            event_type=UsageEventType.AGENT_SPAWN,
            category=AnomalyCategory.AGENT_SPAWNS,
            metric="spawns",
            value=1.0,
            metadata={
                "agent_name": agent_name,
                "model": model,
                "duration": duration,
            },
        )
        self._emit_event(event)

        # Check for anomaly
        self._check_anomaly(AnomalyCategory.AGENT_SPAWNS, "spawns", float(self._agent_spawn_count))

    def record_model_usage(
        self,
        model: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost: float = 0.0,
    ) -> None:
        """Record model usage event.

        Args:
            model: Model name (e.g., "qwen3.5-plus")
            input_tokens: Input token count
            output_tokens: Output token count
            cost: Cost in USD

        """
        total_tokens = input_tokens + output_tokens

        event = UsageEvent(
            event_type=UsageEventType.MODEL_USAGE,
            category=AnomalyCategory.MODEL_USAGE,
            metric=model,
            value=float(total_tokens),
            metadata={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost": cost,
            },
        )
        self._emit_event(event)

        # Record to detector for anomaly detection
        self._detector.record_metric(AnomalyCategory.MODEL_USAGE, model, float(total_tokens))
        self._check_anomaly(AnomalyCategory.MODEL_USAGE, model, float(total_tokens))

    def record_llm_call(
        self,
        model: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        duration: float = 0.0,
    ) -> None:
        """Record an LLM call event.

        Args:
            model: Model used
            input_tokens: Input token count
            output_tokens: Output token count
            duration: Call duration in seconds

        """
        self._llm_call_count += 1
        self._total_input_tokens += input_tokens
        self._total_output_tokens += output_tokens

        event = UsageEvent(
            event_type=UsageEventType.LLM_CALL,
            category=AnomalyCategory.LLM_CALLS,
            metric="calls",
            value=1.0,
            metadata={
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "duration": duration,
            },
        )
        self._emit_event(event)

        # Check for anomaly
        self._check_anomaly(AnomalyCategory.LLM_CALLS, "calls", float(self._llm_call_count))

    def record_token_usage(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> None:
        """Record token usage for a model.

        Args:
            model: Model name
            input_tokens: Input tokens
            output_tokens: Output tokens

        """
        total = input_tokens + output_tokens

        event = UsageEvent(
            event_type=UsageEventType.TOKEN_USAGE,
            category=AnomalyCategory.TOKEN_USAGE,
            metric=model,
            value=float(total),
            metadata={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
            },
        )
        self._emit_event(event)

        # Record to detector
        self._detector.record_metric(AnomalyCategory.TOKEN_USAGE, model, float(total))
        self._check_anomaly(AnomalyCategory.TOKEN_USAGE, model, float(total))

    def get_usage_summary(self) -> dict[str, Any]:
        """Get current usage summary."""
        return {
            "api_calls": self._api_call_count,
            "agent_spawns": self._agent_spawn_count,
            "llm_calls": self._llm_call_count,
            "total_tokens": self._total_input_tokens + self._total_output_tokens,
            "input_tokens": self._total_input_tokens,
            "output_tokens": self._total_output_tokens,
        }

    def reset_counters(self) -> None:
        """Reset aggregate counters."""
        self._api_call_count = 0
        self._agent_spawn_count = 0
        self._llm_call_count = 0
        self._total_input_tokens = 0
        self._total_output_tokens = 0

    def get_detector(self) -> UsageAnomalyDetector:
        """Get the underlying anomaly detector."""
        return self._detector


# Singleton instance
_metering: UsageMetering | None = None


def get_metering() -> UsageMetering:
    """Get or create the singleton usage metering instance."""
    global _metering
    if _metering is None:
        _metering = UsageMetering()
    return _metering


def reset_metering() -> None:
    """Reset singleton metering (for testing)."""
    global _metering
    _metering = None


__all__ = [
    "UsageEvent",
    "UsageEventType",
    "UsageMetering",
    "get_metering",
    "reset_metering",
]
