from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field
from typing_extensions import Literal

ExportFormat = Literal['csv', 'json', 'pdf', 'xlsx']
ExportStatus = Literal['pending', 'processing', 'completed', 'failed', 'expired']

class ExportCreateRequest(BaseModel):
    format: ExportFormat
    resource_type: str = Field(..., description="Type of resource to export (e.g., 'users', 'invoices')")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    columns: Optional[List[str]] = None
    template_id: Optional[UUID] = None

class ExportResponse(BaseModel):
    id: UUID
    user_id: UUID
    format: ExportFormat
    status: ExportStatus
    progress: int
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    error_message: Optional[str] = None

class ExportTemplateCreate(BaseModel):
    name: str
    format: ExportFormat
    resource_type: str
    columns: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    is_shared: bool = False

class ExportTemplateResponse(ExportTemplateCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
