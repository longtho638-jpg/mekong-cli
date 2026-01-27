from pydantic import BaseModel
from typing import Optional
from .enums import ProjectStatus

class Project(BaseModel):
    id: str
    name: str
    description: str
    client_id: Optional[str] = None
    status: ProjectStatus
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    type: Optional[str] = None
