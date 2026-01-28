"""
Real-time Analytics WebSocket Router
====================================

Provides real-time updates for analytics dashboards using WebSockets.
"""

import asyncio
import json
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws/analytics", tags=["analytics", "realtime"])

class ConnectionManager:
    """Manages WebSocket connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        if not self.active_connections:
            return

        json_msg = json.dumps(message)
        to_remove = []

        for connection in self.active_connections:
            try:
                await connection.send_text(json_msg)
            except Exception as e:
                logger.error(f"Failed to send to websocket: {e}")
                to_remove.append(connection)

        for conn in to_remove:
            self.disconnect(conn)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for live analytics.

    Clients connect to receive real-time updates about:
    - Active users
    - Live revenue events
    - System health pulse
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming control messages if any
            # In a real app, we might receive subscription requests here
            data = await websocket.receive_text()

            # Echo for health check or heartbeat
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Background task to simulate/push real-time data
# In production, this would be triggered by an event bus (Redis PubSub)
async def broadcast_live_stats(stats: dict):
    """
    Broadcast stats to all connected clients.
    Call this from other services when interesting events happen.
    """
    await manager.broadcast(stats)
