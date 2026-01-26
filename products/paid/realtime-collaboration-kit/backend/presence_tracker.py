from typing import Dict, Set, Optional
import time
from enum import Enum
from pydantic import BaseModel

class UserStatus(str, Enum):
    ONLINE = "online"
    IDLE = "idle"
    OFFLINE = "offline"

class UserPresence(BaseModel):
    user_id: str
    username: str
    color: str
    status: UserStatus
    last_active: float
    cursor_position: Optional[int] = None
    is_typing: bool = False

class PresenceTracker:
    def __init__(self):
        # room_id -> user_id -> UserPresence
        self._rooms: Dict[str, Dict[str, UserPresence]] = {}

    def update_user(self, room_id: str, user_data: UserPresence):
        if room_id not in self._rooms:
            self._rooms[room_id] = {}

        self._rooms[room_id][user_data.user_id] = user_data

    def remove_user(self, room_id: str, user_id: str):
        if room_id in self._rooms:
            if user_id in self._rooms[room_id]:
                del self._rooms[room_id][user_id]
            if not self._rooms[room_id]:
                del self._rooms[room_id]

    def get_room_presence(self, room_id: str) -> Dict[str, UserPresence]:
        return self._rooms.get(room_id, {})

    def update_cursor(self, room_id: str, user_id: str, position: int):
        if room_id in self._rooms and user_id in self._rooms[room_id]:
            self._rooms[room_id][user_id].cursor_position = position
            self._rooms[room_id][user_id].last_active = time.time()

    def update_typing(self, room_id: str, user_id: str, is_typing: bool):
        if room_id in self._rooms and user_id in self._rooms[room_id]:
            self._rooms[room_id][user_id].is_typing = is_typing
            self._rooms[room_id][user_id].last_active = time.time()

    def cleanup_inactive(self, timeout_seconds: int = 300):
        """Removes users who haven't been active for a while."""
        now = time.time()
        for room_id in list(self._rooms.keys()):
            for user_id in list(self._rooms[room_id].keys()):
                user = self._rooms[room_id][user_id]
                if now - user.last_active > timeout_seconds:
                    del self._rooms[room_id][user_id]
            if not self._rooms[room_id]:
                del self._rooms[room_id]
