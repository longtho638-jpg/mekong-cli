from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class IssueStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    IGNORED = "ignored"

class IssueBase(BaseModel):
    title: str
    fingerprint: str
    status: IssueStatus
    count: int

class IssueResponse(IssueBase):
    id: int
    project_id: int
    first_seen: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

class EventFrame(BaseModel):
    filename: str
    lineno: int
    colno: Optional[int] = None
    function: Optional[str] = None
    in_app: bool = False

class EventContext(BaseModel):
    request: Optional[dict] = None
    user: Optional[dict] = None
    tags: Optional[dict] = None
    breadcrumbs: Optional[List[dict]] = None

class EventResponse(BaseModel):
    id: int
    issue_id: int
    message: str
    stack_trace: Optional[List[EventFrame]] = None
    context: Optional[EventContext] = None
    timestamp: datetime

    class Config:
        from_attributes = True
