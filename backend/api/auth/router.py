from datetime import timedelta
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from .utils import Token, create_access_token, get_password_hash, verify_password

router = APIRouter(tags=["auth"])

# Lazy initialization to avoid passlib bcrypt backend init at import time
_fake_users_db: Optional[Dict[str, Dict[str, str]]] = None


def get_fake_users_db() -> Dict[str, Dict[str, str]]:
    """Lazily initialize the fake users database."""
    global _fake_users_db
    if _fake_users_db is None:
        _fake_users_db = {
            "admin": {
                "username": "admin",
                "hashed_password": get_password_hash("secret"),
                "role": "admin",
            },
            "user": {
                "username": "user",
                "hashed_password": get_password_hash("password"),
                "role": "user",
            },
        }
    return _fake_users_db


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_fake_users_db().get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
