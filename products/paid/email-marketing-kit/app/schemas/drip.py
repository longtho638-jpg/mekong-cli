from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.drip import DripStatus, DripTriggerType, DripActionType, EnrollmentStatus

# --- Drip Step Schemas ---

class DripStepBase(BaseModel):
    step_order: int
    action_type: DripActionType
    delay_seconds: Optional[int] = 0
    template_id: Optional[int] = None
    subject: Optional[str] = None

class DripStepCreate(DripStepBase):
    pass

class DripStepUpdate(DripStepBase):
    step_order: Optional[int] = None
    action_type: Optional[DripActionType] = None

class DripStepInDBBase(DripStepBase):
    id: int
    drip_campaign_id: int
    model_config = ConfigDict(from_attributes=True)

class DripStep(DripStepInDBBase):
    pass

# --- Drip Campaign Schemas ---

class DripCampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[DripStatus] = DripStatus.ACTIVE
    trigger_type: Optional[DripTriggerType] = DripTriggerType.SIGNUP
    trigger_value: Optional[str] = None

class DripCampaignCreate(DripCampaignBase):
    steps: List[DripStepCreate] = []

class DripCampaignUpdate(DripCampaignBase):
    name: Optional[str] = None
    steps: Optional[List[DripStepCreate]] = None # Full replacement of steps for simplicity

class DripCampaignInDBBase(DripCampaignBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DripCampaign(DripCampaignInDBBase):
    steps: List[DripStep] = []

# --- Enrollment Schemas ---

class DripEnrollmentBase(BaseModel):
    drip_campaign_id: int
    subscriber_id: int

class DripEnrollmentCreate(DripEnrollmentBase):
    pass

class DripEnrollmentInDBBase(DripEnrollmentBase):
    id: int
    status: EnrollmentStatus
    current_step_id: Optional[int] = None
    next_run_at: datetime
    created_at: datetime
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class DripEnrollment(DripEnrollmentInDBBase):
    pass
