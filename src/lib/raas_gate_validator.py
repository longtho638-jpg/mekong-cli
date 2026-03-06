"""
RAAS License Gate Validator - Python Wrapper

Invokes TypeScript license validation via Node.js subprocess.
Uses src/lib/raas-gate.ts as source of truth for license validation.

Reference: docs/HIEN_PHAP_ROIAAS.md - ROIaaS Phase 1
"""

import json
import os
import subprocess
from typing import Optional, Tuple, Dict, Any

from src.lib.raas_gate_utils import get_upgrade_message


class LicenseValidationError(Exception):
    """Raised when license validation fails."""

    def __init__(self, message: str, tier: str = "free", error_code: str = "unknown"):
        super().__init__(message)
        self.tier = tier
        self.error_code = error_code


class RaasGateValidator:
    """
    Python wrapper for TypeScript license validation.

    Spawns Node.js subprocess to invoke src/lib/raas-gate.ts
    and parses JSON response for validation result.
    """

    def __init__(self):
        self._script_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "scripts",
            "validate-license.ts",
        )
        self._last_result: Optional[Dict[str, Any]] = None

    def _run_validator(self, license_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Run TypeScript validator via Node.js subprocess.

        Args:
            license_key: Optional license key (defaults to RAAS_LICENSE_KEY env)

        Returns:
            Dict with validation result

        Raises:
            LicenseValidationError: If validation fails
        """
        # Prepare environment
        env = os.environ.copy()

        # Set license key if provided
        if license_key:
            env["RAAS_LICENSE_KEY"] = license_key

        # Build command - try tsx first, then fallback to node + ts-node
        cmd = ["npx", "tsx", self._script_path]

        # Add license key as argument if provided
        if license_key:
            cmd.append(license_key)

        try:
            # Run subprocess
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=10,  # 10 second timeout
            )

            # Parse stdout for JSON
            if result.stdout:
                try:
                    self._last_result = json.loads(result.stdout)
                    return self._last_result
                except json.JSONDecodeError:
                    pass

            # Check stderr for error JSON
            if result.stderr:
                try:
                    self._last_result = json.loads(result.stderr)
                    return self._last_result
                except json.JSONDecodeError:
                    pass

            # No JSON output - return error
            return {
                "valid": False,
                "tier": "free",
                "features": [],
                "error": f"Validator failed: {result.stderr or result.stdout or 'No output'}",
            }

        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "tier": "free",
                "features": [],
                "error": "License validation timeout",
            }
        except FileNotFoundError:
            # npx/tsx not found - fallback to local validation
            return self._fallback_validate(license_key)
        except subprocess.CalledProcessError:
            # Subprocess failed - fallback to local validation
            return self._fallback_validate(license_key)
        except Exception:
            # Any other error - fallback to local validation
            return self._fallback_validate(license_key)

    def _fallback_validate(self, license_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Fallback local validation when Node.js subprocess unavailable.

        Validates license key format locally without TypeScript.
        """
        key = license_key or os.getenv("RAAS_LICENSE_KEY")

        if not key:
            return {
                "valid": False,
                "tier": "free",
                "features": ["basic_cli_commands", "open_source_agents", "community_patterns"],
                "error": None,
                "no_license": True,
            }

        # Simple format validation
        tier = "free"
        if "ent" in key.lower() or key.startswith("REP-"):
            tier = "enterprise"
        elif "pro" in key.lower() or key.startswith("RPP-") or key.startswith("raas_"):
            tier = "pro"

        features = self._get_features_for_tier(tier)

        return {
            "valid": tier != "free",
            "tier": tier,
            "features": features,
            "error": None,
        }

    def _get_features_for_tier(self, tier: str) -> list:
        """Get features list for tier."""
        features = {
            "free": ["basic_cli_commands", "open_source_agents", "community_patterns"],
            "pro": [
                "basic_cli_commands",
                "open_source_agents",
                "community_patterns",
                "premium_agents",
                "advanced_patterns",
                "priority_support",
                "custom_workflows",
                "ml_models",
                "premium_data",
            ],
            "enterprise": [
                "basic_cli_commands",
                "open_source_agents",
                "community_patterns",
                "premium_agents",
                "advanced_patterns",
                "priority_support",
                "custom_workflows",
                "ml_models",
                "premium_data",
                "agi_auto_pilot",
                "team_collaboration",
                "audit_logs",
                "sso_integration",
                "dedicated_support",
                "custom_integrations",
            ],
        }
        return features.get(tier, features["free"])

    def validate(self, license_key: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate license and return (is_valid, error_message).

        Args:
            license_key: Optional license key (defaults to env var)

        Returns:
            Tuple of (is_valid, error_message or None)
        """
        result = self._run_validator(license_key)

        if result.get("no_license"):
            # No license found - allow free tier
            return True, None

        if result.get("valid"):
            return True, None

        error = result.get("error", "License validation failed")
        tier = result.get("tier", "free")

        return False, self._format_error_message(error, tier)

    def _format_error_message(self, error: str, tier: str) -> str:
        """Format user-friendly error message."""
        if tier == "free":
            return get_upgrade_message("premium_command")

        if "expired" in error.lower():
            return f"License expired. Please renew: {error}"

        if "invalid" in error.lower() or "format" in error.lower():
            return f"Invalid license key format. {error}"

        return f"License validation failed: {error}"

    def get_tier(self) -> str:
        """Get current license tier from last validation."""
        if self._last_result:
            return self._last_result.get("tier", "free")
        return "free"

    def get_features(self) -> list:
        """Get enabled features from last validation."""
        if self._last_result:
            return self._last_result.get("features", [])
        return self._get_features_for_tier("free")


# Singleton instance
_validator: Optional[RaasGateValidator] = None


def get_validator() -> RaasGateValidator:
    """Get singleton validator instance."""
    global _validator
    if _validator is None:
        _validator = RaasGateValidator()
    return _validator


def validate_at_startup() -> Tuple[bool, Optional[str]]:
    """
    Validate license at CLI startup.

    Returns:
        Tuple of (allow_startup, error_message)
        - (True, None): Startup allowed
        - (False, error_msg): Startup blocked
    """
    validator = get_validator()
    return validator.validate()


def require_valid_license() -> None:
    """
    Require valid license or exit with error.

    Exits with code 1 if license is missing/invalid/expired.
    """
    from rich.console import Console

    console = Console()

    is_valid, error = validate_at_startup()

    if not is_valid:
        console.print(f"[bold red]License Error:[/bold red] {error}")
        console.print(
            "\n[yellow]Generate a license key:[/yellow]"
        )
        console.print("  [cyan]mekong license generate --tier pro[/cyan]")
        console.print(
            "\n[yellow]Or set environment variable:[/yellow]"
        )
        console.print("  [cyan]export RAAS_LICENSE_KEY=your_key[/cyan]")
        raise SystemExit(1)


__all__ = [
    "RaasGateValidator",
    "get_validator",
    "validate_at_startup",
    "require_valid_license",
    "LicenseValidationError",
]
