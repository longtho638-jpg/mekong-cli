"""
JSON Backend for Agent Memory
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

def save_to_json(file_path: Path, data: Dict[str, Any]) -> bool:
    """Saves data to a JSON file."""
    try:
        file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return True
    except Exception as e:
        logger.error(f"Failed to save to {file_path}: {e}")
        return False

def load_from_json(file_path: Path) -> Dict[str, Any]:
    """Loads data from a JSON file."""
    if not file_path.exists():
        return {}
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning(f"Failed to load from {file_path}: {e}")
        return {}
