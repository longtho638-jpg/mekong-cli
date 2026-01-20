"""
License validation engine logic.
"""
import hashlib
import json
import os
import platform
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from core.config import get_settings

from .models import LicenseTier


class LicenseValidationEngine:
    def __init__(self):
        settings = get_settings()
        self.license_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.license_file = self.license_dir / "license.json"
        self._ensure_license_dir()

    def _ensure_license_dir(self) -> None:
        try:
            self.license_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            raise RuntimeError(f"Could not create license directory: {e}")

    def _get_machine_id(self) -> str:
        try:
            machine_data = f"{platform.node()}-{platform.system()}-{platform.machine()}"
            return hashlib.sha256(machine_data.encode()).hexdigest()[:16]
        except Exception:
            return str(uuid.uuid4())[:16]

    def activate(self, license_key: str) -> Dict[str, Any]:
        if not license_key or not isinstance(license_key, str):
            raise ValueError("License key is required")

        license_key = license_key.strip()
        if len(license_key) < 10 or len(license_key) > 200:
            raise ValueError("Invalid license key length")

        license_key = "".join(c for c in license_key if c.isalnum() or c in "-_")
        tier = LicenseTier.STARTER

        if license_key.startswith("AGENCYOS-"):
            parts = license_key.split("-")
            if len(parts) < 4: raise ValueError("Invalid AgencyOS key format")
            tier = LicenseTier.PRO
        elif license_key.startswith("mk_live_"):
            parts = license_key.split("_")
            if len(parts) < 4: raise ValueError("Invalid internal key format")
            tier = parts[2]
            if tier not in LicenseTier.all_tiers():
                raise ValueError(f"Invalid tier: '{tier}'")
        else:
            raise ValueError("Invalid license key format")

        license_data = {
            "key": license_key,
            "tier": tier,
            "activated_at": datetime.now().isoformat(),
            "status": "active",
            "machine_id": self._get_machine_id(),
        }

        try:
            old_umask = os.umask(0o077)
            with open(self.license_file, "w", encoding="utf-8") as f:
                json.dump(license_data, f, indent=2)
            os.umask(old_umask)
        except OSError as e:
            raise RuntimeError(f"Failed to save license file: {e}")

        return license_data

    def get_license(self) -> Optional[Dict[str, Any]]:
        if not self.license_file.exists():
            return None
        try:
            with open(self.license_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None

    def deactivate(self) -> bool:
        if not self.license_file.exists():
            return True
        try:
            self.license_file.unlink()
            return True
        except OSError:
            return False
