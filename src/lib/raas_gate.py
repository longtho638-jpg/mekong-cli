"""
RaaS License Gate — ROIaaS Phase 1

Gates premium CLI features behind RAAS_LICENSE_KEY environment variable.
Reference: /Users/macbookprom1/mekong-cli/docs/HIEN_PHAP_ROIAAS.md
"""

import os
import hashlib
from typing import Optional, Tuple

from src.lib.raas_gate_utils import get_upgrade_message, format_license_preview


class RaasLicenseGate:
    """RaaS License validation and feature gating."""

    FREE_COMMANDS = {"init", "version", "list", "search", "status", "config", "doctor", "help", "dash"}
    PREMIUM_COMMANDS = {"cook", "gateway", "binh-phap", "swarm", "schedule", "telegram", "autonomous", "agi"}

    def __init__(self) -> None:
        self._license_key: Optional[str] = os.getenv("RAAS_LICENSE_KEY")
        self._validated: bool = False
        self._license_tier: Optional[str] = None

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
        if len(parts) < 3:
            return False, "Invalid format: expected raas-[tier]-[hash]"
        tier = parts[1].lower()
        if tier not in {"free", "pro", "enterprise", "trial"}:
            return False, f"Invalid tier: {tier}"
        if len(parts[2]) < 8:
            return False, "Hash too short: minimum 8 characters"
        return True, ""

    def check(self, command: str) -> Tuple[bool, Optional[str]]:
        if self.is_free_command(command):
            return True, None
        if self.is_premium_command(command):
            if not self.has_license:
                return False, get_upgrade_message(command)
            is_valid, error = self.validate_license_format()
            if not is_valid:
                return False, f"Invalid license: {error}"
            self._validated = True
            self._license_tier = (self._license_key or "").split("-")[1]
            return True, None
        return True, None

    def get_license_info(self) -> dict:
        if not self.has_license:
            return {"status": "no_license", "message": "No license key found", "upgrade_url": "https://raas.mekong.dev/pricing"}
        is_valid, error = self.validate_license_format()
        tier = (self._license_key or "").split("-")[1] if self._license_key else "unknown"
        return {"status": "valid" if is_valid else "invalid", "tier": tier, "key_preview": format_license_preview(self._license_key), "error": error if not is_valid else None}

    @staticmethod
    def generate_trial_key(email: str) -> str:
        hash_input = f"trial-{email}-{os.urandom(8).hex()}"
        key_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:12]
        return f"raas-trial-{key_hash}"


_license_gate: Optional[RaasLicenseGate] = None


def get_license_gate() -> RaasLicenseGate:
    global _license_gate
    if _license_gate is None:
        _license_gate = RaasLicenseGate()
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
