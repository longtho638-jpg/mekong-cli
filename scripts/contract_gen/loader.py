import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("ContractGen")

# Search paths for leads, prioritizing new architecture
LEAD_SOURCES = [
    Path.home() / ".antigravity/crm/leads.json",
    Path.home() / ".mekong/leads.json",
    Path("data/leads.json"),  # Local project data
]


def load_lead(email: str) -> Optional[Dict[str, Any]]:
    """
    Load lead info from multiple potential sources.
    Prioritizes Antigravity CRM, then Legacy Mekong, then local data.
    """
    for source_path in LEAD_SOURCES:
        if source_path.exists():
            try:
                with open(source_path, "r", encoding="utf-8") as f:
                    leads = json.load(f)

                # Handle both list of leads and dict of leads keyed by email/id
                if isinstance(leads, list):
                    for lead in leads:
                        if isinstance(lead, dict) and lead.get("email") == email:
                            logger.info(f"Lead found in {source_path}")
                            return lead
                elif isinstance(leads, dict):
                    # Check if it's a direct key or values list
                    if email in leads:
                        return leads[email]
                    # Search values
                    for lead in leads.values():
                        if isinstance(lead, dict) and lead.get("email") == email:
                            return lead

            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON from {source_path}")
            except Exception as e:
                logger.warning(f"Error reading {source_path}: {e}")

    return None
