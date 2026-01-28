from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PromptBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    content: str
    input_variables: Optional[List[str]] = []
    is_active: Optional[bool] = True

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    input_variables: Optional[List[str]] = None
    is_active: Optional[bool] = None

class PromptResponse(PromptBase):
    id: int
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
