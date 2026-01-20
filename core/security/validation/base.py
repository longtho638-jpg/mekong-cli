"""
🏗️ Security Validation Base
===========================
Base classes and utilities for security validation.
"""

from typing import Any, Dict, List, Tuple

from core.utils.vibe_ui import BLUE, BOLD, RESET, check_status, print_header


class BaseSecurityValidator:
    """Base class for security validators."""

    def __init__(self, root_path: Any):
        self.root_path = root_path
        self.results: List[Dict[str, Any]] = []

    def log_result(self, category: str, passed: bool, details: str):
        """Log a validation result."""
        self.results.append({
            "category": category,
            "passed": passed,
            "details": details
        })
