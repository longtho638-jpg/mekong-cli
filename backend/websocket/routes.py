"""
WebSocket Routes for AntigravityKit Real-time Updates

Endpoints:
- /ws - Main WebSocket connection
- /ws/status - Get WebSocket server status

🏯 Binh Pháp: Real-time intelligence
"""

from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .server import EventType, manager

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time updates.

    Connect: ws://localhost:8000/ws

    Events received:
    - connected: Initial connection confirmation
    - lead_added: New lead added
    - invoice_paid: Invoice payment received
    - vc_score_updated: VC readiness score changed
    - heartbeat: Keep-alive signal
    - data_refresh: General refresh signal
    """
    client_id = await manager.connect(websocket)

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_json()

            # Handle client messages
            if data.get("type") == "ping":
                await manager.send_personal_message(
                    client_id, {"type": "pong", "client_id": client_id}
                )
            elif data.get("type") == "subscribe":
                # Client can subscribe to specific events
                await manager.send_personal_message(
                    client_id, {"type": "subscribed", "events": data.get("events", ["all"])}
                )
            elif data.get("type") == "request_refresh":
                # Client requests data refresh
                from .server import emit_data_refresh

                await emit_data_refresh()

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast_event(
            EventType.DISCONNECTED,
            {"client_id": client_id, "remaining_connections": manager.connection_count},
        )


@router.get("/status")
async def get_websocket_status() -> Dict[str, Any]:
    """Get WebSocket server status and active connections."""
    return manager.get_status()


@router.post("/broadcast")
async def broadcast_message(message: Dict[str, Any]) -> Dict[str, str]:
    """
    Broadcast a message to all connected clients.

    Body:
    {
        "type": "custom_event",
        "data": {...}
    }
    """
    await manager.broadcast(message)
    return {"status": "success", "sent_to": manager.connection_count}


@router.post("/trigger/{event_type}")
async def trigger_event(event_type: str, data: Dict[str, Any] = None) -> Dict[str, str]:
    """
    Trigger a specific event type for testing.

    Available events:
    - lead_added
    - invoice_paid
    - vc_score_updated
    - data_refresh
    """
    try:
        event = EventType(event_type)
        await manager.broadcast_event(event, data or {})
        return {"status": "success", "event": event_type, "sent_to": manager.connection_count}
    except ValueError:
        return {"status": "error", "message": f"Unknown event type: {event_type}"}
