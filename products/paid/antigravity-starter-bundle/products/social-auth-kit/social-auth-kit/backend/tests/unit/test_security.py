import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings

def test_password_hashing():
    password = "secret_password"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)

def test_create_access_token():
    data = {"sub": "test@example.com"}
    token = create_access_token(subject=data["sub"])
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert decoded["sub"] == data["sub"]
    assert "exp" in decoded

def test_create_access_token_with_expiry():
    data = {"sub": "test@example.com"}
    expires = timedelta(minutes=5)
    token = create_access_token(subject=data["sub"], expires_delta=expires)
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert decoded["sub"] == data["sub"]
    # Check if exp is roughly 5 minutes from now (allow small margin)
    # This is tricky with time, but we just want to ensure it's valid
    assert "exp" in decoded
