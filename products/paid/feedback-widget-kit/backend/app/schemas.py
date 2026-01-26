from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from .models import FeedbackType, FeedbackStatus

class ApiKeyCreate(BaseModel):
    name: str
    allowed_domains: Optional[str] = None # Comma separated

class ApiKeyResponse(BaseModel):
    key: str
    name: str

class FeedbackBase(BaseModel):
    type: FeedbackType = FeedbackType.GENERAL
    content: str
    rating: Optional[int] = None
    metadata_info: Optional[Dict[str, Any]] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    status: FeedbackStatus

class FeedbackResponse(FeedbackBase):
    id: int
    screenshot_url: Optional[str] = None
    status: FeedbackStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
