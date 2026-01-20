"""
🧲 Client Magnet Persistence Logic
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

from .models import Client, Lead, LeadSource, LeadStatus

# Configure logging
logger = logging.getLogger(__name__)


class ClientMagnetPersistence:
    """Handles storage of leads and clients data."""

    def __init__(self, storage_path: Path):
        self.leads_file = storage_path / "leads.json"
        self.clients_file = storage_path / "clients.json"

    def save(self, leads: List[Lead], clients: List[Client]) -> None:
        """Persists leads and clients state to JSON."""
        try:
            self._save_leads(leads)
            self._save_clients(clients)
        except Exception as e:
            logger.error(f"Failed to save client magnet data: {e}")

    def _save_leads(self, leads: List[Lead]) -> None:
        data = {
            "metadata": {"last_updated": datetime.now().isoformat()},
            "leads": [
                {
                    "name": l.name,
                    "company": l.company,
                    "email": l.email,
                    "phone": l.phone,
                    "source": l.source.value,
                    "status": l.status.value,
                    "score": l.score,
                    "budget": l.budget,
                    "notes": l.notes,
                    "created_at": l.created_at.isoformat(),
                    "metadata": l.metadata,
                }
                for l in leads
            ],
        }
        self.leads_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def _save_clients(self, clients: List[Client]) -> None:
        data = {
            "metadata": {"last_updated": datetime.now().isoformat()},
            "clients": [
                {
                    "id": c.id,
                    "name": c.name,
                    "company": c.company,
                    "email": c.email,
                    "phone": c.phone,
                    "zalo": c.zalo,
                    "total_ltv": c.total_ltv,
                    "active_projects": c.active_projects,
                    "joined_at": c.joined_at.isoformat(),
                }
                for c in clients
            ],
        }
        self.clients_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def load(self) -> Tuple[List[Lead], List[Client]]:
        """Loads leads and clients state from disk."""
        return self._load_leads(), self._load_clients()

    def _load_leads(self) -> List[Lead]:
        if not self.leads_file.exists():
            return []

        leads = []
        try:
            data = json.loads(self.leads_file.read_text(encoding="utf-8"))
            for l in data.get("leads", []):
                leads.append(
                    Lead(
                        name=l["name"],
                        company=l.get("company", ""),
                        email=l.get("email", ""),
                        phone=l.get("phone", ""),
                        source=LeadSource(l["source"]),
                        status=LeadStatus(l["status"]),
                        score=l.get("score", 50),
                        budget=l.get("budget", 0.0),
                        notes=l.get("notes", ""),
                        created_at=datetime.fromisoformat(l["created_at"]),
                        metadata=l.get("metadata", {}),
                    )
                )
        except Exception as e:
            logger.warning(f"Leads data loading failed: {e}")
        return leads

    def _load_clients(self) -> List[Client]:
        if not self.clients_file.exists():
            return []

        clients = []
        try:
            data = json.loads(self.clients_file.read_text(encoding="utf-8"))
            for c in data.get("clients", []):
                clients.append(
                    Client(
                        id=c["id"],
                        name=c["name"],
                        company=c["company"],
                        email=c["email"],
                        phone=c.get("phone", ""),
                        zalo=c.get("zalo", ""),
                        total_ltv=c.get("total_ltv", 0.0),
                        active_projects=c.get("active_projects", 0),
                        joined_at=datetime.fromisoformat(c["joined_at"]),
                    )
                )
        except Exception as e:
            logger.warning(f"Clients data loading failed: {e}")
        return clients
