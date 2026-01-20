"""
🐚 Command Injection Validation
==============================
Validates command injection prevention implementation.
"""

import re
from pathlib import Path

from core.utils.vibe_ui import GREEN, RED, RESET, YELLOW, print_header

from .base import BaseSecurityValidator


class CommandInjectionValidator(BaseSecurityValidator):
    """Validator for command injection fixes."""

    def validate(self) -> bool:
        """Validate command injection prevention fixes."""
        print_header("Priority 6: Command Injection Prevention")

        files_to_check = [
            "scripts/health.py",
            "scripts/morning.py",
            "scripts/overlord.py",
            "scripts/auto_daily.py",
            "scripts/legacy/morning.py",
            "scripts/legacy/auto_daily.py",
            "antigravity/core/jules_runner.py",
        ]

        files_fixed = 0
        all_passed = True

        for file_path in files_to_check:
            full_path = self.root_path / file_path
            if not full_path.exists():
                print(f"   {YELLOW}⚠️  {file_path}: File not found{RESET}")
                continue

            with open(full_path, "r") as f:
                content = f.read()

            if self._check_file_secure(file_path, content):
                print(f"   {GREEN}✅ {file_path}: Command injection fixed{RESET}")
                files_fixed += 1
            else:
                print(f"   {RED}❌ {file_path}: Unsafe shell patterns found{RESET}")
                all_passed = False

        print(f"\n   Files secured: {files_fixed}/{len(files_to_check)}")
        self.log_result("Shell Command Security", files_fixed == len(files_to_check), f"{files_fixed} files fixed")
        return all_passed

    def _check_file_secure(self, file_path: str, content: str) -> bool:
        lines = content.split("\n")
        unsafe_usage = 0
        has_safe_functions = "run_safe_pytest" in content or "run_silent_command" in content
        arg_list_matches = re.findall(r"subprocess\.run\(\s*\[", content)

        if file_path == "antigravity/core/jules_runner.py":
            return len(arg_list_matches) > 0 and "shell=True" not in content

        for i, line in enumerate(lines):
            if any(p in line for p in ["def run(", "def run_cmd(", "#"]) or '"""' in line:
                continue

            if "subprocess.run(" in line and "shell=True" in line:
                context = "\n".join(lines[max(0, i - 2) : min(len(lines), i + 3)])
                if not ("if use_shell:" in context or "use_shell=" in context):
                    unsafe_usage += 1

        return unsafe_usage == 0 and (has_safe_functions or len(arg_list_matches) > 0)
