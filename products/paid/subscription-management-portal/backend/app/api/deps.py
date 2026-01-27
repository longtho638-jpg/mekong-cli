from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from app.core.supabase import get_supabase, Client

# Mock auth dependency for now, or real if we had the full auth kit context
# In a real integration, this would verify the JWT from Supabase Auth
async def get_current_user(
    authorization: Optional[str] = Header(None),
    supabase: Client = Depends(get_supabase)
) -> dict:
    if not authorization:
        # For development/testing purposes if no auth header is present
        # In production this should raise 401
        # return {"id": "test_user_id", "email": "test@example.com"}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication header",
        )

    try:
        # Expecting "Bearer <token>"
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        if not user:
             raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
