from antigravity.core.swarm.bus import MessageBus
from antigravity.core.swarm.types import AgentMessage, MessageType
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.websocket.server import ConnectionManager


@pytest.mark.asyncio
async def test_message_bus_websocket_broadcast():
    # Mock WebSocket manager
    mock_ws_manager = AsyncMock(spec=ConnectionManager)

    # Initialize bus with mock manager
    bus = MessageBus(websocket_manager=mock_ws_manager)

    # Create test message
    msg = AgentMessage(
        sender="test_sender",
        recipient="all",
        content="Test Broadcast",
        type=MessageType.TASK
    )

    # Publish message
    bus.publish(msg)

    # Check if broadcast was called
    # Since _safe_execute creates a task, we might need to yield to event loop
    # or in a unit test environment, we might verify it called _broadcast_ws

    # For now, we verify that the bus *attempted* to use the manager
    # However, _safe_execute wraps it in create_task if async.

    # Better test: call _broadcast_ws directly to verify logic
    await bus._broadcast_ws(msg)

    mock_ws_manager.broadcast.assert_called_once()
    call_args = mock_ws_manager.broadcast.call_args[0][0]
    assert call_args["type"] == "agent_message"
    assert call_args["data"]["sender"] == "test_sender"
    assert call_args["data"]["content"] == "Test Broadcast"
