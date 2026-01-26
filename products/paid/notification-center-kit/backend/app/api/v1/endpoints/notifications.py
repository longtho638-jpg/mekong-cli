from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import get_db
from app.models.notification import Notification, NotificationPreference
from app.schemas.notification import Notification as NotificationSchema, NotificationCreate, NotificationUpdate
from app.core.websocket import manager
from app.core.email_utils import render_email_template
from app.core.webhook_client import WebhookClient
from app.core.auth import get_current_user, verify_ws_token, User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

async def process_side_effects(notification: NotificationCreate, notification_id: int):
    """
    Handles side effects like sending emails and webhooks in the background.
    """
    # 1. Email Rendering & "Sending"
    try:
        # Mock getting user email preferences - In a real app, query NotificationPreference
        # For now, we assume if type is 'email_alert', we send email
        if 'email' in notification.type:
            html_content = render_email_template("notification.html", {
                "title": notification.title,
                "body": notification.body,
                "app_name": "Notification Center",
                "action_url": notification.data.get("url") if notification.data else "#",
                "settings_url": "/settings"
            })

            # Log the email content (Simulation)
            logger.info(f"========== EMAIL TO {notification.user_id} ==========")
            logger.info(f"Subject: {notification.title}")
            logger.info(f"Body (HTML length): {len(html_content)}")
            logger.info("==================================================")
    except Exception as e:
        logger.error(f"Failed to process email: {e}")

    # 2. Webhook Delivery
    if notification.data and notification.data.get("webhook_url"):
        webhook_client = WebhookClient()
        try:
            payload = {
                "event": "notification.created",
                "data": {
                    "id": notification_id,
                    "title": notification.title,
                    "user_id": notification.user_id
                }
            }
            await webhook_client.send_webhook(notification.data["webhook_url"], payload)
        except Exception as e:
            logger.error(f"Failed to deliver webhook: {e}")
        finally:
            await webhook_client.close()

@router.post("/send", response_model=NotificationSchema)
async def send_notification(
    notification_in: NotificationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Authorization: Verify current_user has permission to send to notification.user_id
    if not current_user.is_admin and current_user.id != notification_in.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to send notifications to this user")

    # 1. Save to DB (In-App)
    db_notification = Notification(
        user_id=notification_in.user_id,
        type=notification_in.type,
        title=notification_in.title,
        body=notification_in.body,
        data=notification_in.data
    )
    db.add(db_notification)
    await db.commit()
    await db.refresh(db_notification)

    # 2. Broadcast via WebSocket (Real-time)
    message = {
        "id": db_notification.id,
        "type": db_notification.type,
        "title": db_notification.title,
        "body": db_notification.body,
        "created_at": db_notification.created_at.isoformat(),
        "is_read": False,
        "data": db_notification.data
    }
    await manager.send_personal_message(message, notification_in.user_id)

    # 3. Process Side Effects (Email, Webhooks) in Background
    background_tasks.add_task(process_side_effects, notification_in, db_notification.id)

    return db_notification

@router.get("/", response_model=List[NotificationSchema])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Use authenticated user's ID, not from query params
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.is_read == False)

    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{notification_id}/read", response_model=NotificationSchema)
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = update(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).values(is_read=True)

    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Verify JWT token and extract user_id
    try:
        user_id = verify_ws_token(token)
    except HTTPException as e:
        await websocket.close(code=1008, reason=e.detail)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
