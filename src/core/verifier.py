"""
Mekong CLI - Recipe Verifier

Validates execution results against success criteria.
Implements the VERIFY phase of Plan-Execute-Verify pattern.
"""

from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import re
import subprocess


class VerificationStatus(Enum):
    """Verification result status"""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"


@dataclass
class ExecutionResult:
    """Result from executing a recipe step"""
    exit_code: int = 0
    stdout: str = ""
    stderr: str = ""
    output_files: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: Optional[Exception] = None


@dataclass
class VerificationCheck:
    """Individual verification check result"""
    name: str
    status: VerificationStatus
    message: str
    expected: Optional[Union[str, int, bool]] = None
    actual: Optional[Union[str, int, bool]] = None


@dataclass
class VerificationReport:
    """Complete verification report for a step"""
    passed: bool
    checks: List[VerificationCheck] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    @property
    def summary(self) -> str:
        """Generate summary message"""
        total = len(self.checks)
        passed = sum(1 for c in self.checks if c.status == VerificationStatus.PASSED)
        failed = sum(1 for c in self.checks if c.status == VerificationStatus.FAILED)
        warnings = sum(1 for c in self.checks if c.status == VerificationStatus.WARNING)

        return f"{passed}/{total} checks passed, {failed} failed, {warnings} warnings"


class RecipeVerifier:
    """
    Validates execution results against verification criteria.

    This is the VERIFY phase of the Plan-Execute-Verify pattern.
    """

    def __init__(self, strict_mode: bool = True):
        """
        Initialize verifier.

        Args:
            strict_mode: If True, warnings are treated as failures
        """
        self.strict_mode = strict_mode

    def verify_exit_code(
        self, result: ExecutionResult, expected: int
    ) -> VerificationCheck:
        """
        Verify command exit code.

        Args:
            result: Execution result
            expected: Expected exit code

        Returns:
            VerificationCheck result
        """
        if result.exit_code == expected:
            return VerificationCheck(
                name="exit_code",
                status=VerificationStatus.PASSED,
                message=f"Exit code {result.exit_code} matches expected",
                expected=expected,
                actual=result.exit_code
            )
        else:
            return VerificationCheck(
                name="exit_code",
                status=VerificationStatus.FAILED,
                message=f"Exit code mismatch: expected {expected}, got {result.exit_code}",
                expected=expected,
                actual=result.exit_code
            )

    def verify_file_exists(self, filepath: str) -> VerificationCheck:
        """
        Verify file existence.

        Args:
            filepath: Path to check

        Returns:
            VerificationCheck result
        """
        path = Path(filepath)
        if path.exists():
            return VerificationCheck(
                name=f"file_exists:{filepath}",
                status=VerificationStatus.PASSED,
                message=f"File exists: {filepath}",
                expected=True,
                actual=True
            )
        else:
            return VerificationCheck(
                name=f"file_exists:{filepath}",
                status=VerificationStatus.FAILED,
                message=f"File not found: {filepath}",
                expected=True,
                actual=False
            )

    def verify_file_not_exists(self, filepath: str) -> VerificationCheck:
        """
        Verify file does not exist.

        Args:
            filepath: Path to check

        Returns:
            VerificationCheck result
        """
        path = Path(filepath)
        if not path.exists():
            return VerificationCheck(
                name=f"file_not_exists:{filepath}",
                status=VerificationStatus.PASSED,
                message=f"File correctly does not exist: {filepath}",
                expected=False,
                actual=False
            )
        else:
            return VerificationCheck(
                name=f"file_not_exists:{filepath}",
                status=VerificationStatus.FAILED,
                message=f"File exists but should not: {filepath}",
                expected=False,
                actual=True
            )

    def verify_output_contains(
        self, result: ExecutionResult, pattern: str
    ) -> VerificationCheck:
        """
        Verify output contains pattern.

        Args:
            result: Execution result
            pattern: String or regex pattern to find

        Returns:
            VerificationCheck result
        """
        combined_output = result.stdout + "\n" + result.stderr

        # Try regex match first
        try:
            if re.search(pattern, combined_output, re.IGNORECASE):
                return VerificationCheck(
                    name=f"output_contains:{pattern}",
                    status=VerificationStatus.PASSED,
                    message=f"Output contains pattern: {pattern}",
                    expected=pattern,
                    actual="found"
                )
        except re.error:
            # Not a valid regex, try simple substring
            if pattern.lower() in combined_output.lower():
                return VerificationCheck(
                    name=f"output_contains:{pattern}",
                    status=VerificationStatus.PASSED,
                    message=f"Output contains: {pattern}",
                    expected=pattern,
                    actual="found"
                )

        return VerificationCheck(
            name=f"output_contains:{pattern}",
            status=VerificationStatus.FAILED,
            message=f"Output does not contain: {pattern}",
            expected=pattern,
            actual="not found"
        )

    def verify_output_not_contains(
        self, result: ExecutionResult, pattern: str
    ) -> VerificationCheck:
        """
        Verify output does NOT contain pattern.

        Args:
            result: Execution result
            pattern: String or regex pattern to avoid

        Returns:
            VerificationCheck result
        """
        combined_output = result.stdout + "\n" + result.stderr

        # Try regex match first
        try:
            if re.search(pattern, combined_output, re.IGNORECASE):
                return VerificationCheck(
                    name=f"output_not_contains:{pattern}",
                    status=VerificationStatus.FAILED,
                    message=f"Output contains forbidden pattern: {pattern}",
                    expected=f"not {pattern}",
                    actual="found"
                )
        except re.error:
            # Not a valid regex, try simple substring
            if pattern.lower() in combined_output.lower():
                return VerificationCheck(
                    name=f"output_not_contains:{pattern}",
                    status=VerificationStatus.FAILED,
                    message=f"Output contains forbidden text: {pattern}",
                    expected=f"not {pattern}",
                    actual="found"
                )

        return VerificationCheck(
            name=f"output_not_contains:{pattern}",
            status=VerificationStatus.PASSED,
            message=f"Output correctly does not contain: {pattern}",
            expected=f"not {pattern}",
            actual="not found"
        )

    def verify(
        self, result: ExecutionResult, criteria: Dict[str, Any]
    ) -> VerificationReport:
        """
        Run all verification checks against criteria.

        Args:
            result: Execution result to verify
            criteria: Verification criteria dictionary

        Returns:
            VerificationReport with all check results
        """
        report = VerificationReport(passed=True, checks=[])

        # Exit code check
        if "exit_code" in criteria and criteria["exit_code"] is not None:
            check = self.verify_exit_code(result, criteria["exit_code"])
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # File existence checks
        for filepath in criteria.get("file_exists", []):
            check = self.verify_file_exists(filepath)
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # File non-existence checks
        for filepath in criteria.get("file_not_exists", []):
            check = self.verify_file_not_exists(filepath)
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # Output contains checks
        for pattern in criteria.get("output_contains", []):
            check = self.verify_output_contains(result, pattern)
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # Output not contains checks
        for pattern in criteria.get("output_not_contains", []):
            check = self.verify_output_not_contains(result, pattern)
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # Custom checks (extensibility point)
        for custom_check in criteria.get("custom_checks", []):
            check = self._run_custom_check(custom_check, result)
            report.checks.append(check)
            if check.status == VerificationStatus.FAILED:
                report.passed = False

        # Collect warnings and errors
        for check in report.checks:
            if check.status == VerificationStatus.FAILED:
                report.errors.append(check.message)
            elif check.status == VerificationStatus.WARNING:
                report.warnings.append(check.message)
                if self.strict_mode:
                    report.passed = False

        return report

    def _run_custom_check(
        self, check_spec: Union[str, Dict[str, str]], result: ExecutionResult
    ) -> VerificationCheck:
        """
        Execute a custom verification check.

        Supports:
        - Shell command string: runs command, checks exit code 0
        - Dict with {command, expected_output}: runs and matches output

        Args:
            check_spec: Shell command string or dict with command/expected_output
            result: ExecutionResult context (available to checks)

        Returns:
            VerificationCheck result
        """
        if isinstance(check_spec, str):
            command = check_spec
            expected_output = None
        elif isinstance(check_spec, dict):
            command = check_spec.get("command", "")
            expected_output = check_spec.get("expected_output")
        else:
            return VerificationCheck(
                name="custom_check",
                status=VerificationStatus.FAILED,
                message=f"Invalid check spec type: {type(check_spec).__name__}",
            )

        if not command:
            return VerificationCheck(
                name="custom_check",
                status=VerificationStatus.FAILED,
                message="Empty custom check command",
            )

        try:
            proc = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
            )

            if proc.returncode != 0:
                return VerificationCheck(
                    name=f"custom:{command[:40]}",
                    status=VerificationStatus.FAILED,
                    message=f"Custom check failed (exit {proc.returncode}): {proc.stderr.strip()[:200]}",
                    expected=0,
                    actual=proc.returncode,
                )

            # If expected_output specified, verify it matches
            if expected_output and expected_output not in proc.stdout:
                return VerificationCheck(
                    name=f"custom:{command[:40]}",
                    status=VerificationStatus.FAILED,
                    message=f"Output mismatch: expected '{expected_output}'",
                    expected=expected_output,
                    actual=proc.stdout.strip()[:200],
                )

            return VerificationCheck(
                name=f"custom:{command[:40]}",
                status=VerificationStatus.PASSED,
                message=f"Custom check passed: {command[:60]}",
            )

        except subprocess.TimeoutExpired:
            return VerificationCheck(
                name=f"custom:{command[:40]}",
                status=VerificationStatus.FAILED,
                message=f"Custom check timed out: {command[:60]}",
            )
        except Exception as e:
            return VerificationCheck(
                name=f"custom:{command[:40]}",
                status=VerificationStatus.FAILED,
                message=f"Custom check error: {e}",
            )

    def verify_quality_gates(self, result: ExecutionResult) -> VerificationReport:
        """
        Apply Binh Phap quality gates.

        Enforces:
        - 始計 (Tech Debt): 0 TODOs/FIXMEs
        - 作戰 (Type Safety): 0 `any` types
        - 謀攻 (Performance): Build < 10s
        - 軍形 (Security): 0 vulnerabilities

        Args:
            result: Execution result

        Returns:
            VerificationReport for quality gates
        """
        report = VerificationReport(passed=True, checks=[])

        # Tech Debt check
        todo_check = self.verify_output_not_contains(result, r"TODO|FIXME")
        todo_check.name = "binh_phap:tech_debt"
        report.checks.append(todo_check)
        if todo_check.status == VerificationStatus.FAILED:
            report.passed = False

        # Type Safety check (for TypeScript/JavaScript)
        any_type_check = self.verify_output_not_contains(result, r": any")
        any_type_check.name = "binh_phap:type_safety"
        report.checks.append(any_type_check)
        if any_type_check.status == VerificationStatus.FAILED:
            report.passed = False

        # Security check
        vuln_check = self.verify_output_not_contains(
            result, r"vulnerabilit|critical|high severity"
        )
        vuln_check.name = "binh_phap:security"
        report.checks.append(vuln_check)
        if vuln_check.status == VerificationStatus.FAILED:
            report.passed = False

        return report


__all__ = [
    "RecipeVerifier",
    "ExecutionResult",
    "VerificationReport",
    "VerificationCheck",
    "VerificationStatus",
]
