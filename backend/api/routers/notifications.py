from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user, get_db
from backend.models.notification import Notification
from backend.models.user import User
from backend.services.notification_orchestrator import (
    NotificationOrchestrator,
    get_notification_orchestrator,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    notification_type: str
    title: str
    message: str
    read: bool
    created_at: Optional[str]
    metadata: Optional[dict]

    class Config:
        from_attributes = True

class SendNotificationRequest(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[dict] = None

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user."""
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.read.is_(False))

    query = query.order_by(Notification.created_at.desc()).limit(limit)
    result = db.execute(query)
    notifications = result.scalars().all()

    return [n.to_dict() for n in notifications]

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    # Validate UUID
    try:
        uuid_id = UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    notification = db.execute(
        select(Notification).where(
            Notification.id == uuid_id,
            Notification.user_id == current_user.id
        )
    ).scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read.is_(False)
    ).update({"read": True})
    db.commit()
    return {"status": "success"}

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_notification(
    payload: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    orchestrator: NotificationOrchestrator = Depends(get_notification_orchestrator)
):
    """
    Send a notification (Admin/System only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    results = await orchestrator.send_notification(
        db=db,
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title,
        message=payload.message,
        data=payload.data
    )

    return {"status": "dispatched", "results": results}

@router.get("/analytics", response_model=dict)
async def get_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification analytics (Admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    from backend.services.notification_analytics import get_notification_analytics_service
    service = get_notification_analytics_service()

    stats = service.get_delivery_stats(db, days)
    trends = service.get_daily_trends(db, 7)

    return {
        "stats": stats,
        "trends": trends
    }
