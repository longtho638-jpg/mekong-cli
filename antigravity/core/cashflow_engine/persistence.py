"""
💰 Cashflow Persistence Logic
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List

from .models import Revenue, RevenueStream

# Configure logging
logger = logging.getLogger(__name__)


class CashflowPersistence:
    """Handles storage of revenue data."""

    def __init__(self, storage_path: Path):
        self.revenue_file = storage_path / "revenues.json"

    def save(self, revenues: List[Revenue]) -> None:
        """Persists revenue state to JSON."""
        try:
            data = {
                "metadata": {"last_updated": datetime.now().isoformat()},
                "revenues": [
                    {
                        "id": r.id,
                        "stream": r.stream.value,
                        "usd": r.amount_usd,
                        "orig": r.amount_original,
                        "cur": r.currency,
                        "date": r.date.isoformat(),
                        "rec": r.recurring,
                        "client": r.client,
                        "desc": r.description,
                    }
                    for r in revenues
                ],
            }
            self.revenue_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save cashflow data: {e}")

    def load(self) -> List[Revenue]:
        """Loads revenue state from disk."""
        if not self.revenue_file.exists():
            return []

        revenues = []
        try:
            data = json.loads(self.revenue_file.read_text(encoding="utf-8"))
            for r in data.get("revenues", []):
                revenues.append(
                    Revenue(
                        id=r["id"],
                        stream=RevenueStream(r["stream"]),
                        amount_usd=r["usd"],
                        amount_original=r["orig"],
                        currency=r["cur"],
                        date=datetime.fromisoformat(r["date"]),
                        recurring=r["rec"],
                        client=r.get("client"),
                        description=r.get("desc", ""),
                    )
                )
        except Exception as e:
            logger.warning(f"Cashflow data loading failed: {e}")

        return revenues
