"""
🛡️ Data Diet - Output Sanitizer
===============================
Enforces privacy and security by automatically redacting sensitive data
(API keys, passwords, PII) from agent outputs and system logs.
"""

import re
from typing import Any, Dict, List, Union

# Patterns for common sensitive data
SENSITIVE_PATTERNS = {
    "api_key": r"(?i)(api[_-]key|access[_-]token|secret[_-]key|auth[_-]token)['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{16,})['\"]?",
    "password": r"(?i)(password|passwd|pwd)['\"]?\s*[:=]\s*['\"]?([^'\"\s]{4,})['\"]?",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "connection_string": r"(?i)(mongodb\+srv|postgres|mysql|redis):\/\/[^:]+:[^@]+@[^\/\s]+",
}


class DataDietSanitizer:
    """
    Service for sanitizing data outputs.
    """

    def __init__(self, redact_char: str = "*", redact_len: int = 8):
        self.redact_char = redact_char
        self.redact_len = redact_len

    def sanitize(self, data: Any) -> Any:
        """
        Recursively sanitizes dictionaries, lists, or strings.
        """
        if isinstance(data, str):
            return self._sanitize_string(data)
        elif isinstance(data, dict):
            return {k: self.sanitize(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.sanitize(item) for item in data]
        return data

    def _sanitize_string(self, text: str) -> str:
        """Redacts sensitive patterns in a string."""
        sanitized = text
        for label, pattern in SENSITIVE_PATTERNS.items():
            # For complex patterns with groups, we only redact the sensitive group
            if label in ["api_key", "password"]:
                # We use a lambda to redact the second group (the actual secret)
                def redact_match(match):
                    full_match = match.group(0)
                    secret = match.group(2)
                    redacted = self.redact_char * self.redact_len
                    return full_match.replace(secret, redacted)

                sanitized = re.sub(pattern, redact_match, sanitized)
            else:
                # For simpler patterns (like email), we redact the whole thing
                sanitized = re.sub(pattern, "[REDACTED]", sanitized)

        return sanitized


# Global Instance
sanitizer = DataDietSanitizer()


def sanitize_output(data: Any) -> Any:
    """Convenience function for sanitization."""
    return sanitizer.sanitize(data)
