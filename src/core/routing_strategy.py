"""
Mekong CLI - Routing Strategy Engine

Portkey-inspired declarative routing for LLM provider selection.
Supports fallback chains, load balancing, and conditional routing
via JSON/YAML configuration instead of imperative Python code.
"""

import json
import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class RoutingMode(Enum):
    """Supported routing strategies."""

    SINGLE = "single"
    FALLBACK = "fallback"
    LOADBALANCE = "loadbalance"


@dataclass
class RoutingTarget:
    """A single provider target in a routing strategy."""

    provider: str
    model: str = ""
    weight: float = 1.0
    override_params: Dict[str, Any] = field(default_factory=dict)
    on_status_codes: List[int] = field(default_factory=list)


@dataclass
class RetryConfig:
    """Retry configuration for routing."""

    attempts: int = 3
    on_status_codes: List[int] = field(default_factory=lambda: [429, 500, 502, 503])
    backoff_base: float = 1.0
    backoff_max: float = 30.0


@dataclass
class CacheConfig:
    """Cache configuration for routing."""

    enabled: bool = False
    mode: str = "simple"
    max_age: int = 3600


@dataclass
class RoutingStrategy:
    """Complete routing strategy with targets, retry, and cache config."""

    mode: RoutingMode
    targets: List[RoutingTarget] = field(default_factory=list)
    retry: RetryConfig = field(default_factory=RetryConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    metadata: Dict[str, Any] = field(default_factory=dict)


class StrategyParser:
    """Parses JSON/dict routing strategy configurations."""

    @staticmethod
    def parse(config: Dict[str, Any]) -> RoutingStrategy:
        """Parse a strategy config dict into RoutingStrategy.

        Args:
            config: Strategy configuration dictionary

        Returns:
            Parsed RoutingStrategy object
        """
        strategy_data = config.get("strategy", {})
        mode_str = strategy_data.get("mode", "fallback")
        mode = RoutingMode(mode_str)

        targets = []
        for t in config.get("targets", []):
            targets.append(RoutingTarget(
                provider=t.get("provider", ""),
                model=t.get("model", ""),
                weight=t.get("weight", 1.0),
                override_params=t.get("override_params", {}),
                on_status_codes=t.get("on_status_codes", []),
            ))

        retry_data = config.get("retry", {})
        retry = RetryConfig(
            attempts=retry_data.get("attempts", 3),
            on_status_codes=retry_data.get("on_status_codes", [429, 500, 502, 503]),
            backoff_base=retry_data.get("backoff_base", 1.0),
            backoff_max=retry_data.get("backoff_max", 30.0),
        )

        cache_data = config.get("cache", {})
        cache = CacheConfig(
            enabled=cache_data.get("enabled", False),
            mode=cache_data.get("mode", "simple"),
            max_age=cache_data.get("max_age", 3600),
        )

        return RoutingStrategy(
            mode=mode,
            targets=targets,
            retry=retry,
            cache=cache,
            metadata=config.get("metadata", {}),
        )

    @staticmethod
    def load_file(path: str) -> RoutingStrategy:
        """Load strategy from JSON file.

        Args:
            path: Path to JSON config file

        Returns:
            Parsed RoutingStrategy
        """
        with open(path) as f:
            config = json.load(f)
        return StrategyParser.parse(config)


@dataclass
class RouteDecision:
    """Result of routing decision."""

    provider: str
    model: str
    params: Dict[str, Any] = field(default_factory=dict)
    attempt: int = 0


class RoutingError(Exception):
    """Raised when all routing targets exhausted."""


class StrategyRouter:
    """Executes routing strategies to select providers.

    Supports fallback chains, weighted load balancing,
    and status-code aware failover.
    """

    def __init__(self, strategy: RoutingStrategy) -> None:
        """Initialize router with strategy.

        Args:
            strategy: Routing strategy to execute
        """
        self.strategy = strategy
        self._target_health: Dict[str, float] = {}
        self._last_lb_index = 0

    def route(
        self,
        exclude_providers: Optional[List[str]] = None,
    ) -> RouteDecision:
        """Select a provider based on routing strategy.

        Args:
            exclude_providers: Providers to skip (failed previously)

        Returns:
            RouteDecision with selected provider

        Raises:
            RoutingError: If no viable targets available
        """
        excluded = set(exclude_providers or [])

        if self.strategy.mode == RoutingMode.SINGLE:
            return self._route_single(excluded)
        elif self.strategy.mode == RoutingMode.FALLBACK:
            return self._route_fallback(excluded)
        elif self.strategy.mode == RoutingMode.LOADBALANCE:
            return self._route_loadbalance(excluded)
        else:
            raise RoutingError(f"Unknown routing mode: {self.strategy.mode}")

    def _route_single(self, excluded: set) -> RouteDecision:
        """Route to single target."""
        if not self.strategy.targets:
            raise RoutingError("No targets configured")

        target = self.strategy.targets[0]
        if target.provider in excluded:
            raise RoutingError(f"Single target {target.provider} excluded")

        return RouteDecision(
            provider=target.provider,
            model=target.model,
            params=target.override_params,
        )

    def _route_fallback(self, excluded: set) -> RouteDecision:
        """Route through fallback chain, skipping excluded providers."""
        for i, target in enumerate(self.strategy.targets):
            if target.provider in excluded:
                continue
            return RouteDecision(
                provider=target.provider,
                model=target.model,
                params=target.override_params,
                attempt=i,
            )
        raise RoutingError("All fallback targets exhausted")

    def _route_loadbalance(self, excluded: set) -> RouteDecision:
        """Route using weighted random selection."""
        available = [
            t for t in self.strategy.targets
            if t.provider not in excluded
        ]
        if not available:
            raise RoutingError("No available targets for load balancing")

        total_weight = sum(t.weight for t in available)
        if total_weight <= 0:
            target = random.choice(available)
        else:
            r = random.uniform(0, total_weight)
            cumulative = 0.0
            target = available[-1]
            for t in available:
                cumulative += t.weight
                if r <= cumulative:
                    target = t
                    break

        return RouteDecision(
            provider=target.provider,
            model=target.model,
            params=target.override_params,
        )

    def should_retry(self, status_code: int) -> bool:
        """Check if a status code should trigger retry.

        Args:
            status_code: HTTP response status code

        Returns:
            True if should retry
        """
        return status_code in self.strategy.retry.on_status_codes

    def should_failover(self, status_code: int, target: RoutingTarget) -> bool:
        """Check if status code should trigger failover to next target.

        Args:
            status_code: HTTP response status code
            target: Current target being evaluated

        Returns:
            True if should failover
        """
        if target.on_status_codes:
            return status_code in target.on_status_codes
        return status_code in [429, 500, 502, 503, 504]

    def get_backoff_delay(self, attempt: int) -> float:
        """Calculate backoff delay with jitter.

        Args:
            attempt: Current retry attempt number (0-indexed)

        Returns:
            Delay in seconds
        """
        base = self.strategy.retry.backoff_base
        max_delay = self.strategy.retry.backoff_max
        delay = min(base * (2 ** attempt), max_delay)
        return random.uniform(0, delay)


def create_default_strategy() -> RoutingStrategy:
    """Create default fallback strategy matching current mekong-cli behavior.

    Returns:
        RoutingStrategy with vertex → proxy → openai fallback
    """
    return RoutingStrategy(
        mode=RoutingMode.FALLBACK,
        targets=[
            RoutingTarget(
                provider="vertex",
                model="gemini-2.5-pro",
                on_status_codes=[429, 500, 503],
            ),
            RoutingTarget(
                provider="proxy",
                model="gemini-3-pro-high",
                on_status_codes=[429, 500, 503],
            ),
            RoutingTarget(
                provider="openai",
                model="gpt-4o",
            ),
        ],
        retry=RetryConfig(attempts=3, on_status_codes=[429, 500, 502, 503]),
    )


__all__ = [
    "RoutingMode",
    "RoutingTarget",
    "RetryConfig",
    "CacheConfig",
    "RoutingStrategy",
    "StrategyParser",
    "StrategyRouter",
    "RouteDecision",
    "RoutingError",
    "create_default_strategy",
]
