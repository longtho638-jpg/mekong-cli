"""
RaaS License Gate — ROIaaS Phase 2

Gates premium CLI features behind RAAS_LICENSE_KEY environment variable.
Phase 2: Remote validation, usage metering, key generation.
Reference: /Users/macbookprom1/mekong-cli/docs/HIEN_PHAP_ROIAAS.md
"""

import os
import hashlib
import requests
from typing import Optional, Tuple
from datetime import datetime

from src.lib.raas_gate_utils import get_upgrade_message, format_license_preview
from src.lib.license_generator import validate_license, get_tier_limits
from src.lib.usage_meter import record_usage, get_usage_summary


class RaasLicenseGate:
    """RaaS License validation and feature gating with Phase 2 features."""

    FREE_COMMANDS = {"init", "version", "list", "search", "status", "config", "doctor", "help", "dash"}
    PREMIUM_COMMANDS = {"cook", "gateway", "binh-phap", "swarm", "schedule", "telegram", "autonomous", "agi"}

    def __init__(self, enable_remote: bool = True) -> None:
        self._license_key: Optional[str] = os.getenv("RAAS_LICENSE_KEY")
        self._validated: bool = False
        self._license_tier: Optional[str] = None
        self._key_id: Optional[str] = None
        self._enable_remote = enable_remote
        self._remote_url = os.getenv("RAAS_API_URL", "http://localhost:8787")

    @property
    def license_key(self) -> Optional[str]:
        return self._license_key

    @property
    def has_license(self) -> bool:
        return self._license_key is not None and len(self._license_key) > 0

    def is_free_command(self, command: str) -> bool:
        return command.lower() in self.FREE_COMMANDS

    def is_premium_command(self, command: str) -> bool:
        return command.lower() in self.PREMIUM_COMMANDS

    def validate_license_format(self, license_key: Optional[str] = None) -> Tuple[bool, str]:
        key = license_key or self._license_key
        if not key:
            return False, "RAAS_LICENSE_KEY not set"
        if not key.startswith("raas-"):
            return False, "Invalid format: must start with 'raas-'"
        parts = key.split("-")
        if len(parts) < 4:  # Phase 2: raas-[tier]-[id]-[signature]
            return False, "Invalid format: expected raas-[tier]-[id]-[signature]"
        tier = parts[1].lower()
        if tier not in {"free", "pro", "enterprise", "trial"}:
            return False, f"Invalid tier: {tier}"
        return True, ""

    def validate_remote(self, license_key: str) -> Tuple[bool, Optional[dict], str]:
        """
        Validate license key with remote API.

        Args:
            license_key: License key to validate

        Returns:
            Tuple of (is_valid, license_info, error_message)
        """
        if not self._enable_remote:
            # Fallback to local validation
            is_valid, info, error = validate_license(license_key)
            if is_valid:
                self._license_tier = info.get("tier") if info else None
                self._key_id = info.get("key_id") if info else None
            return is_valid, info, error

        try:
            response = requests.post(
                f"{self._remote_url}/api/v1/license/validate",
                json={"license_key": license_key},
                timeout=5,
            )
            if response.status_code == 200:
                data = response.json()
                self._validated = True
                self._license_tier = data.get("tier")
                self._key_id = data.get("key_id")
                return True, data, ""
            elif response.status_code == 401:
                return False, None, "Invalid or revoked license key"
            elif response.status_code == 429:
                return False, None, "Rate limit exceeded. Try again later."
            else:
                return False, None, f"Remote validation failed: {response.status_code}"
        except requests.exceptions.RequestException as e:
            # Fallback to local validation on network error
            print(f"⚠️  Remote validation unavailable, using local validation: {e}")
            is_valid, info, error = validate_license(license_key)
            if is_valid:
                self._license_tier = info.get("tier") if info else None
                self._key_id = info.get("key_id") if info else None
            return is_valid, info, error

    def check(self, command: str) -> Tuple[bool, Optional[str]]:
        if self.is_free_command(command):
            return True, None

        if self.is_premium_command(command):
            if not self.has_license:
                return False, get_upgrade_message(command)

            # Validate format
            is_valid, error = self.validate_license_format()
            if not is_valid:
                return False, f"Invalid license: {error}"

            # Validate with remote API (or local fallback)
            is_valid, info, error = self.validate_remote(self._license_key)
            if not is_valid:
                return False, f"License validation failed: {error}"

            # Check usage limits
            if self._key_id and self._license_tier:
                allowed, usage_error = record_usage(self._key_id, self._license_tier)
                if not allowed:
                    return False, f"Usage limit exceeded: {usage_error}"

            self._validated = True
            return True, None

        return True, None

    def get_license_info(self) -> dict:
        if not self.has_license:
            return {"status": "no_license", "message": "No license key found", "upgrade_url": "https://raas.mekong.dev/pricing"}

        is_valid, error = self.validate_license_format()
        tier = (self._license_key or "").split("-")[1] if self._license_key else "unknown"

        info = {
            "status": "valid" if is_valid else "invalid",
            "tier": tier,
            "key_preview": format_license_preview(self._license_key),
            "error": error if not is_valid else None,
        }

        # Add usage summary if available
        if self._key_id:
            try:
                info["usage"] = get_usage_summary(self._key_id)
            except Exception:
                pass

        return info


_license_gate: Optional[RaasLicenseGate] = None


def get_license_gate(enable_remote: bool = True) -> RaasLicenseGate:
    global _license_gate
    if _license_gate is None:
        _license_gate = RaasLicenseGate(enable_remote=enable_remote)
    return _license_gate


def require_license(command: str) -> None:
    gate = get_license_gate()
    allowed, error = gate.check(command)
    if not allowed:
        from rich.console import Console
        console = Console()
        console.print(f"[bold red]License Error:[/bold red] {error}")
        raise SystemExit(1)


def check_license(command: str) -> bool:
    gate = get_license_gate()
    allowed, _ = gate.check(command)
    return allowed


__all__ = ["RaasLicenseGate", "get_license_gate", "require_license", "check_license"]
