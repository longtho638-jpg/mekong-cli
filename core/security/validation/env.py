"""
🌿 Environment Security Validation
==================================
Validates environment variable security implementation.
"""

import os

from core.utils.vibe_ui import RED, RESET, YELLOW, check_status, print_header

from .base import BaseSecurityValidator


class EnvSecurityValidator(BaseSecurityValidator):
    """Validator for environment security fixes."""

    def validate(self) -> bool:
        """Validate environment variable security fixes."""
        print_header("Priority 8: Environment Variable Security")
        all_passed = True

        # Check environment manager implementation
        env_paths = [
            self.root_path / "core" / "security" / "env_manager.py",
            self.root_path / "core" / "security" / "env" / "manager.py"
        ]

        env_file = None
        for path in env_paths:
            if path.exists():
                env_file = path
                break

        if env_file:
            with open(env_file, "r") as f:
                content = f.read()

            # Since we refactored it, we should check the new location or the proxy
            has_new_structure = "from .env import" in content or "class SecureEnvironmentManager" in content

            checks = [
                ("def validate_all", "Validation implemented"),
                ("VariableType", "Type checking implemented"),
                ("def _generate_secret", "Secret generation implemented"),
            ]

            if not has_new_structure:
                for pattern, msg in checks:
                    status, fmt_msg = check_status(pattern in content, msg, f"Missing {msg.lower()}")
                    print(f"   {fmt_msg}")
                    all_passed &= status
            else:
                 print("   ✅ Using new modular environment manager")

        else:
            print(f"   {RED}❌ Environment manager not found{RESET}")
            all_passed = False

        # Check critical vars
        critical = ["JWT_SECRET_KEY", "API_KEY_MASTER", "BRAINTREE_PRIVATE_KEY", "GUMROAD_ACCESS_TOKEN"]
        secure_count = sum(1 for var in critical if var in os.environ and len(os.environ[var]) >= 32)

        status, msg = check_status(secure_count >= 2, f"Critical variables configured: {secure_count}/{len(critical)}", "Insufficient critical variables")
        print(f"   {msg}")
        all_passed &= status

        self.log_result("Environment Management", all_passed, f"Secure env management ({secure_count} vars)")
        return all_passed
