import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import logging
import os

from .room_manager import RoomManager
from .auth import verify_ws_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_server")

app = FastAPI()

# Enable CORS - Restrict origins in production via CORS_ORIGINS env var
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Restricted origins (not *)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

room_manager = RoomManager()

@app.get("/")
async def get():
    return {"message": "Realtime Collaboration Server Running"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
    username: Optional[str] = Query("Anonymous"),
    color: Optional[str] = Query("#000000")
):
    # Verify JWT token and extract user_id
    try:
        user_id = verify_ws_token(token)
    except HTTPException as e:
        await websocket.close(code=1008, reason=e.detail)
        return

    user_info = {
        "user_id": user_id,
        "username": username,
        "color": color
    }

    await room_manager.connect(room_id, websocket, user_info)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await room_manager.handle_message(room_id, websocket, message)
    except WebSocketDisconnect:
        room_manager.disconnect(room_id, websocket)
        # We might want to broadcast the disconnect here or inside room_manager
        # RoomManager.disconnect handles internal state cleanup,
        # but explicit broadcast of "left" might be needed if not handled there.
        # Let's verify RoomManager.disconnect behavior.
        # Ideally RoomManager should broadcast the exit.
        # Checking room_manager.py: disconnect removes user but commented out broadcast.
        # Let's fix that in room_manager if needed, or handle it here.
        # For now, let's assume we update room_manager to broadcast exit.
        room = room_manager.rooms.get(room_id)
        if room:
            await room.broadcast({
                "type": "presence_update",
                "data": {
                    "user_id": user_id,
                    "status": "offline"
                }
            })
    except Exception as e:
        logger.error(f"Error in websocket: {e}")
        room_manager.disconnect(room_id, websocket)

if __name__ == "__main__":
    uvicorn.run("backend.websocket_server:app", host="0.0.0.0", port=8000, reload=True)
