from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field

from .enums import ClientStatus


class User(BaseModel):
    id: str = Field(..., description="User UUID")
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = {}
