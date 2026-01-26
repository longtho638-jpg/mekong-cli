from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class ExceptionFrame(BaseModel):
    filename: str
    lineno: int
    colno: Optional[int] = None
    function: Optional[str] = None
    in_app: bool = False

class ExceptionData(BaseModel):
    type: str
    value: str
    stacktrace: Optional[List[ExceptionFrame]] = None

class Breadcrumb(BaseModel):
    category: str
    message: Optional[str] = None
    level: Optional[str] = None
    timestamp: Optional[float] = None
    data: Optional[Dict[str, Any]] = None

class RequestContext(BaseModel):
    url: Optional[str] = None
    method: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    user_agent: Optional[str] = None

class UserContext(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None

class EventPayload(BaseModel):
    exception: ExceptionData
    breadcrumbs: List[Breadcrumb] = []
    request: Optional[RequestContext] = None
    user: Optional[UserContext] = None
    tags: Dict[str, str] = {}
    environment: str = "production"
    release: Optional[str] = None
    sdk: Optional[Dict[str, str]] = None

    # DSN usually comes in headers, but payload might have project_id if we want
    # For now, we'll rely on the DSN in the query param or header
