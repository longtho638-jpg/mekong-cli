from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.campaign import CampaignStatus

class CampaignBase(BaseModel):
    name: str
    subject: str
    template_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    list_ids: List[int] # Which lists to send to

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None # Override template
    status: Optional[CampaignStatus] = None
    scheduled_at: Optional[datetime] = None

class CampaignInDBBase(CampaignBase):
    id: int
    status: CampaignStatus
    sent_count: int
    open_count: int
    click_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Campaign(CampaignInDBBase):
    pass
