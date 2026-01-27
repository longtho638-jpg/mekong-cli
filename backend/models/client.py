from pydantic import BaseModel
from typing import Optional
from .enums import ClientStatus

class Client(BaseModel):
    id: str
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    mrr: float
    total_ltv: float
    active_projects: int
    status: ClientStatus
    zalo: Optional[str] = None  # Vietnam-specific
