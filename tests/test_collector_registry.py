"""Tests for Collector Registry (Netdata-inspired plugin orchestrator)."""

import pytest
from src.core.collector_registry import (
    CollectorInfo,
    CollectorRegistry,
    CollectorSpec,
    DiscoveryResult,
    get_collector_registry,
)


class FakeCollector:
    """Test collector implementing CollectorSpec protocol."""

    def __init__(self, name: str = "fake", tasks: list = None, healthy: bool = True):
        self._name = name
        self._tasks = tasks or ["test"]
        self._healthy = healthy
        self._initialized = False

    @property
    def collector_name(self) -> str:
        return self._name

    @property
    def supported_tasks(self) -> list:
        return self._tasks

    def init(self, config: dict) -> bool:
        self._initialized = True
        return True

    def check(self) -> bool:
        return self._healthy

    def collect(self, task: dict) -> dict:
        return {"status": "ok", "task": task}


class TestCollectorRegistry:
    """Test CollectorRegistry CRUD operations."""

    def test_register_and_get(self):
        reg = CollectorRegistry()
        c = FakeCollector("git")
        reg.register(c)
        assert reg.get("git") is c

    def test_get_nonexistent(self):
        reg = CollectorRegistry()
        assert reg.get("nonexistent") is None

    def test_unregister(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("temp"))
        assert reg.unregister("temp") is True
        assert reg.get("temp") is None

    def test_unregister_nonexistent(self):
        reg = CollectorRegistry()
        assert reg.unregister("nope") is False

    def test_find_for_task(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("a", tasks=["deploy", "build"]))
        reg.register(FakeCollector("b", tasks=["test"]))
        reg.register(FakeCollector("c", tasks=["deploy"]))

        deployers = reg.find_for_task("deploy")
        assert len(deployers) == 2

    def test_find_for_task_no_match(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("a", tasks=["test"]))
        assert reg.find_for_task("deploy") == []

    def test_health_check_all_healthy(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("a", healthy=True))
        reg.register(FakeCollector("b", healthy=True))
        results = reg.health_check()
        assert all(results.values())

    def test_health_check_one_unhealthy(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("good", healthy=True))
        reg.register(FakeCollector("bad", healthy=False))
        results = reg.health_check()
        assert results["good"] is True
        assert results["bad"] is False

    def test_health_check_exception_is_unhealthy(self):
        class BrokenCollector(FakeCollector):
            def check(self) -> bool:
                raise RuntimeError("broken")

        reg = CollectorRegistry()
        reg.register(BrokenCollector("broken"))
        results = reg.health_check()
        assert results["broken"] is False

    def test_list_collectors(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("x", tasks=["a", "b"]))
        infos = reg.list_collectors()
        assert len(infos) == 1
        assert infos[0].name == "x"
        assert infos[0].supported_tasks == ["a", "b"]

    def test_clear(self):
        reg = CollectorRegistry()
        reg.register(FakeCollector("a"))
        reg.register(FakeCollector("b"))
        reg.clear()
        assert reg.list_collectors() == []


class TestCollectorDiscovery:
    """Test auto-discovery of agent modules."""

    def test_discover_nonexistent_dir(self):
        reg = CollectorRegistry()
        result = reg.discover_agents("/nonexistent/path")
        assert result.total_scanned == 0
        assert result.found == []

    def test_discover_empty_dir(self, tmp_path):
        reg = CollectorRegistry()
        result = reg.discover_agents(str(tmp_path))
        assert result.total_scanned == 0

    def test_discover_skips_init_files(self, tmp_path):
        (tmp_path / "__init__.py").write_text("# init")
        (tmp_path / "__pycache__").mkdir()
        reg = CollectorRegistry()
        result = reg.discover_agents(str(tmp_path))
        assert result.total_scanned == 0


class TestCollectorInfo:
    """Test CollectorInfo dataclass."""

    def test_defaults(self):
        info = CollectorInfo(name="test", module_path="src.agents.test")
        assert info.healthy is False
        assert info.load_error is None
        assert info.supported_tasks == []


class TestSingleton:
    """Test singleton accessor."""

    def test_get_collector_registry_returns_same_instance(self):
        # Reset singleton
        import src.core.collector_registry as mod
        mod._default_registry = None
        r1 = get_collector_registry()
        r2 = get_collector_registry()
        assert r1 is r2
