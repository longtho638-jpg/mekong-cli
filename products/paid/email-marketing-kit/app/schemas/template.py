from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Shared properties
class TemplateBase(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    body_mjml: Optional[str] = None
    variables_schema: Optional[Dict[str, Any]] = None

# Properties to receive on creation
class TemplateCreate(TemplateBase):
    name: str

# Properties to receive on update
class TemplateUpdate(TemplateBase):
    pass

# Properties shared by models stored in DB
class TemplateInDBBase(TemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Properties to return to client
class Template(TemplateInDBBase):
    pass

# For preview response
class TemplatePreview(BaseModel):
    subject: str
    html: str
    text: str
