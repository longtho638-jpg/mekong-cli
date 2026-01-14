"""
VIBE Orchestrator - Agent Orchestration Protocol

Implements sequential chaining and parallel execution
patterns from ClaudeKit for agent delegation.

🏯 "Đoàn kết là sức mạnh" - Unity is strength
"""

from datetime import datetime
from typing import Callable, Dict, List, Any
import concurrent.futures

from .models.orchestrator import AgentTask, AgentType, ChainResult, ExecutionMode
from .base import BaseEngine


class VIBEOrchestrator(BaseEngine):
    """
    VIBE Agent Orchestration Engine.
    
    Patterns:
    - Sequential Chaining: Planning → Implementation → Testing → Review
    - Parallel Execution: Independent task spawning
    """

    # Standard workflow chains
    CHAINS = {
        "feature": [AgentType.PLANNER, AgentType.IMPLEMENTER, AgentType.TESTER, AgentType.REVIEWER],
        "research": [AgentType.RESEARCHER, AgentType.PLANNER],
        "bugfix": [AgentType.DEBUGGER, AgentType.IMPLEMENTER, AgentType.TESTER],
        "docs": [AgentType.DOCS_MANAGER, AgentType.PROJECT_MANAGER]
    }

    def __init__(self, max_workers: int = 4):
        super().__init__()
        self.max_workers = max_workers
        self.task_queue: List[AgentTask] = []
        self.completed_tasks: List[AgentTask] = []
        self.agent_handlers: Dict[AgentType, Callable] = {}

    def register_agent(self, agent_type: AgentType, handler: Callable) -> None:
        """Register an agent handler function."""
        self.agent_handlers[agent_type] = handler

    def create_task(
        self,
        agent: AgentType,
        prompt: str,
        description: str = "",
        priority: int = 1
    ) -> AgentTask:
        """Create a new agent task."""
        task = AgentTask(
            agent=agent, prompt=prompt,
            description=description or prompt[:50], priority=priority
        )
        self.task_queue.append(task)
        return task

    def _execute_task(self, task: AgentTask) -> AgentTask:
        """Execute a single agent task."""
        task.start()
        try:
            handler = self.agent_handlers.get(task.agent)
            if handler:
                task.complete(handler(task.prompt))
            else:
                task.complete(f"[{task.agent.value}] Executed: {task.description}")
        except Exception as e:
            task.fail(str(e))
        return task

    def execute_sequential(self, tasks: List[AgentTask]) -> ChainResult:
        """Execute tasks in sequence."""
        start = datetime.now()
        result = ChainResult(success=True)

        for task in tasks:
            self._execute_task(task)
            result.add_task(task)
            if task.status == "completed":
                self.completed_tasks.append(task)
            else:
                result.add_error(f"Failed: {task.description}")
                break

        result.total_time = (datetime.now() - start).total_seconds()
        return result

    def execute_parallel(self, tasks: List[AgentTask]) -> ChainResult:
        """Execute tasks in parallel."""
        start = datetime.now()
        result = ChainResult(success=True)

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self._execute_task, t): t for t in tasks}
            for future in concurrent.futures.as_completed(futures):
                task = futures[future]
                result.add_task(task)
                if task.status == "completed":
                    self.completed_tasks.append(task)
                else:
                    result.add_error(f"Failed: {task.description}")

        result.total_time = (datetime.now() - start).total_seconds()
        return result

    def run_chain(self, chain_name: str, base_prompt: str) -> ChainResult:
        """Run a predefined workflow chain."""
        if chain_name not in self.CHAINS:
            return ChainResult(success=False, errors=[f"Unknown chain: {chain_name}"])

        tasks = [
            self.create_task(
                agent=agent,
                prompt=f"{base_prompt} [{agent.value}]",
                description=f"{chain_name}: {agent.value}"
            )
            for agent in self.CHAINS[chain_name]
        ]
        return self.execute_sequential(tasks)

    def delegate(self, agent: AgentType, prompt: str, description: str = "") -> AgentTask:
        """Delegate a task to a specific agent."""
        task = self.create_task(agent, prompt, description)
        self._execute_task(task)
        return task

    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator stats."""
        return {
            "pending_tasks": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks),
            "available_chains": list(self.CHAINS.keys())
        }
