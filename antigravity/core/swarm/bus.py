import asyncio
import logging
from typing import Callable, Dict, List

from .types import AgentMessage

logger = logging.getLogger(__name__)


class MessageBus:
    """
    Pub/Sub Message Bus for Agent Swarm.
    Allows agents to subscribe to specific topics or message types.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[AgentMessage], None]]] = {}
        self._history: List[AgentMessage] = []

    def subscribe(self, topic: str, callback: Callable[[AgentMessage], None]):
        """Subscribe a callback to a topic (e.g., 'all', 'agent_id', 'task_type')."""
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(callback)

    def publish(self, message: AgentMessage):
        """Publish a message to the bus."""
        self._history.append(message)

        # Notify specific recipient
        if message.recipient in self._subscribers:
            for callback in self._subscribers[message.recipient]:
                self._safe_execute(callback, message)

    def _safe_execute(self, callback, message):
        try:
            if asyncio.iscoroutinefunction(callback):
                # Schedule coroutine execution
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                if loop.is_running():
                     asyncio.create_task(callback(message))
                else:
                     loop.run_until_complete(callback(message))
            else:
                callback(message)
        except Exception as e:
            logger.error(f"Error in message bus callback: {e}")

    def get_history(self, limit: int = 100) -> List[AgentMessage]:
        return self._history[-limit:]
