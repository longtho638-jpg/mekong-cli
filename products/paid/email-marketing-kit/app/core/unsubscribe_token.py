import hmac
import hashlib
import base64
from typing import Optional
from app.core.config import get_settings

settings = get_settings()

def generate_unsubscribe_token(subscriber_id: int) -> str:
    """
    Create a signed token for a subscriber ID.
    Format: base64(subscriber_id:signature)
    """
    msg = str(subscriber_id).encode()
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        msg,
        hashlib.sha256
    ).hexdigest()

    token_data = f"{subscriber_id}:{signature}"
    return base64.urlsafe_b64encode(token_data.encode()).decode()

def verify_unsubscribe_token(token: str) -> Optional[int]:
    """
    Verify the unsubscribe token and return the subscriber ID if valid.
    Returns None if invalid.
    """
    try:
        decoded = base64.urlsafe_b64decode(token).decode()
        parts = decoded.split(":")
        if len(parts) != 2:
            return None

        subscriber_id_str, signature = parts
        subscriber_id = int(subscriber_id_str)

        # Re-compute signature
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            str(subscriber_id).encode(),
            hashlib.sha256
        ).hexdigest()

        if hmac.compare_digest(signature, expected_signature):
            return subscriber_id
        return None
    except Exception:
        return None
