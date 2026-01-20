"""
🔑 API Protection Validation
============================
Validates API access token protection implementation.
"""

from core.utils.vibe_ui import RED, RESET, check_status, print_header

from .base import BaseSecurityValidator


class APIProtectionValidator(BaseSecurityValidator):
    """Validator for API protection fixes."""

    def validate(self) -> bool:
        """Validate API access token protection fixes."""
        print_header("Priority 7: API Access Token Protection")
        all_passed = True

        # Check middleware
        middleware = self.root_path / "core" / "security" / "auth_middleware.py"
        if middleware.exists():
            with open(middleware, "r") as f:
                content = f.read()

            checks = [
                ("def generate_jwt_token", "JWT authentication implemented"),
                ("def check_rate_limit", "Rate limiting implemented"),
                ("def require_auth", "Authentication decorator implemented"),
                ("def add_security_headers", "Security headers implemented"),
                ("def validate_api_key", "API key validation implemented")
            ]
            for pattern, msg in checks:
                status, fmt_msg = check_status(pattern in content, msg, f"Missing {msg.lower()}")
                print(f"   {fmt_msg}")
                all_passed &= status
        else:
            print(f"   {RED}❌ Authentication middleware not found{RESET}")
            all_passed = False

        # Check routers
        router = self.root_path / "backend" / "api" / "routers" / "payments.py"
        if router.exists():
            with open(router, "r") as f:
                content = f.read()
            status, msg = check_status(
                "from core.security.auth_middleware import" in content and "@require_auth" in content,
                "API endpoints protected", "API endpoints lack protection"
            )
            print(f"   {msg}")
            all_passed &= status

        self.log_result("Authentication & Authorization", all_passed, "API protection implementation")
        return all_passed
