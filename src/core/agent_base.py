"""
Mekong CLI - Agent Base Module

Core logic inherited from ClaudeKit DNA.
Pattern: Plan-Execute-Verify
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Any
from enum import Enum


class TaskStatus(Enum):
    """Task execution status"""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY = "retry"


@dataclass
class Task:
    """Single task unit"""

    id: str
    description: str
    input: Any
    status: TaskStatus = TaskStatus.PENDING
    output: Optional[Any] = None
    error: Optional[str] = None


@dataclass
class Result:
    """Task execution result"""

    task_id: str
    success: bool
    output: Any
    error: Optional[str] = None


class AgentBase(ABC):
    """
    Base class for all Mekong CLI agents.

    Follows ClaudeKit's Plan-Execute-Verify pattern:
    1. Plan: Parse input → Task list
    2. Execute: Run each task
    3. Verify: Validate output
    """

    def __init__(self, name: str, max_retries: int = 3):
        self.name = name
        self.max_retries = max_retries
        self.tasks: List[Task] = []

    @abstractmethod
    def plan(self, input_data: Any) -> List[Task]:
        """
        Parse input into executable tasks.

        Args:
            input_data: Raw input (string, dict, etc.)

        Returns:
            List of Task objects to execute
        """
        pass

    @abstractmethod
    def execute(self, task: Task) -> Result:
        """
        Execute a single task.

        Args:
            task: Task to execute

        Returns:
            Result with output or error
        """
        pass

    def verify(self, result: Result) -> bool:
        """
        Validate task result.

        Override for custom validation logic.

        Args:
            result: Result to validate

        Returns:
            True if valid, False to retry
        """
        return result.success

    def run(self, input_data: Any) -> List[Result]:
        """
        Main execution loop.

        Args:
            input_data: Input to process

        Returns:
            List of results from all tasks
        """
        results: List[Result] = []

        # Phase 1: Plan
        self.tasks = self.plan(input_data)

        # Phase 2-3: Execute & Verify
        for task in self.tasks:
            task.status = TaskStatus.RUNNING
            retries = 0

            while retries < self.max_retries:
                result = self.execute(task)

                if self.verify(result):
                    task.status = TaskStatus.SUCCESS
                    task.output = result.output
                    break
                else:
                    retries += 1
                    task.status = TaskStatus.RETRY

            if task.status != TaskStatus.SUCCESS:
                task.status = TaskStatus.FAILED
                task.error = result.error

            results.append(result)

        return results

    def __repr__(self) -> str:
        return f"<Agent:{self.name} tasks={len(self.tasks)}>"


# Export
__all__ = ["AgentBase", "Task", "Result", "TaskStatus"]
