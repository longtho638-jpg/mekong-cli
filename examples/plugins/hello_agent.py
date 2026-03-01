"""
Example Mekong CLI Plugin — Hello Agent

Drop this file into ~/.mekong/plugins/ to auto-register.
Usage: mekong agent hello greet

Convention: module must have register(registry) function.
"""

from src.core.agent_base import AgentBase, Task, Result


class HelloAgent(AgentBase):
    """Minimal example agent that echoes input."""

    name = "hello"
    description = "Example plugin agent — echoes input"

    def plan(self, input_data: str):
        return [Task(
            id="hello-1",
            title="Say hello",
            description=input_data,
        )]

    def execute(self, task):
        return Result(
            output=f"Hello from plugin! You said: {task.description}",
            success=True,
        )

    def verify(self, result):
        return result.success


def register(registry):
    """Called by PluginLoader to register this agent."""
    registry.register("hello", HelloAgent)
