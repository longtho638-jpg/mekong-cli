"""
JWT Authentication utilities for Notification Center Kit
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import BaseModel

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "development_secret_key_change_this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class TokenData(BaseModel):
    user_id: str
    exp: datetime

class User(BaseModel):
    id: str
    is_admin: bool = False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(user_id=user_id, exp=datetime.fromtimestamp(payload["exp"]))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Dependency to extract and verify JWT token from Authorization header.
    Returns a User object with user_id from token.
    """
    token = credentials.credentials
    token_data = verify_token(token)

    # In production, fetch user from database
    # For now, return a User object with id from token
    return User(id=token_data.user_id, is_admin=False)

def verify_ws_token(token: str) -> str:
    """
    Verify WebSocket JWT token and return user_id.
    Raises HTTPException if token is invalid.
    """
    token_data = verify_token(token)
    return token_data.user_id
