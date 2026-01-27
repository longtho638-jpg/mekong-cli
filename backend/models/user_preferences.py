from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, DateTime, func
from backend.db.base import Base

# --- SQLAlchemy Model ---
class UserPreferencesDB(Base):
    __tablename__ = "user_preferences"

    user_id = Column(String(255), primary_key=True, index=True)
    preferred_language = Column(String(10), default="en-US")
    preferred_currency = Column(String(3), default="USD")
    theme = Column(String(20), default="system")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

# --- Pydantic Models ---
class UserPreferences(BaseModel):
    user_id: str = Field(..., description="User ID")
    preferred_language: str = Field(default="en-US", description="Preferred Language Code (e.g. en-US, vi-VN)")
    preferred_currency: str = Field(default="USD", description="Preferred Currency Code (e.g. USD, VND)")
    theme: str = Field(default="system", description="Theme preference (light, dark, system)")
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserPreferencesUpdate(BaseModel):
    preferred_language: Optional[str] = None
    preferred_currency: Optional[str] = None
    theme: Optional[str] = None
