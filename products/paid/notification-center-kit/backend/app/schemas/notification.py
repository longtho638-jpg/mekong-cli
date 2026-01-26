from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
import bleach

class NotificationBase(BaseModel):
    user_id: str
    type: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    @field_validator('title', 'body')
    @classmethod
    def sanitize_html(cls, v: str) -> str:
        """Sanitize HTML to prevent XSS attacks"""
        if not v:
            return v
        # Allow only safe HTML tags
        allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
        allowed_attrs = {'a': ['href', 'title']}
        return bleach.clean(v, tags=allowed_tags, attributes=allowed_attrs, strip=True)

class NotificationUpdate(BaseModel):
    is_read: bool

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PreferenceBase(BaseModel):
    user_id: str
    type: str
    channel: str
    enabled: bool

class PreferenceCreate(PreferenceBase):
    pass

class Preference(PreferenceBase):
    id: int

    class Config:
        from_attributes = True
