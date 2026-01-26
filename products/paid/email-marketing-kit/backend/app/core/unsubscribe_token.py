"""
Unsubscribe Token Security Module

Implements HMAC-SHA256 signed tokens for secure unsubscribe links.
Prevents ID enumeration attacks by replacing raw subscriber IDs with signed tokens.

Security Standard: Matches Social Auth Kit's state parameter validation pattern (9/10 score).
"""

import hmac
import hashlib
from typing import Optional
from app.core.config import get_settings


def generate_unsubscribe_token(subscriber_id: int) -> str:
    """
    Generate HMAC-SHA256 signed token for subscriber ID.

    Args:
        subscriber_id: The subscriber's database ID

    Returns:
        Signed token in format: "{subscriber_id}.{signature}"

    Example:
        >>> generate_unsubscribe_token(42)
        "42.a3f8c9d2e1b7f4..."
    """
    settings = get_settings()
    message = str(subscriber_id).encode()
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message,
        hashlib.sha256
    ).hexdigest()
    return f"{subscriber_id}.{signature}"


def verify_unsubscribe_token(token: str) -> Optional[int]:
    """
    Verify HMAC-SHA256 token and extract subscriber ID.

    Args:
        token: Signed token in format "{subscriber_id}.{signature}"

    Returns:
        Subscriber ID if valid, None if invalid or tampered

    Security:
        - Uses constant-time comparison to prevent timing attacks
        - Returns None on any parsing or verification failure

    Example:
        >>> verify_unsubscribe_token("42.a3f8c9d2...")
        42
        >>> verify_unsubscribe_token("42.invalid")
        None
    """
    settings = get_settings()

    try:
        # Parse token components
        subscriber_id_str, provided_signature = token.split(".", 1)
        subscriber_id = int(subscriber_id_str)

        # Generate expected signature
        message = subscriber_id_str.encode()
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            message,
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison to prevent timing attacks
        if hmac.compare_digest(provided_signature, expected_signature):
            return subscriber_id

        return None

    except (ValueError, AttributeError):
        # Invalid token format or signature
        return None
