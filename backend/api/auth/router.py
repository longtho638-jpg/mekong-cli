from datetime import timedelta
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from .utils import Token, create_access_token, get_password_hash, verify_password

router = APIRouter(tags=["auth"])

# Mock User Database
fake_users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("secret"),
        "role": "admin"
    },
    "user": {
        "username": "user",
        "hashed_password": get_password_hash("password"),
        "role": "user"
    }
}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)
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
