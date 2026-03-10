"""Mekong CLI - IPC Agent Message Bus.

Electron's ipcMain/ipcRenderer mapped to CLI agent communication.
on/send = fire-and-forget pub/sub. handle/invoke = async request/response.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class IPCChannel(str, Enum):
    """Named channels for inter-agent communication (mirrors Electron channel model)."""

    AGENT_REQUEST = "agent_request"
    AGENT_RESPONSE = "agent_response"
    ORCHESTRATOR_COMMAND = "orchestrator_command"
    HEALTH_CHECK = "health_check"
    SHUTDOWN = "shutdown"


@dataclass
class IPCMessage:
    """Typed message envelope with sender, payload, timestamp, and correlation_id."""

    channel: IPCChannel
    sender: str
    payload: dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    correlation_id: str = field(default_factory=lambda: uuid.uuid4().hex)


IPCHandler = Callable[[IPCMessage], None]       # on() handler: fire-and-forget
IPCInvokeHandler = Callable[[IPCMessage], Any]  # handle() handler: returns response


class IPCBus:
    """In-process IPC bus. on/send = pub/sub. handle/invoke = request/response."""

    def __init__(self, invoke_timeout: float = 10.0) -> None:
        """Args:
        invoke_timeout: Seconds before invoke() raises asyncio.TimeoutError.
        """
        self._handlers: dict[IPCChannel, list[IPCHandler]] = {}
        self._invoke_handlers: dict[IPCChannel, IPCInvokeHandler] = {}
        self._invoke_timeout = invoke_timeout

    def send(self, channel: IPCChannel, payload: dict[str, Any], sender: str = "bus") -> IPCMessage:
        """Fire-and-forget to all on() listeners. Returns the constructed IPCMessage."""
        message = IPCMessage(channel=channel, sender=sender, payload=payload)
        for handler in self._handlers.get(channel, []):
            try:
                handler(message)
            except Exception:
                pass  # listeners must not crash the bus
        return message

    def on(self, channel: IPCChannel, handler: IPCHandler) -> None:
        """Register a fire-and-forget listener (multiple per channel, mirrors ipcMain.on)."""
        self._handlers.setdefault(channel, []).append(handler)

    def handle(self, channel: IPCChannel, handler: IPCInvokeHandler) -> None:
        """Register invoke handler (one per channel, last wins, mirrors ipcMain.handle)."""
        self._invoke_handlers[channel] = handler

    async def invoke(
        self,
        channel: IPCChannel,
        payload: dict[str, Any],
        sender: str = "bus",
    ) -> Any:
        """Async request/response. Mirrors ipcRenderer.invoke.

        Raises:
            KeyError: No handle() registered for channel.
            asyncio.TimeoutError: Handler exceeded invoke_timeout.

        """
        if channel not in self._invoke_handlers:
            msg = f"No handler registered for channel: {channel.value!r}"
            raise KeyError(msg)
        message = IPCMessage(channel=channel, sender=sender, payload=payload)
        return await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None, self._invoke_handlers[channel], message,
            ),
            timeout=self._invoke_timeout,
        )

    def remove_handler(self, channel: IPCChannel) -> None:
        """Unregister the invoke handler for a channel (mirrors ipcMain.removeHandler)."""
        self._invoke_handlers.pop(channel, None)

    @property
    def registered_channels(self) -> list[IPCChannel]:
        """All channels with at least one on() or handle() registration."""
        return list(set(list(self._handlers) + list(self._invoke_handlers)))


_default_bus: IPCBus | None = None


def get_ipc_bus() -> IPCBus:
    """Get or create the shared IPCBus singleton."""
    global _default_bus
    if _default_bus is None:
        _default_bus = IPCBus()
    return _default_bus


__all__ = [
    "IPCBus",
    "IPCChannel",
    "IPCHandler",
    "IPCInvokeHandler",
    "IPCMessage",
    "get_ipc_bus",
]
