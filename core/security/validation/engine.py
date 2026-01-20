"""
🔐 Security Validation Runner
============================
Main orchestrator for Phase 2 security validation.
"""

import sys
from pathlib import Path
from typing import Any, Dict

from core.utils.vibe_ui import BOLD, GREEN, RED, RESET, YELLOW, print_header

from .api import APIProtectionValidator
from .command import CommandInjectionValidator
from .env import EnvSecurityValidator
from .sql import SQLInjectionValidator


class SecurityValidatorSuite:
    """Orchestrates all security validations."""

    def __init__(self):
        self.root_path = Path(__file__).parent.parent.parent.parent
        self.validators = [
            SQLInjectionValidator(self.root_path),
            CommandInjectionValidator(self.root_path),
            APIProtectionValidator(self.root_path),
            EnvSecurityValidator(self.root_path)
        ]

    def run_all(self) -> Dict[str, Any]:
        """Run all validation categories."""
        print(f"{BOLD}🔒 Executing security validation suite...{RESET}")

        results = []
        for validator in self.validators:
            validator.validate()
            results.extend(validator.results)

        # System test
        system_test_passed = self.run_system_test()

        passed_count = sum(1 for r in results if r["passed"]) + (1 if system_test_passed else 0)
        total_count = len(results) + 1
        score = (passed_count / total_count) * 100

        self.print_report(score, passed_count, total_count)

        return {
            "score": score,
            "passed": passed_count,
            "total": total_count
        }

    def run_system_test(self) -> bool:
        """Test the implemented security system."""
        print_header("Testing Security System Implementation")
        try:
            sys.path.insert(0, str(self.root_path))
            from core.security.env import validate_environment
            manager = validate_environment()
            is_valid, warnings, errors = manager.validate_all()

            if is_valid:
                print(f"   {GREEN}✅ Environment validation passed{RESET}")
            else:
                print(f"   {RED}❌ Environment validation failed: {len(errors)} errors{RESET}")

            return is_valid
        except Exception as e:
            print(f"   {RED}❌ Security system test failed: {e}{RESET}")
            return False

    def print_report(self, score: float, passed: int, total: int):
        """Print the final security report."""
        print(f"\n{BOLD}📊 SECURITY IMPLEMENTATION SCORE: {score:.0f}%{RESET}")
        print(f"✅ Categories Passed: {passed}/{total}")

        if score >= 90: status = f"{GREEN}🛡️  HIGHLY SECURE{RESET}"
        elif score >= 75: status = f"{YELLOW}🔒 MODERATELY SECURE{RESET}"
        else: status = f"{RED}⚠️  NEEDS IMPROVEMENT{RESET}"
        print(f"Status: {status}\n")

def main():
    suite = SecurityValidatorSuite()
    report = suite.run_all()
    sys.exit(0 if report["score"] >= 75 else 1)

if __name__ == "__main__":
    main()
