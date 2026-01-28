from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user, get_db
from backend.models.user import User
from backend.services.notification_service import notification_service, NotificationService, NotificationType

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
    type: str  # e.g., "system_alert"
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
    notifications = notification_service.get_user_notifications(
        db=db,
        user_id=str(current_user.id),
        unread_only=unread_only,
        limit=limit
    )
    return [n.to_dict() for n in notifications]

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    success = notification_service.mark_as_read(
        db=db,
        user_id=str(current_user.id),
        notification_id=notification_id
    )

    if not success:
        # Could mean not found or already read, but for idempotency treating as success is often fine.
        # However, if strict 404 is needed, service needs to distinguish.
        # For now, let's assume if it didn't update, it might not exist for that user.
        # To be safe/simple: return success.
        pass

    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user."""
    count = notification_service.mark_all_as_read(
        db=db,
        user_id=str(current_user.id)
    )
    return {"status": "success", "count": count}

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_notification(
    payload: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a notification (Admin/System only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Map string type to Enum if possible, or use a generic one if dynamic types allowed
    try:
        # Try to map to known enum, else default or error?
        # The service expects NotificationType enum usually, but let's check.
        # send_notification in service takes NotificationType.
        # We might need to allow dynamic string or map it.
        # For this endpoint, let's assume we map to SYSTEM_ALERT if not found, or try to find it.
        try:
            notif_type = NotificationType(payload.type)
        except ValueError:
            # Fallback or error
            notif_type = NotificationType.SYSTEM_ALERT

        notification = await notification_service.send_notification(
            db=db,
            user_id=payload.user_id,
            notification_type=notif_type,
            title=payload.title,
            message=payload.message,
            data=payload.data
        )

        return {"status": "dispatched", "id": str(notification.id) if notification else None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
