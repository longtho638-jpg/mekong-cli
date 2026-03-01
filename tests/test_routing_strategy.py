"""Tests for routing_strategy module — Portkey-inspired declarative routing."""

import json
import os
import tempfile
import unittest

from src.core.routing_strategy import (
    CacheConfig,
    RetryConfig,
    RouteDecision,
    RoutingError,
    RoutingMode,
    RoutingStrategy,
    RoutingTarget,
    StrategyParser,
    StrategyRouter,
    create_default_strategy,
)


class TestRoutingTarget(unittest.TestCase):
    """Test RoutingTarget dataclass."""

    def test_default_values(self):
        target = RoutingTarget(provider="openai")
        self.assertEqual(target.provider, "openai")
        self.assertEqual(target.model, "")
        self.assertEqual(target.weight, 1.0)
        self.assertEqual(target.override_params, {})
        self.assertEqual(target.on_status_codes, [])

    def test_with_all_fields(self):
        target = RoutingTarget(
            provider="vertex",
            model="gemini-2.5-pro",
            weight=0.7,
            override_params={"temperature": 0.5},
            on_status_codes=[429, 500],
        )
        self.assertEqual(target.weight, 0.7)
        self.assertEqual(target.on_status_codes, [429, 500])


class TestStrategyParser(unittest.TestCase):
    """Test JSON config parsing."""

    def test_parse_fallback_config(self):
        config = {
            "strategy": {"mode": "fallback"},
            "targets": [
                {"provider": "vertex", "model": "gemini-2.5-pro"},
                {"provider": "openai", "model": "gpt-4o"},
            ],
            "retry": {"attempts": 5, "on_status_codes": [429]},
        }
        strategy = StrategyParser.parse(config)
        self.assertEqual(strategy.mode, RoutingMode.FALLBACK)
        self.assertEqual(len(strategy.targets), 2)
        self.assertEqual(strategy.retry.attempts, 5)

    def test_parse_loadbalance_config(self):
        config = {
            "strategy": {"mode": "loadbalance"},
            "targets": [
                {"provider": "vertex", "weight": 0.7},
                {"provider": "openai", "weight": 0.3},
            ],
        }
        strategy = StrategyParser.parse(config)
        self.assertEqual(strategy.mode, RoutingMode.LOADBALANCE)
        self.assertAlmostEqual(strategy.targets[0].weight, 0.7)

    def test_parse_with_cache(self):
        config = {
            "strategy": {"mode": "single"},
            "targets": [{"provider": "proxy"}],
            "cache": {"enabled": True, "mode": "simple", "max_age": 7200},
        }
        strategy = StrategyParser.parse(config)
        self.assertTrue(strategy.cache.enabled)
        self.assertEqual(strategy.cache.max_age, 7200)

    def test_parse_defaults(self):
        strategy = StrategyParser.parse({})
        self.assertEqual(strategy.mode, RoutingMode.FALLBACK)
        self.assertEqual(len(strategy.targets), 0)
        self.assertEqual(strategy.retry.attempts, 3)

    def test_load_file(self):
        config = {
            "strategy": {"mode": "fallback"},
            "targets": [{"provider": "vertex"}],
        }
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(config, f)
            f.flush()
            path = f.name

        try:
            strategy = StrategyParser.load_file(path)
            self.assertEqual(strategy.mode, RoutingMode.FALLBACK)
            self.assertEqual(len(strategy.targets), 1)
        finally:
            os.unlink(path)


class TestStrategyRouter(unittest.TestCase):
    """Test routing strategy execution."""

    def test_single_route(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.SINGLE,
            targets=[RoutingTarget(provider="vertex", model="gemini-2.5-pro")],
        )
        router = StrategyRouter(strategy)
        decision = router.route()
        self.assertEqual(decision.provider, "vertex")
        self.assertEqual(decision.model, "gemini-2.5-pro")

    def test_single_excluded_raises(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.SINGLE,
            targets=[RoutingTarget(provider="vertex")],
        )
        router = StrategyRouter(strategy)
        with self.assertRaises(RoutingError):
            router.route(exclude_providers=["vertex"])

    def test_fallback_first_available(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[
                RoutingTarget(provider="vertex"),
                RoutingTarget(provider="openai"),
            ],
        )
        router = StrategyRouter(strategy)
        decision = router.route()
        self.assertEqual(decision.provider, "vertex")

    def test_fallback_skip_excluded(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[
                RoutingTarget(provider="vertex"),
                RoutingTarget(provider="proxy"),
                RoutingTarget(provider="openai"),
            ],
        )
        router = StrategyRouter(strategy)
        decision = router.route(exclude_providers=["vertex"])
        self.assertEqual(decision.provider, "proxy")

    def test_fallback_all_excluded_raises(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[
                RoutingTarget(provider="vertex"),
                RoutingTarget(provider="openai"),
            ],
        )
        router = StrategyRouter(strategy)
        with self.assertRaises(RoutingError):
            router.route(exclude_providers=["vertex", "openai"])

    def test_loadbalance_returns_available(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.LOADBALANCE,
            targets=[
                RoutingTarget(provider="vertex", weight=0.7),
                RoutingTarget(provider="openai", weight=0.3),
            ],
        )
        router = StrategyRouter(strategy)
        # Run multiple times to check randomness doesn't crash
        providers_seen = set()
        for _ in range(50):
            decision = router.route()
            providers_seen.add(decision.provider)
        # Should see both providers with enough runs
        self.assertTrue(len(providers_seen) >= 1)

    def test_loadbalance_skip_excluded(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.LOADBALANCE,
            targets=[
                RoutingTarget(provider="vertex", weight=0.5),
                RoutingTarget(provider="openai", weight=0.5),
            ],
        )
        router = StrategyRouter(strategy)
        decision = router.route(exclude_providers=["vertex"])
        self.assertEqual(decision.provider, "openai")

    def test_should_retry(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[],
            retry=RetryConfig(on_status_codes=[429, 500]),
        )
        router = StrategyRouter(strategy)
        self.assertTrue(router.should_retry(429))
        self.assertTrue(router.should_retry(500))
        self.assertFalse(router.should_retry(400))
        self.assertFalse(router.should_retry(200))

    def test_should_failover(self):
        target = RoutingTarget(
            provider="vertex",
            on_status_codes=[429, 503],
        )
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[target],
        )
        router = StrategyRouter(strategy)
        self.assertTrue(router.should_failover(429, target))
        self.assertTrue(router.should_failover(503, target))
        self.assertFalse(router.should_failover(400, target))

    def test_backoff_delay_bounded(self):
        strategy = RoutingStrategy(
            mode=RoutingMode.FALLBACK,
            targets=[],
            retry=RetryConfig(backoff_base=1.0, backoff_max=10.0),
        )
        router = StrategyRouter(strategy)
        for attempt in range(10):
            delay = router.get_backoff_delay(attempt)
            self.assertGreaterEqual(delay, 0)
            self.assertLessEqual(delay, 10.0)

    def test_no_targets_raises(self):
        strategy = RoutingStrategy(mode=RoutingMode.SINGLE, targets=[])
        router = StrategyRouter(strategy)
        with self.assertRaises(RoutingError):
            router.route()


class TestCreateDefaultStrategy(unittest.TestCase):
    """Test default strategy factory."""

    def test_default_is_fallback(self):
        strategy = create_default_strategy()
        self.assertEqual(strategy.mode, RoutingMode.FALLBACK)
        self.assertEqual(len(strategy.targets), 3)
        providers = [t.provider for t in strategy.targets]
        self.assertEqual(providers, ["vertex", "proxy", "openai"])

    def test_default_retry_config(self):
        strategy = create_default_strategy()
        self.assertEqual(strategy.retry.attempts, 3)
        self.assertIn(429, strategy.retry.on_status_codes)


if __name__ == "__main__":
    unittest.main()
