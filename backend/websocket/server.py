"""
WebSocket Server for AntigravityKit Real-time Updates

Features:
- Connection management
- Event broadcasting
- Heartbeat mechanism
- Auto-cleanup

🏯 Binh Pháp: Tốc chiến tốc quyết - Real-time speed
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Dict

from fastapi import WebSocket


class EventType(str, Enum):
    """WebSocket event types"""

    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    LEAD_ADDED = "lead_added"
    LEAD_QUALIFIED = "lead_qualified"
    CLIENT_CONVERTED = "client_converted"
    INVOICE_CREATED = "invoice_created"
    INVOICE_PAID = "invoice_paid"
    CONTENT_CREATED = "content_created"
    FRANCHISE_ADDED = "franchise_added"
    VC_SCORE_UPDATED = "vc_score_updated"
    MOAT_UPDATED = "moat_updated"
    DATA_REFRESH = "data_refresh"
    HEARTBEAT = "heartbeat"


class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.

    Features:
    - Track active connections
    - Broadcast to all clients
    - Send to specific client
    - Heartbeat to keep connections alive
    """

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self._connection_count = 0
        self._heartbeat_task = None

    async def connect(self, websocket: WebSocket, token: str) -> str:
        """Accept new WebSocket connection and return client ID."""
        try:
            # Verify token
            # Note: We need to inject credentials_exception, creating one here for simplicity
            credentials_exception = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            user_data = verify_token(token, credentials_exception)

            await websocket.accept()
            self._connection_count += 1
            client_id = f"{user_data.username}_{self._connection_count}_{datetime.now().strftime('%H%M%S')}"
            self.active_connections[client_id] = websocket

            # Send welcome message
            await self.send_personal_message(
                client_id,
                {
                    "type": EventType.CONNECTED,
                    "client_id": client_id,
                    "message": f"Connected as {user_data.username}",
                    "timestamp": datetime.now().isoformat(),
                },
            )

            return client_id
        except Exception as e:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise e

    def disconnect(self, client_id: str):
        """Remove client from active connections."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, client_id: str, message: dict):
        """Send message to specific client."""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception:
                self.disconnect(client_id)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        disconnected = []

        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)

    async def broadcast_event(self, event_type: EventType, data: dict = None):
        """Broadcast typed event to all clients."""
        message = {
            "type": event_type,
            "data": data or {},
            "timestamp": datetime.now().isoformat(),
            "connections": len(self.active_connections),
        }
        await self.broadcast(message)

    @property
    def connection_count(self) -> int:
        """Get number of active connections."""
        return len(self.active_connections)

    async def start_heartbeat(self, interval: int = 30):
        """Start heartbeat to keep connections alive."""
        while True:
            await asyncio.sleep(interval)
            if self.active_connections:
                await self.broadcast_event(
                    EventType.HEARTBEAT, {"connections": self.connection_count}
                )

    def get_status(self) -> dict:
        """Get connection manager status."""
        return {
            "active_connections": self.connection_count,
            "client_ids": list(self.active_connections.keys()),
            "timestamp": datetime.now().isoformat(),
        }


# Global connection manager instance
manager = ConnectionManager()


# Event emitter functions for other modules to use
async def emit_lead_added(lead_data: dict):
    """Emit when new lead is added."""
    await manager.broadcast_event(EventType.LEAD_ADDED, lead_data)


async def emit_lead_qualified(lead_data: dict):
    """Emit when lead is qualified."""
    await manager.broadcast_event(EventType.LEAD_QUALIFIED, lead_data)


async def emit_client_converted(client_data: dict):
    """Emit when lead converts to client."""
    await manager.broadcast_event(EventType.CLIENT_CONVERTED, client_data)


async def emit_invoice_paid(invoice_data: dict):
    """Emit when invoice is paid."""
    await manager.broadcast_event(EventType.INVOICE_PAID, invoice_data)


async def emit_vc_score_updated(score_data: dict):
    """Emit when VC score is updated."""
    await manager.broadcast_event(EventType.VC_SCORE_UPDATED, score_data)


async def emit_data_refresh():
    """Emit general data refresh signal."""
    await manager.broadcast_event(EventType.DATA_REFRESH)
