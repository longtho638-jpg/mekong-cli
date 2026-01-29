from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .utils import TokenData, verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return await verify_token(token, credentials_exception)


async def get_current_active_superuser(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    if current_user.role != "superuser" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user


async def get_current_user_id(current_user: TokenData = Depends(get_current_user)) -> str:
    """Returns the current user's ID (username in this case)."""
    if not current_user.username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return current_user.username
