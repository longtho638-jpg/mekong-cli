"""
Security-focused validation and sanitization logic.
"""
import re
from typing import Any, Optional


def sanitize_html(text: str) -> str:
    """Remove HTML tags from user input to prevent XSS attacks."""
    clean = re.sub(r"<[^>]*>", "", text)
    return clean.strip()


def sanitize_sql(text: str) -> str:
    """Basic SQL injection prevention patterns."""
    dangerous_patterns = [
        r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b",
        r"(--|;|\/\*|\*\/)",
        r"\bUNION\b.*\bSELECT\b",
        r"\bOR\b.*=.*",
    ]
    clean = text
    for pattern in dangerous_patterns:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE)
    return clean.strip()


def validate_json_depth(data: Any, max_depth: int = 10) -> bool:
    """Prevent deeply nested JSON (DoS protection)."""
    def _depth(obj: Any, current_depth: int = 0) -> bool:
        if current_depth > max_depth:
            return False
        if isinstance(obj, dict):
            return all(_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            return all(_depth(item, current_depth + 1) for item in obj)
        return True
    return _depth(data)


def validate_string_length(text: str, max_length: int = 10_000) -> bool:
    """Validate string length to prevent DoS."""
    return len(text) <= max_length


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    clean = filename.replace("/", "_").replace("\\", "_")
    clean = clean.replace("..", "_")
    clean = re.sub(r"[^\w\s\-.]", "_", clean)
    clean = clean.strip(". ")
    return clean


def validate_url(url: str, allowed_schemes: Optional[list] = None) -> bool:
    """Validate URL format and scheme."""
    if allowed_schemes is None:
        allowed_schemes = ["http", "https"]
    pattern = r"^(https?|ftp)://[^\s/$.?#].[^\s]*$"
    if not re.match(pattern, url):
        return False
    scheme = url.split("://")[0].lower()
    return scheme in allowed_schemes


def sanitize_user_input(text: str, preserve_newlines: bool = False) -> str:
    """General-purpose input sanitization."""
    clean = sanitize_html(text)
    clean = sanitize_sql(clean)
    if preserve_newlines:
        clean = re.sub(r" +", " ", clean)
    else:
        clean = re.sub(r"\s+", " ", clean)
    return clean.strip()
