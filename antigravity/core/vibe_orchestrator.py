"""
💂 VIBE Orchestrator - Agent Orchestration Protocol
===================================================

Manages the parallel and sequential coordination of AI agents within the
VIBE ecosystem. Ensures that complex multi-step missions are executed with
maximal efficiency and full telemetry tracking.

Orchestration Patterns:
- ⛓️ Sequential Chaining: Dependency-based linear execution.
- 🚀 Parallel Spawning: High-concurrency task processing.
- 💂 Delegation: Individual task routing to specialists.

Binh Pháp: 💂 Tướng (Leadership) - Orchestrating the specialized units.
"""

import concurrent.futures
import logging
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Union, TypedDict

from .base import BaseEngine
from .models.orchestrator import AgentTask, AgentType, ChainResult

# Configure logging
logger = logging.getLogger(__name__)


class OrchestrationStats(TypedDict):
    """Orchestration health and volume metrics"""
    active_blueprints: List[str]
    total_completed: int


class AgentStats(TypedDict):
    """Agent health and capabilities metrics"""
    handlers_online: int
    types_supported: List[str]


class VIBEOrchestratorStats(TypedDict):
    """Complete stats response for VIBE Orchestrator"""
    orchestration: OrchestrationStats
    agents: AgentStats


class VIBEOrchestrator(BaseEngine):
    """
    💂 VIBE Agent Orchestrator

    The master conductor for the Agency OS AI workforce.
    Integrates with Python handlers to execute agent prompts.
    """

    # Pre-defined workflow blueprints
    STANDARD_CHAINS = {
        "feature": [AgentType.PLANNER, AgentType.IMPLEMENTER, AgentType.TESTER, AgentType.REVIEWER],
        "research": [AgentType.RESEARCHER, AgentType.PLANNER],
        "bugfix": [AgentType.DEBUGGER, AgentType.IMPLEMENTER, AgentType.TESTER],
        "docs": [AgentType.DOCS_MANAGER, AgentType.PROJECT_MANAGER],
    }

    def __init__(self, max_workers: int = 4):
        super().__init__()
        self.max_workers = max_workers
        self.task_queue: List[AgentTask] = []
        self.completed_history: List[AgentTask] = []
        self.agent_handlers: Dict[AgentType, Callable] = {}

    def register_agent_handler(self, agent_type: AgentType, handler: Callable[[str], Any]) -> None:
        """Connects a specific agent type to a processing function."""
        self.agent_handlers[agent_type] = handler
        logger.debug(f"Agent handler registered for: {agent_type.value}")

    def create_task(
        self,
        agent: Union[AgentType, str],
        prompt: str,
        description: Optional[str] = None,
        priority: int = 1,
    ) -> AgentTask:
        """Initializes a new task for the workforce."""
        if isinstance(agent, str):
            agent = AgentType(agent.lower())

        task = AgentTask(
            agent=agent,
            prompt=prompt,
            description=description or f"Task for {agent.value}",
            priority=priority,
        )
        self.task_queue.append(task)
        return task

    def _process_single_task(self, task: AgentTask) -> AgentTask:
        """Internal execution unit for a single agent task."""
        task.start()
        start_time = time.time()

        try:
            handler = self.agent_handlers.get(task.agent)
            if handler:
                result = handler(task.prompt)
                task.complete(result)
            else:
                # Default mock behavior if no handler registered
                logger.warning(f"No handler for {task.agent.value}. Using mock completion.")
                task.complete(f"MOCK_RESULT: {task.agent.value} processed prompt.")

            duration = (time.time() - start_time) * 1000
            logger.info(f"Agent {task.agent.value} completed task in {duration:.0f}ms")

        except Exception as e:
            logger.error(f"Agent {task.agent.value} failure: {e}")
            task.fail(str(e))

        return task

    def execute_sequential(self, tasks: List[AgentTask]) -> ChainResult:
        """Executes a list of tasks one by one, stopping on first failure."""
        start_dt = datetime.now()
        result = ChainResult(success=True)

        logger.info(f"⛓️  Executing Sequential Chain ({len(tasks)} tasks)...")

        for task in tasks:
            self._process_single_task(task)
            result.add_task(task)

            if task.status == "completed":
                self.completed_history.append(task)
            else:
                result.add_error(f"Critical failure in phase {task.agent.value}")
                break

        result.total_time = (datetime.now() - start_dt).total_seconds()
        return result

    def execute_parallel(self, tasks: List[AgentTask]) -> ChainResult:
        """Spawns multiple agents concurrently for independent tasks."""
        start_dt = datetime.now()
        result = ChainResult(success=True)

        logger.info(f"🚀 Spawning Parallel Execution ({len(tasks)} tasks)...")

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self._process_single_task, t): t for t in tasks}
            for future in concurrent.futures.as_completed(futures):
                task = futures[future]
                result.add_task(task)

                if task.status == "completed":
                    self.completed_history.append(task)
                else:
                    result.add_error(f"Parallel task failure: {task.agent.value}")

        result.total_time = (datetime.now() - start_dt).total_seconds()
        return result

    def run_blueprint(self, blueprint_name: str, objective: str) -> ChainResult:
        """Executes a pre-defined multi-agent chain for a common goal."""
        if blueprint_name not in self.STANDARD_CHAINS:
            return ChainResult(success=False, errors=[f"Blueprint not found: {blueprint_name}"])

        tasks = []
        for agent_type in self.STANDARD_CHAINS[blueprint_name]:
            tasks.append(
                self.create_task(
                    agent=agent_type,
                    prompt=f"Goal: {objective} | Current Phase: {agent_type.value}",
                    description=f"Mission {blueprint_name}: {agent_type.value}",
                )
            )

        return self.execute_sequential(tasks)

    def delegate(self, agent: Union[AgentType, str], prompt: str) -> AgentTask:
        """Quick delegation of a single task to a specialist."""
        task = self.create_task(agent, prompt)
        return self._process_single_task(task)

    def _collect_stats(self) -> VIBEOrchestratorStats:
        """Orchestration health and volume metrics."""
        return {
            "orchestration": {
                "active_blueprints": list(self.STANDARD_CHAINS.keys()),
                "total_completed": len(self.completed_history),
            },
            "agents": {
                "handlers_online": len(self.agent_handlers),
                "types_supported": [t.value for t in AgentType],
            },
        }
