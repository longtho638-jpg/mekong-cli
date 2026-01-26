from typing import Dict, List, Optional
import asyncio
from fastapi import WebSocket
from .ot_engine import OTEngine, Operation, OpType
from .presence_tracker import PresenceTracker, UserPresence, UserStatus
import time

class Room:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.document_content = ""
        self.operations: List[Operation] = [] # History of applied operations
        self.clients: List[WebSocket] = []
        # Mapping websocket to user_id for quick lookup
        self.ws_to_user: Dict[WebSocket, str] = {}

    async def broadcast(self, message: dict, exclude: Optional[WebSocket] = None):
        for client in self.clients:
            if client != exclude:
                try:
                    await client.send_json(message)
                except Exception:
                    # Handle disconnected clients effectively
                    pass

    def apply_operation(self, op: Operation) -> int:
        """Applies operation and returns the new revision number."""
        self.document_content = OTEngine.apply(self.document_content, op)
        self.operations.append(op)
        return len(self.operations)

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.presence_tracker = PresenceTracker()

    def get_or_create_room(self, room_id: str) -> Room:
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(room_id)
        return self.rooms[room_id]

    async def connect(self, room_id: str, websocket: WebSocket, user_info: dict):
        await websocket.accept()
        room = self.get_or_create_room(room_id)
        room.clients.append(websocket)

        user_id = user_info.get("user_id")
        username = user_info.get("username", "Anonymous")
        color = user_info.get("color", "#000000")

        room.ws_to_user[websocket] = user_id

        # Init presence
        presence = UserPresence(
            user_id=user_id,
            username=username,
            color=color,
            status=UserStatus.ONLINE,
            last_active=time.time(),
            cursor_position=0,
            is_typing=False
        )
        self.presence_tracker.update_user(room_id, presence)

        # Send initial state
        await websocket.send_json({
            "type": "init",
            "document": room.document_content,
            "revision": len(room.operations),
            "presence": [u.dict() for u in self.presence_tracker.get_room_presence(room_id).values()]
        })

        # Broadcast join
        await room.broadcast({
            "type": "presence_update",
            "data": presence.dict()
        }, exclude=websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            if websocket in room.clients:
                room.clients.remove(websocket)
                user_id = room.ws_to_user.get(websocket)
                if user_id:
                    self.presence_tracker.remove_user(room_id, user_id)
                    # Notify others
                    # We need an async context to broadcast, usually handled by the caller or task
                    del room.ws_to_user[websocket]

    async def handle_message(self, room_id: str, websocket: WebSocket, message: dict):
        room = self.get_or_create_room(room_id)
        msg_type = message.get("type")
        user_id = room.ws_to_user.get(websocket)

        if not user_id:
            return

        if msg_type == "operation":
            op_data = message.get("operation")
            if op_data:
                # Basic OT: We act as central authority.
                # Client sends op based on revision X.
                # If server is at revision Y (Y > X), we must transform client op against ops X+1..Y.

                client_revision = message.get("revision", 0)
                server_revision = len(room.operations)

                op = Operation.from_dict(op_data)

                if client_revision < server_revision:
                    # Transform against concurrent server ops
                    concurrent_ops = room.operations[client_revision:]
                    op = OTEngine.transform_client_op(op, concurrent_ops)

                # Apply
                new_rev = room.apply_operation(op)

                # Broadcast ACK to sender (with transformed op if needed, for them to update local state if they predicted wrong)
                # Actually, standard pattern: Broadcast 'op' to EVERYONE.
                # Sender recognizes it's their op (or we send distinct ack).
                # Here we broadcast to all.

                await room.broadcast({
                    "type": "operation",
                    "operation": op.to_dict(),
                    "user_id": user_id,
                    "revision": new_rev
                })

        elif msg_type == "cursor":
            position = message.get("position", 0)
            self.presence_tracker.update_cursor(room_id, user_id, position)
            await room.broadcast({
                "type": "cursor_update",
                "user_id": user_id,
                "position": position
            }, exclude=websocket)

        elif msg_type == "typing":
            is_typing = message.get("is_typing", False)
            self.presence_tracker.update_typing(room_id, user_id, is_typing)
            await room.broadcast({
                "type": "typing_update",
                "user_id": user_id,
                "is_typing": is_typing
            }, exclude=websocket)
