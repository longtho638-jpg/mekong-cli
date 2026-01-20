"""
JWT token generation and validation logic.
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, List

import jwt

# Security configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = secrets.token_urlsafe(32)
    os.environ["JWT_SECRET_KEY"] = JWT_SECRET_KEY

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

class AuthenticationError(Exception):
    """Custom authentication error."""
    pass

def generate_jwt_token(user_id: str, permissions: List[str] = None) -> str:
    """Generate a JWT access token."""
    payload = {
        "user_id": user_id,
        "permissions": permissions or [],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")
