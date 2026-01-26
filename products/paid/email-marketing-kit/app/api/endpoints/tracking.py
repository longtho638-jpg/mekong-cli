from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi.responses import RedirectResponse
import base64

from app.core.database import get_db
from app.models.campaign import Campaign, CampaignEvent
from app.models.subscriber import Subscriber

router = APIRouter()

# 1x1 transparent GIF
PIXEL_GIF_DATA = base64.b64decode(
    b"R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
)

@router.get("/o/{campaign_id}/{subscriber_id}/pixel.gif", include_in_schema=False)
async def track_open(
    campaign_id: int,
    subscriber_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Open tracking pixel.
    """
    # Log event asynchronously (fire and forget ideal, but here we await for simplicity)
    # Check uniqueness if we only want unique opens?
    # Usually we track all opens but aggregate uniques later.

    event = CampaignEvent(
        campaign_id=campaign_id,
        subscriber_id=subscriber_id,
        event_type="open",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(event)

    # Increment counters (atomic update)
    # Note: optimizing this to not lock row every time is better (e.g. redis buffer)
    # but for "Kit" scale this is acceptable for now.
    stmt = (
        update(Campaign)
        .where(Campaign.id == campaign_id)
        .values(open_count=Campaign.open_count + 1)
    )
    await db.execute(stmt)
    await db.commit()

    return Response(content=PIXEL_GIF_DATA, media_type="image/gif")

@router.get("/c/{campaign_id}/{subscriber_id}")
async def track_click(
    campaign_id: int,
    subscriber_id: int,
    url: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Click tracking redirector.
    """
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")

    # Log event
    event = CampaignEvent(
        campaign_id=campaign_id,
        subscriber_id=subscriber_id,
        event_type="click",
        url=url,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(event)

    # Increment counters
    stmt = (
        update(Campaign)
        .where(Campaign.id == campaign_id)
        .values(click_count=Campaign.click_count + 1)
    )
    await db.execute(stmt)
    await db.commit()

    return RedirectResponse(url=url)
