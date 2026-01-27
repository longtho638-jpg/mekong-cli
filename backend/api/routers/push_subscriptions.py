from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user, get_db
from backend.models.notification import PushSubscription
from backend.models.user import User

router = APIRouter(prefix="/notifications/push", tags=["Notifications"])

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
    user_agent: Optional[str] = None

@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(
    sub_data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new push subscription."""
    # Check if already exists
    existing = db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == sub_data.endpoint)
    ).scalar_one_or_none()

    if existing:
        # Update user if changed (unlikely but possible)
        if existing.user_id != current_user.id:
            existing.user_id = current_user.id
            db.commit()
        return {"status": "updated"}

    new_sub = PushSubscription(
        user_id=current_user.id,
        endpoint=sub_data.endpoint,
        p256dh=sub_data.p256dh,
        auth=sub_data.auth,
        user_agent=sub_data.user_agent
    )
    db.add(new_sub)
    db.commit()

    return {"status": "subscribed"}

class UnsubscribeRequest(BaseModel):
    endpoint: str

@router.post("/unsubscribe", status_code=status.HTTP_200_OK)
async def unsubscribe(
    payload: UnsubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe a specific device."""
    sub = db.execute(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint,
            PushSubscription.user_id == current_user.id
        )
    ).scalar_one_or_none()

    if sub:
        db.delete(sub)
        db.commit()
        return {"status": "unsubscribed"}

    raise HTTPException(status_code=404, detail="Subscription not found")
