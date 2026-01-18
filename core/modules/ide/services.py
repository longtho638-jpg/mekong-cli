"""
IDE Module - Service Logic
"""

import json
import logging
from pathlib import Path
from typing import Dict

from .constants import CURSOR_RULES, EDITOR_CONFIG, REQUIRED_EXTENSIONS, VSCODE_SETTINGS

logger = logging.getLogger(__name__)


class IDEService:
    """
    Enforces the IDE configuration.
    """

    def __init__(self, root_path: str = "."):
        self.root = Path(root_path)
        self.vscode_dir = self.root / ".vscode"

    def sync_all(self) -> Dict[str, str]:
        """Syncs all configurations to disk."""
        self._ensure_vscode_dir()

        results = {}
        results["settings"] = self._sync_settings()
        results["extensions"] = self._sync_extensions()
        results["editorconfig"] = self._sync_editorconfig()
        results["cursorrules"] = self._sync_cursorrules()

        return results

    def _ensure_vscode_dir(self):
        self.vscode_dir.mkdir(exist_ok=True)

    def _sync_settings(self) -> str:
        target = self.vscode_dir / "settings.json"
        # Force overwrite - Absolute Truth
        with open(target, "w") as f:
            json.dump(VSCODE_SETTINGS, f, indent=4)
        return "✅ Updated .vscode/settings.json"

    def _sync_extensions(self) -> str:
        target = self.vscode_dir / "extensions.json"
        data = {"recommendations": REQUIRED_EXTENSIONS}
        with open(target, "w") as f:
            json.dump(data, f, indent=4)
        return "✅ Updated .vscode/extensions.json"

    def _sync_editorconfig(self) -> str:
        target = self.root / ".editorconfig"
        with open(target, "w") as f:
            f.write(EDITOR_CONFIG)
        return "✅ Updated .editorconfig"

    def _sync_cursorrules(self) -> str:
        target = self.root / ".cursorrules"
        with open(target, "w") as f:
            f.write(CURSOR_RULES)
        return "✅ Updated .cursorrules"

    def check_integrity(self) -> bool:
        """
        Checks if the current environment matches the Golden Standard.
        Returns False if potential drift is detected.
        """
        # 1. Check settings.json
        target = self.vscode_dir / "settings.json"
        if not target.exists():
            return False

        try:
            with open(target, "r") as f:
                current = json.load(f)
                # Check for marker
                if current.get("agencyos.mode") != "antigravity":
                    return False
        except:
            return False

        return True
