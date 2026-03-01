"""
Mekong CLI - DAG Scheduler

Topological execution of recipe steps with dependency tracking.
Steps without mutual dependencies run concurrently via ThreadPoolExecutor.
Falls back to sequential when no dependencies defined.
"""

import logging
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


@dataclass
class DAGStepResult:
    """Result of a single DAG step execution."""

    order: int
    success: bool
    result: Any = None
    error: Optional[str] = None


class DAGScheduler:
    """
    DAG-based scheduler for recipe steps.

    Identifies steps whose dependencies are satisfied and executes them
    concurrently using ThreadPoolExecutor (stdlib, no asyncio).

    Args:
        steps: List of recipe steps with .order and .dependencies
        max_workers: Thread pool size (default: 4)
    """

    def __init__(self, steps: list, max_workers: int = 4) -> None:
        self._steps = {s.order: s for s in steps}
        self._max_workers = max_workers
        self._completed: Set[int] = set()
        self._failed: Set[int] = set()
        self._cancelled: Set[int] = set()
        self._lock = threading.Lock()

    def get_ready_steps(self) -> list:
        """Return steps whose dependencies are all completed."""
        ready = []
        with self._lock:
            for order, step in self._steps.items():
                if order in self._completed or order in self._failed or order in self._cancelled:
                    continue
                deps = getattr(step, 'dependencies', []) or []
                if all(d in self._completed for d in deps):
                    ready.append(step)
        return ready

    def mark_completed(self, order: int) -> None:
        """Mark step as successfully completed."""
        with self._lock:
            self._completed.add(order)

    def mark_failed(self, order: int) -> None:
        """Mark step as failed and cancel downstream dependents."""
        with self._lock:
            self._failed.add(order)
            self._cancel_downstream(order)

    def _cancel_downstream(self, failed_order: int) -> None:
        """Cancel steps that depend on a failed step (transitive)."""
        queue = [failed_order]
        while queue:
            current = queue.pop(0)
            for order, step in self._steps.items():
                if order in self._cancelled:
                    continue
                deps = getattr(step, 'dependencies', []) or []
                if current in deps:
                    self._cancelled.add(order)
                    queue.append(order)

    def is_done(self) -> bool:
        """True when all steps are completed, failed, or cancelled."""
        all_orders = set(self._steps.keys())
        return all_orders == (self._completed | self._failed | self._cancelled)

    @property
    def cancelled_steps(self) -> Set[int]:
        """Steps cancelled due to upstream failure."""
        return self._cancelled.copy()

    def has_dependencies(self) -> bool:
        """Check if any step has non-empty dependencies."""
        for step in self._steps.values():
            deps = getattr(step, 'dependencies', []) or []
            if deps:
                return True
        return False

    def execute_all(
        self,
        executor_fn: Callable,
        on_complete: Optional[Callable] = None,
    ) -> Dict[int, DAGStepResult]:
        """
        Execute all steps respecting DAG dependencies.

        Args:
            executor_fn: Callable(step) → result with .verification.passed
            on_complete: Optional callback(order, dag_result) after each step

        Returns:
            Dict mapping step order → DAGStepResult
        """
        results: Dict[int, DAGStepResult] = {}
        in_flight: Set[int] = set()

        with ThreadPoolExecutor(max_workers=self._max_workers) as pool:
            futures: Dict[Future, Any] = {}

            while not self.is_done():
                ready = self.get_ready_steps()
                new_ready = [s for s in ready if s.order not in in_flight]

                for step in new_ready:
                    in_flight.add(step.order)
                    future = pool.submit(executor_fn, step)
                    futures[future] = step

                if not futures:
                    break

                done_futures = []
                for future in as_completed(futures):
                    step = futures[future]
                    try:
                        result = future.result()
                        passed = getattr(
                            getattr(result, 'verification', None),
                            'passed', False,
                        )
                        dag_result = DAGStepResult(
                            order=step.order,
                            success=passed,
                            result=result,
                        )
                    except Exception as e:
                        logger.error("Step %d failed: %s", step.order, e)
                        dag_result = DAGStepResult(
                            order=step.order, success=False, error=str(e),
                        )
                        passed = False

                    results[step.order] = dag_result

                    if passed:
                        self.mark_completed(step.order)
                    else:
                        self.mark_failed(step.order)

                    if on_complete:
                        on_complete(step.order, dag_result)

                    done_futures.append(future)

                for f in done_futures:
                    del futures[f]

        return results


def validate_dag(steps: list) -> Optional[str]:
    """
    Validate DAG has no circular dependencies.

    Returns:
        Error message if circular, None if valid.
    """
    adj: Dict[int, List[int]] = defaultdict(list)
    orders = set()

    for step in steps:
        orders.add(step.order)
        deps = getattr(step, 'dependencies', []) or []
        for dep in deps:
            adj[dep].append(step.order)

    # Kahn's algorithm for cycle detection
    in_degree: Dict[int, int] = {o: 0 for o in orders}
    for step in steps:
        deps = getattr(step, 'dependencies', []) or []
        for dep in deps:
            if step.order in in_degree:
                in_degree[step.order] += 1

    queue = [o for o, d in in_degree.items() if d == 0]
    visited = 0

    while queue:
        node = queue.pop(0)
        visited += 1
        for neighbor in adj.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if visited != len(orders):
        return "Circular dependency detected in recipe steps"
    return None


__all__ = ["DAGScheduler", "DAGStepResult", "validate_dag"]
