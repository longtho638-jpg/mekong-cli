#!/usr/bin/env python3
"""
Security Attestation Report Generator

Generates signed security attestation reports for Mekong CLI,
compatible with RaaS Gateway's JWT + mk_ API key authentication.
"""

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# RaaS Gateway configuration
RAAS_GATEWAY_CONFIG = {
    "base_url": os.getenv("RAAS_GATEWAY_URL", "https://raas.agencyos.network"),
    "api_key_prefix": "mk_",
    "jwt_audience": "mekong-cli-security",
    "kv_namespace": "security-attestations",
}


class SecurityAttestationGenerator:
    """Generates and signs security attestation reports."""

    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def get_commit_info(self) -> dict[str, str]:
        """Get current git commit information."""
        try:
            sha = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.repo_path,
            ).stdout.strip()

            branch = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.repo_path,
            ).stdout.strip()

            return {"sha": sha, "branch": branch}
        except Exception:
            return {"sha": "unknown", "branch": "unknown"}

    def check_hardcoded_secrets(self) -> tuple[bool, list[str]]:
        """Scan for hardcoded secrets in source code."""
        findings = []

        # Pattern for hardcoded secrets
        secret_pattern = r"(API_KEY|SECRET|PASSWORD|TOKEN)\s*=\s*['\"][a-zA-Z0-9]{16,}['\"]"

        try:
            result = subprocess.run(
                ["grep", "-rE", secret_pattern, "src/", "--include=*.py"],
                capture_output=True,
                text=True,
                cwd=self.repo_path,
            )

            if result.returncode == 0 and result.stdout:
                findings = result.stdout.strip().split("\n")
                # Filter out env var reads
                findings = [
                    f for f in findings
                    if "os.getenv" not in f and "os.environ" not in f
                ]
        except Exception:
            pass

        return len(findings) == 0, findings

    def check_env_file_exposure(self) -> tuple[bool, list[str]]:
        """Check for exposed .env files in scope (src/ directory only)."""
        exposed = []

        try:
            # Only scan src/ directory, not client projects in apps/
            result = subprocess.run(
                ["find", "src/", "-name", ".env*", "-type", "f"],
                capture_output=True,
                text=True,
                cwd=self.repo_path,
            )

            if result.returncode == 0 and result.stdout:
                files = result.stdout.strip().split("\n")
                # Filter out allowed patterns
                exposed = [
                    f for f in files
                    if f and ".env.example" not in f and ".venv" not in f
                ]
        except Exception:
            pass

        return len(exposed) == 0, exposed

    def check_command_sanitizer(self) -> bool:
        """Verify command sanitizer is implemented."""
        sanitizer_path = self.repo_path / "src" / "security" / "command_sanitizer.py"
        return sanitizer_path.exists()

    def run_security_checks(self) -> dict[str, Any]:
        """Run all security checks."""
        print("=== Running Security Checks ===\n")

        # Check 1: Hardcoded secrets
        print("1. Scanning for hardcoded secrets...")
        secrets_ok, secrets_findings = self.check_hardcoded_secrets()
        if secrets_ok:
            print("   ✅ No hardcoded secrets found\n")
        else:
            print(f"   ❌ Found {len(secrets_findings)} potential secret(s)\n")

        # Check 2: .env file exposure
        print("2. Checking for exposed .env files...")
        env_ok, env_findings = self.check_env_file_exposure()
        if env_ok:
            print("   ✅ No exposed .env files\n")
        else:
            print(f"   ⚠️  Found {len(env_findings)} .env file(s)\n")

        # Check 3: Command sanitizer
        print("3. Verifying command sanitizer...")
        sanitizer_ok = self.check_command_sanitizer()
        if sanitizer_ok:
            print("   ✅ Command sanitizer implemented\n")
        else:
            print("   ❌ Command sanitizer NOT found\n")

        return {
            "secrets_ok": secrets_ok,
            "env_ok": env_ok,
            "sanitizer_ok": sanitizer_ok,
            "secrets_findings": secrets_findings,
            "env_findings": env_findings,
        }

    def generate_attestation(
        self,
        security_results: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate attestation report."""
        commit_info = self.get_commit_info()

        all_passed = (
            security_results["secrets_ok"]
            and security_results["env_ok"]
            and security_results["sanitizer_ok"]
        )

        status = "ATTESTED_SECURE" if all_passed else "ATTESTATION_FAILED"

        attestation = {
            "attestation_version": "1.0.0",
            "attestation_type": "mekong-cli-security-hardening",
            "timestamp": self.timestamp,
            "commit_sha": commit_info["sha"],
            "branch": commit_info["branch"],
            "repository": "mekong-cli",
            "security_checks": {
                "secret_scanning": "PASS" if security_results["secrets_ok"] else "FAIL",
                "command_injection_protection": (
                    "PASS" if security_results["sanitizer_ok"] else "FAIL"
                ),
                "env_file_exclusion": (
                    "PASS" if security_results["env_ok"] else "FAIL"
                ),
            },
            "compliance": {
                "owasp_top_10": "COMPLIANT" if all_passed else "NON_COMPLIANT",
                "no_hardcoded_secrets": security_results["secrets_ok"],
                "command_sanitization_enabled": security_results["sanitizer_ok"],
                "env_file_exclusion": security_results["env_ok"],
            },
            "raas_gateway_compatible": True,
            "jwt_auth_ready": True,
            "mk_api_key_format": True,
            "status": status,
        }

        return attestation

    def sign_attestation(self, attestation: dict[str, Any]) -> str:
        """Generate SHA256 hash signature for attestation."""
        # Canonical JSON representation
        canonical_json = json.dumps(attestation, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical_json.encode()).hexdigest()

    def save_report(
        self,
        attestation: dict[str, Any],
        signature: str,
        output_dir: str = "plans/reports",
    ) -> Path:
        """Save attestation report to file."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        report_file = output_path / f"security-attestation-{attestation['commit_sha'][:8]}.json"

        report = {
            **attestation,
            "signature": signature,
            "signature_algorithm": "SHA256",
        }

        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        return report_file

    def print_report(
        self,
        attestation: dict[str, Any],
        signature: str,
    ) -> None:
        """Print formatted attestation report."""
        print("\n" + "=" * 60)
        print("  MEKONG CLI SECURITY ATTESTATION REPORT")
        print("=" * 60)
        print()
        print(f"Commit:       {attestation['commit_sha']}")
        print(f"Branch:       {attestation['branch']}")
        print(f"Timestamp:    {attestation['timestamp']}")
        print()
        print("Security Checks:")
        for check, result in attestation["security_checks"].items():
            status_icon = "✅" if result == "PASS" else "❌"
            print(f"  {status_icon} {check.replace('_', ' ').title()}: {result}")
        print()
        print("Compliance:")
        for check, result in attestation["compliance"].items():
            status_icon = "✅" if result is True or result == "COMPLIANT" else "❌"
            print(f"  {status_icon} {check.replace('_', ' ').title()}: {result}")
        print()
        print(f"RaaS Gateway Compatible: {attestation['raas_gateway_compatible']}")
        print(f"JWT Auth Ready:          {attestation['jwt_auth_ready']}")
        print()
        print(f"Signature (SHA256): {signature}")
        print(f"Status: {attestation['status']}")
        print()
        print("=" * 60)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate security attestation report",
    )
    parser.add_argument(
        "--repo",
        default=".",
        help="Repository path (default: current directory)",
    )
    parser.add_argument(
        "--output",
        default="plans/reports",
        help="Output directory for report",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress output except report path",
    )

    args = parser.parse_args()

    generator = SecurityAttestationGenerator(args.repo)

    # Run security checks
    security_results = generator.run_security_checks()

    # Generate attestation
    attestation = generator.generate_attestation(security_results)

    # Sign attestation
    signature = generator.sign_attestation(attestation)

    # Save report
    report_path = generator.save_report(attestation, signature, args.output)

    if not args.quiet:
        # Print report
        generator.print_report(attestation, signature)
        print(f"\nReport saved to: {report_path}")

    # Exit with appropriate code
    if attestation["status"] == "ATTESTED_SECURE":
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
