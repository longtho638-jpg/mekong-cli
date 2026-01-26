from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserPreferencesBase(BaseModel):
    theme: str = "system"
    language: str = "en"
    email_notifications: bool = True
    push_notifications: bool = True
    profile_visibility: str = "public"

class UserPreferencesCreate(UserPreferencesBase):
    user_id: str

class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    profile_visibility: Optional[str] = None

class UserPreferences(UserPreferencesBase):
    id: int
    user_id: str

    model_config = ConfigDict(from_attributes=True)
