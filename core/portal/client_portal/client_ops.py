"""
Client management operations for the portal.
"""
import logging
from typing import List

from .base import BasePortal
from .entities_proxy import Client

logger = logging.getLogger(__name__)

class ClientOps(BasePortal):
    def add_client(
        self, name: str, email: str, company: str, monthly_retainer: float = 0.0, notes: str = ""
    ) -> Client:
        """Thêm client mới với validation."""
        errors = self.presenter.validate_client_data(name, email, company)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")

        client = self.service.create_client_entity(
            name=name, email=email, company=company, monthly_retainer=monthly_retainer, notes=notes
        )

        self.clients[client.id] = client
        self.messages[client.id] = []
        self.repository.save_clients(self.clients)
        self.repository.save_messages(self.messages)

        self.service.update_client_stats(1, 1)
        self.repository.save_stats(self.service.stats)

        logger.info(f"Client added to portal: {company}")
        return client

    def get_all_clients(self) -> List[Client]:
        """Lấy tất cả clients."""
        return list(self.clients.values())

    def delete_client(self, client_id: str) -> bool:
        """Xóa client và related data."""
        if client_id not in self.clients:
            return False

        del self.clients[client_id]
        if client_id in self.messages:
            del self.messages[client_id]

        self.service.update_client_stats(-1, -1)
        self.repository.save_clients(self.clients)
        self.repository.save_messages(self.messages)
        self.repository.save_stats(self.service.stats)

        logger.info(f"Client {client_id} deleted")
        return True
