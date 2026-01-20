"""
💉 SQL Injection Validation
==========================
Validates SQL injection prevention implementation.
"""

from pathlib import Path

from core.utils.vibe_ui import RED, RESET, check_status, print_header

from .base import BaseSecurityValidator


class SQLInjectionValidator(BaseSecurityValidator):
    """Validator for SQL injection fixes."""

    def validate(self) -> bool:
        """Validate SQL injection prevention fixes."""
        print_header("Priority 5: SQL Injection Prevention")
        all_passed = True

        # Check potential memory file locations
        memory_locations = [
            self.root_path / "core" / "memory.py",
            self.root_path / "core" / "memory" / "memory.py"
        ]

        memory_file = None
        for loc in memory_locations:
            if loc.exists():
                memory_file = loc
                break

        if memory_file:
            with open(memory_file, "r") as f:
                content = f.read()

            checks = [
                ("isinstance(id_, int)", "Input validation for SQL IDs implemented", "Missing input validation for SQL IDs"),
                ("placeholders = ','.join('?' * len(ids))", "Parameterized query placeholders implemented", "Missing parameterized query placeholders"),
                ("Validate input IDs", "Security comments added to SQL operations", "Missing security documentation for SQL operations")
            ]

            for pattern, success, error in checks:
                status, msg = check_status(pattern in content, success, error)
                print(f"   {msg}")
                all_passed &= status
        else:
            print(f"   {RED}❌ core/memory.py not found{RESET}")
            all_passed = False

        self.log_result("Parameterized Queries", all_passed, "SQL injection prevention in core/memory.py")
        return all_passed
