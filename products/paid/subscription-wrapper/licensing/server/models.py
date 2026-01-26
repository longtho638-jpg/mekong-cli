from typing import Optional
from pydantic import BaseModel

class ActivationRequest(BaseModel):
    license_key: str
    machine_fingerprint: str
    tenant_id: str

class ActivationResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    message: Optional[str] = None
    seats_used: int
    seats_total: int
