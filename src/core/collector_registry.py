"""Mekong CLI - Collector Registry.

Auto-discovers and registers agent collectors, inspired by Netdata's
go.d.plugin modular collector pattern. Each collector implements
Init/Check/Collect/Close interface mapped to Plan-Execute-Verify.
"""

from __future__ import annotations

import importlib
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

logger = logging.getLogger(__name__)


@runtime_checkable
class CollectorSpec(Protocol):
    """Protocol for agent collectors (mirrors Netdata's Collector interface)."""

    @property
    def collector_name(self) -> str:
        """Unique collector identifier."""
        ...

    @property
    def supported_tasks(self) -> list[str]:
        """List of task types this collector handles."""
        ...

    def init(self, config: dict[str, Any]) -> bool:
        """Initialize collector (PLAN phase). Returns True if ready."""
        ...

    def check(self) -> bool:
        """Verify connectivity/availability (health check)."""
        ...

    def collect(self, task: dict[str, Any]) -> dict[str, Any]:
        """Execute collection task (EXECUTE phase). Returns results."""
        ...


@dataclass
class CollectorInfo:
    """Metadata about a registered collector."""

    name: str
    module_path: str
    supported_tasks: list[str] = field(default_factory=list)
    healthy: bool = False
    load_error: str | None = None


@dataclass
class DiscoveryResult:
    """Result of auto-discovery scan."""

    found: list[CollectorInfo] = field(default_factory=list)
    failed: list[CollectorInfo] = field(default_factory=list)
    total_scanned: int = 0


class CollectorRegistry:
    """Central registry for agent collectors with auto-discovery.

    Inspired by Netdata's plugin orchestrator: scans agent modules,
    validates interface compliance, and routes tasks to matching collectors.
    """

    def __init__(self) -> None:
        """Initialize empty registry."""
        self._collectors: dict[str, CollectorSpec] = {}
        self._info: dict[str, CollectorInfo] = {}

    def register(self, collector: CollectorSpec) -> None:
        """Register a collector instance."""
        name = collector.collector_name
        self._collectors[name] = collector
        self._info[name] = CollectorInfo(
            name=name,
            module_path=type(collector).__module__,
            supported_tasks=list(collector.supported_tasks),
            healthy=False,
        )

    def unregister(self, name: str) -> bool:
        """Remove a collector from the registry."""
        removed = self._collectors.pop(name, None) is not None
        self._info.pop(name, None)
        return removed

    def get(self, name: str) -> CollectorSpec | None:
        """Get a registered collector by name."""
        return self._collectors.get(name)

    def find_for_task(self, task_type: str) -> list[CollectorSpec]:
        """Find all collectors that support a given task type."""
        return [
            c for c in self._collectors.values()
            if task_type in c.supported_tasks
        ]

    def health_check(self) -> dict[str, bool]:
        """Run health checks on all registered collectors."""
        results: dict[str, bool] = {}
        for name, collector in self._collectors.items():
            try:
                healthy = collector.check()
            except Exception as e:
                import logging
                logging.debug(f"Health check failed for {name}: {e}")
                healthy = False
            results[name] = healthy
            if name in self._info:
                self._info[name].healthy = healthy
        return results

    def list_collectors(self) -> list[CollectorInfo]:
        """List all registered collectors with metadata."""
        return list(self._info.values())

    def discover_agents(self, agents_dir: str | None = None) -> DiscoveryResult:
        """Auto-discover agent modules from src/agents/ directory.

        Scans Python files, imports them, and checks for CollectorSpec compliance.

        Args:
            agents_dir: Override agents directory path.

        Returns:
            DiscoveryResult with found and failed collectors.

        """
        result = DiscoveryResult()
        scan_dir = Path(agents_dir) if agents_dir else Path("src/agents")

        if not scan_dir.exists():
            return result

        for py_file in sorted(scan_dir.glob("*.py")):
            if py_file.name.startswith("_"):
                continue

            result.total_scanned += 1
            module_name = f"src.agents.{py_file.stem}"
            info = CollectorInfo(name=py_file.stem, module_path=module_name)

            try:
                module = importlib.import_module(module_name)
                # Look for classes implementing CollectorSpec
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (isinstance(attr, type)
                            and attr_name != "CollectorSpec"
                            and isinstance(attr, type)
                            and _has_collector_interface(attr)):
                        info.supported_tasks = list(getattr(attr, "supported_tasks", []))
                        result.found.append(info)
                        break
                else:
                    # Module loaded but no collector found — not an error
                    info.load_error = "no CollectorSpec class"
                    result.failed.append(info)
            except Exception as e:
                info.load_error = str(e)
                result.failed.append(info)
                logger.debug("Failed to load %s: %s", module_name, e)

        return result

    def clear(self) -> None:
        """Clear all collectors."""
        self._collectors.clear()
        self._info.clear()


def _has_collector_interface(cls: type) -> bool:
    """Check if a class has the required collector interface methods."""
    required = {"collector_name", "supported_tasks", "init", "check", "collect"}
    return all(hasattr(cls, attr) for attr in required)


# Singleton accessor
_default_registry: CollectorRegistry | None = None


def get_collector_registry() -> CollectorRegistry:
    """Get or create the shared collector registry singleton."""
    global _default_registry
    if _default_registry is None:
        _default_registry = CollectorRegistry()
    return _default_registry


__all__ = [
    "CollectorInfo",
    "CollectorRegistry",
    "CollectorSpec",
    "DiscoveryResult",
    "get_collector_registry",
]
