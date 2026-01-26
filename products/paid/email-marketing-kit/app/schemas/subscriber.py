from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.subscriber import SubscriberStatus

# --- Mailing List Schemas ---

class MailingListBase(BaseModel):
    name: str
    description: Optional[str] = None

class MailingListCreate(MailingListBase):
    pass

class MailingListUpdate(MailingListBase):
    name: Optional[str] = None

class MailingListInDBBase(MailingListBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MailingList(MailingListInDBBase):
    pass

# --- Subscriber Schemas ---

class SubscriberBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: Optional[SubscriberStatus] = SubscriberStatus.UNCONFIRMED
    attributes: Optional[Dict[str, Any]] = None

class SubscriberCreate(SubscriberBase):
    list_ids: Optional[List[int]] = []

class SubscriberUpdate(SubscriberBase):
    email: Optional[EmailStr] = None
    list_ids: Optional[List[int]] = None # To update lists

class SubscriberInDBBase(SubscriberBase):
    id: int
    ip_address: Optional[str] = None
    opt_in_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Subscriber(SubscriberInDBBase):
    lists: List[MailingList] = []
