from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user, get_db
from backend.models.notification import UserNotificationPreferences
from backend.models.user import User

router = APIRouter(prefix="/api/v1/notifications/preferences", tags=["Notifications"])

class PreferencesUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    channels: Optional[Dict] = None

class PreferencesResponse(BaseModel):
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    channels: Dict
    quiet_hours: Dict

@router.get("/", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification preferences."""
    prefs = db.execute(
        select(UserNotificationPreferences).where(UserNotificationPreferences.user_id == current_user.id)
    ).scalar_one_or_none()

    if not prefs:
        # Return defaults
        return {
            "email_enabled": True,
            "sms_enabled": False,
            "push_enabled": True,
            "channels": {
                "system_updates": ["email", "push"],
                "payment_alerts": ["email", "sms", "push"],
                "audit_logs": ["email"]
            },
            "quiet_hours": {
                "enabled": False,
                "start": "22:00",
                "end": "08:00"
            }
        }

    return prefs.to_dict()

@router.put("/", response_model=PreferencesResponse)
async def update_preferences(
    update: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences."""
    prefs = db.execute(
        select(UserNotificationPreferences).where(UserNotificationPreferences.user_id == current_user.id)
    ).scalar_one_or_none()

    if not prefs:
        prefs = UserNotificationPreferences(user_id=current_user.id)
        db.add(prefs)

    if update.email_enabled is not None:
        prefs.email_enabled = update.email_enabled
    if update.sms_enabled is not None:
        prefs.sms_enabled = update.sms_enabled
    if update.push_enabled is not None:
        prefs.push_enabled = update.push_enabled
    if update.quiet_hours_enabled is not None:
        prefs.quiet_hours_enabled = update.quiet_hours_enabled
    if update.quiet_hours_start is not None:
        prefs.quiet_hours_start = update.quiet_hours_start
    if update.quiet_hours_end is not None:
        prefs.quiet_hours_end = update.quiet_hours_end
    if update.channels is not None:
        # Merge or replace logic here - currently replacing
        prefs.channels = update.channels

    db.commit()
    db.refresh(prefs)

    return prefs.to_dict()
