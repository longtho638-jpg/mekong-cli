"""Mekong CLI - Agent Execution Sandbox.

Electron's contextIsolation + sandbox mapped to agent execution.
Controls capabilities, validates commands/paths, enforces timeouts.
"""

import fnmatch
import signal
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any


class SandboxCapability(Enum):
    """Capabilities an agent may be granted within a sandbox."""

    FILE_READ = auto()
    FILE_WRITE = auto()
    SHELL_EXEC = auto()
    NETWORK = auto()
    LLM_CALL = auto()
    GIT_OPS = auto()
    DB_ACCESS = auto()


@dataclass
class SandboxPolicy:
    """Policy governing sandbox restrictions for an agent execution."""

    allowed_capabilities: set[SandboxCapability] = field(default_factory=set)
    max_execution_time: int = 300  # seconds
    max_memory_mb: int = 512
    allowed_paths: list[str] = field(default_factory=list)
    denied_commands: list[str] = field(default_factory=list)


class Sandbox:
    """Enforces policy constraints on agent operations (contextIsolation + sandbox model)."""

    def __init__(self, policy: SandboxPolicy) -> None:
        """Args: policy: SandboxPolicy defining constraints for this sandbox."""
        self.policy = policy

    def check_capability(self, capability: SandboxCapability) -> bool:
        """Return True if capability is granted by this sandbox's policy."""
        return capability in self.policy.allowed_capabilities

    def validate_command(self, command: str) -> bool:
        """Return True if command does not match any denied pattern."""
        cmd_lower = command.lower().strip()
        for pattern in self.policy.denied_commands:
            if fnmatch.fnmatch(cmd_lower, pattern.lower()):
                return False
            if fnmatch.fnmatch(cmd_lower, f"{pattern.lower().split()[0]}*"):
                return False
        return True

    def validate_path(self, path: str) -> bool:
        """Return True if path matches an allowed pattern, or no restrictions exist."""
        if not self.policy.allowed_paths:
            return True
        return any(fnmatch.fnmatch(path, p) for p in self.policy.allowed_paths)

    def enforce(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Run fn within sandbox time limit; raises TimeoutError if exceeded."""
        timeout = self.policy.max_execution_time

        def _handler(signum: int, frame: Any) -> None:
            msg = f"Sandbox: execution exceeded {timeout}s"
            raise TimeoutError(msg)

        old = signal.signal(signal.SIGALRM, _handler)
        signal.alarm(timeout)
        try:
            return fn(*args, **kwargs)
        finally:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old)

    @classmethod
    def create_restricted(cls, capabilities: set[SandboxCapability]) -> "Sandbox":
        """Return a Sandbox with minimal policy granting only the specified capabilities."""
        return cls(SandboxPolicy(
            allowed_capabilities=capabilities,
            max_execution_time=60,
            max_memory_mb=128,
            denied_commands=["rm -rf*", "sudo*", "chmod*", "dd*"],
        ))

    @classmethod
    def create_unrestricted(cls) -> "Sandbox":
        """Return a Sandbox with all capabilities and no restrictions."""
        return cls(ADMIN_POLICY)


# Predefined policies
READONLY_POLICY = SandboxPolicy(
    allowed_capabilities={SandboxCapability.FILE_READ},
    max_execution_time=60,
    max_memory_mb=128,
    allowed_paths=["*"],
    denied_commands=["rm*", "sudo*", "chmod*", "dd*", "mkfs*"],
)

AGENT_POLICY = SandboxPolicy(
    allowed_capabilities={SandboxCapability.FILE_READ, SandboxCapability.LLM_CALL},
    max_execution_time=300,
    max_memory_mb=512,
    allowed_paths=["*"],
    denied_commands=["rm -rf*", "sudo*", "dd*", "mkfs*"],
)

ADMIN_POLICY = SandboxPolicy(
    allowed_capabilities=set(SandboxCapability),
    max_execution_time=600,
    max_memory_mb=2048,
    allowed_paths=["*"],
    denied_commands=[],
)

__all__ = [
    "ADMIN_POLICY",
    "AGENT_POLICY",
    "READONLY_POLICY",
    "Sandbox",
    "SandboxCapability",
    "SandboxPolicy",
]
