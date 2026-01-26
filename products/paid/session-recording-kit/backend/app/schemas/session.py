from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    api_key: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    user_id: Optional[str] = None
    user_agent: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    project_id: int
    started_at: datetime

    class Config:
        from_attributes = True

class SessionEventCreate(BaseModel):
    events: str # JSON string of events array
    sequence: int = 0
