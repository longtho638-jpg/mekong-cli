"""
Input Validation and Sanitization Utilities
============================================

Security-focused validators for user input.
Prevents XSS, SQL injection, and DoS attacks.

Binh Pháp: "Thủ Công" - Defense First
"""

import re
from typing import Any, Dict, Optional


def sanitize_html(text: str) -> str:
    """
    Remove HTML tags from user input to prevent XSS attacks.

    Args:
        text: User input string

    Returns:
        Sanitized string without HTML tags

    Examples:
        >>> sanitize_html("<script>alert('xss')</script>Hello")
        'alert('xss')Hello'
        >>> sanitize_html("Normal text")
        'Normal text'
    """
    # Remove HTML tags
    clean = re.sub(r"<[^>]*>", "", text)
    return clean.strip()


def sanitize_sql(text: str) -> str:
    """
    Basic SQL injection prevention.

    Removes common SQL keywords and dangerous patterns.
    Note: This is NOT a replacement for parameterized queries!
    Always use ORMs or parameterized queries as primary defense.

    Args:
        text: User input string

    Returns:
        String with SQL patterns removed
    """
    # Remove SQL keywords (case-insensitive)
    dangerous_patterns = [
        r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b",
        r"(--|;|\/\*|\*\/)",  # SQL comments and terminators
        r"\bUNION\b.*\bSELECT\b",  # UNION injection
        r"\bOR\b.*=.*",  # OR-based injection
    ]

    clean = text
    for pattern in dangerous_patterns:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE)

    return clean.strip()


def validate_json_depth(data: Any, max_depth: int = 10) -> bool:
    """
    Prevent deeply nested JSON (DoS protection).

    Deeply nested JSON can cause stack overflow or excessive processing.

    Args:
        data: JSON data (dict, list, or primitive)
        max_depth: Maximum allowed nesting depth

    Returns:
        True if depth is within limits, False otherwise

    Examples:
        >>> validate_json_depth({"a": {"b": {"c": 1}}}, max_depth=3)
        True
        >>> validate_json_depth({"a": {"b": {"c": {"d": 1}}}}, max_depth=3)
        False
    """
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
    """
    Validate string length to prevent DoS.

    Args:
        text: String to validate
        max_length: Maximum allowed length

    Returns:
        True if within limits
    """
    return len(text) <= max_length


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for filesystem

    Examples:
        >>> sanitize_filename("../../etc/passwd")
        'etc_passwd'
        >>> sanitize_filename("my file (1).txt")
        'my_file_1_.txt'
    """
    # Remove directory separators
    clean = filename.replace("/", "_").replace("\\", "_")

    # Remove parent directory references
    clean = clean.replace("..", "_")

    # Remove special characters, keep alphanumeric, dots, dashes, underscores
    clean = re.sub(r"[^\w\s\-.]", "_", clean)

    # Remove leading/trailing whitespace and dots
    clean = clean.strip(". ")

    return clean


def validate_email(email: str) -> bool:
    """
    Basic email validation.

    Args:
        email: Email address to validate

    Returns:
        True if valid format
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_url(url: str, allowed_schemes: Optional[list] = None) -> bool:
    """
    Validate URL format and scheme.

    Args:
        url: URL to validate
        allowed_schemes: List of allowed schemes (default: ["http", "https"])

    Returns:
        True if valid URL with allowed scheme
    """
    if allowed_schemes is None:
        allowed_schemes = ["http", "https"]

    # Basic URL pattern
    pattern = r"^(https?|ftp)://[^\s/$.?#].[^\s]*$"
    if not re.match(pattern, url):
        return False

    # Check scheme
    scheme = url.split("://")[0].lower()
    return scheme in allowed_schemes


def sanitize_user_input(text: str, preserve_newlines: bool = False) -> str:
    """
    General-purpose input sanitization.

    Combines HTML and SQL sanitization with whitespace normalization.

    Args:
        text: User input
        preserve_newlines: Keep newline characters

    Returns:
        Sanitized text
    """
    # Remove HTML
    clean = sanitize_html(text)

    # Remove SQL patterns
    clean = sanitize_sql(clean)

    # Normalize whitespace
    if preserve_newlines:
        # Replace multiple spaces with single space, keep newlines
        clean = re.sub(r" +", " ", clean)
    else:
        # Replace all whitespace with single space
        clean = re.sub(r"\s+", " ", clean)

    return clean.strip()
