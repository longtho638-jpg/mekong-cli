"""
Mekong CLI - Agent Protocols

Runtime-checkable Protocol for agents and StreamingMixin for async support.
"""

from typing import AsyncIterator, List
try:
    from typing import Protocol, runtime_checkable
except ImportError:
    from typing_extensions import Protocol, runtime_checkable  # type: ignore

from .agent_base import Task, Result


@runtime_checkable
class AgentProtocol(Protocol):
    """
    Runtime-checkable protocol for Mekong agents.

    Defines the minimal interface every agent must expose:
    plan → execute → verify
    """

    name: str

    def plan(self, input_data: str) -> List[Task]:
        """Parse input into executable tasks."""
        ...

    def execute(self, task: Task) -> Result:
        """Execute a single task and return a Result."""
        ...

    def verify(self, result: Result) -> bool:
        """Validate a task result. Return True if acceptable."""
        ...


class StreamingMixin:
    """
    Mixin that adds async streaming to any AgentBase subclass.

    Provides a default implementation that wraps the synchronous
    execute() call. Override for true streaming behaviour.

    Usage:
        class MyAgent(StreamingMixin, AgentBase):
            ...
    """

    async def execute_stream(self, task: Task) -> AsyncIterator[str]:
        """
        Stream task output token-by-token.

        Default implementation executes synchronously and yields a
        single chunk.  Override in subclass for real streaming.

        Args:
            task: Task to execute

        Yields:
            str chunks of output
        """
        result: Result = self.execute(task)  # type: ignore[attr-defined]
        output = result.output
        yield output if isinstance(output, str) else ""


__all__ = ["AgentProtocol", "StreamingMixin"]
