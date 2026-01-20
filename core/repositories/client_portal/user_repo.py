"""
User/Client related database operations.
"""
import json
import logging
from datetime import datetime
from typing import Dict

from .base import BaseRepository

try:
    from ...services.client_portal_service import Client, ClientStatus
except ImportError:
    from services.client_portal_service import Client, ClientStatus

logger = logging.getLogger(__name__)

class UserRepo(BaseRepository):
    def save_clients(self, clients: Dict[str, Client]) -> bool:
        """Lưu danh sách clients."""
        try:
            data = {}
            for client_id, client in clients.items():
                data[client_id] = {
                    "id": client.id,
                    "name": client.name,
                    "email": client.email,
                    "company": client.company,
                    "status": client.status.value,
                    "created_at": client.created_at.isoformat(),
                    "portal_code": client.portal_code,
                    "notes": client.notes,
                    "monthly_retainer": client.monthly_retainer,
                    "total_spent": client.total_spent,
                }

            with open(self.clients_file, "w") as f:
                json.dump(data, f, indent=2)

            logger.info(f"Saved {len(clients)} clients")
            return True
        except Exception as e:
            logger.error(f"Failed to save clients: {e}")
            return False

    def load_clients(self) -> Dict[str, Client]:
        """Tải danh sách clients."""
        try:
            if not self.clients_file.exists():
                return {}

            with open(self.clients_file, "r") as f:
                data = json.load(f)

            clients = {}
            for client_id, client_data in data.items():
                client = Client(
                    id=client_data["id"],
                    name=client_data["name"],
                    email=client_data["email"],
                    company=client_data["company"],
                    status=ClientStatus(client_data["status"]),
                    created_at=datetime.fromisoformat(client_data["created_at"]),
                    portal_code=client_data["portal_code"],
                    notes=client_data.get("notes", ""),
                    monthly_retainer=client_data.get("monthly_retainer", 0.0),
                    total_spent=client_data.get("total_spent", 0.0),
                )
                clients[client_id] = client

            logger.info(f"Loaded {len(clients)} clients")
            return clients
        except Exception as e:
            logger.error(f"Failed to load clients: {e}")
            return {}
