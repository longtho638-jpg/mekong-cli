"""
API key validation logic.
"""
import os


def validate_api_key(api_key: str) -> bool:
    """Validate API key against environment variables."""
    valid_keys = [
        os.getenv("API_KEY_MASTER"),
        os.getenv("API_KEY_READ_ONLY"),
        os.getenv("API_KEY_WRITE_ACCESS"),
    ]
    return api_key in valid_keys and api_key is not None
