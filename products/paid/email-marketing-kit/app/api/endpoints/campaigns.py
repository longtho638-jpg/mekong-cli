from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.template import EmailTemplate
from app.schemas.campaign import Campaign as CampaignSchema, CampaignCreate
from app.services.dispatcher import dispatcher

router = APIRouter()

@router.post("/{campaign_id}/send", response_model=CampaignSchema)
async def send_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Trigger the sending of a campaign.
    """
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "draft" and campaign.status != "scheduled":
        raise HTTPException(status_code=400, detail="Campaign is already sending or completed")

    # Trigger background dispatch
    # Note: In a real app, we might want to run this asynchronously immediately
    # or ensure the dispatcher method is fast (it just enqueues).
    # Our dispatcher.dispatch_campaign fetches subscribers and enqueues jobs.
    # Depending on list size, this might take time.
    # ideally we enqueue the "dispatch" task itself to the worker.
    # For MVP, we'll run it here (awaiting it) which might block request for large lists.
    # IMPROVEMENT: Enqueue 'dispatch_campaign_task' instead.

    # We will await it for now as it handles the logic of setting status to SENDING
    await dispatcher.dispatch_campaign(campaign_id)

    await db.refresh(campaign)
    return campaign

@router.post("/", response_model=CampaignSchema)
async def create_campaign(
    *,
    db: AsyncSession = Depends(get_db),
    campaign_in: CampaignCreate,
) -> Any:
    """
    Create a new campaign.
    """
    # 1. Fetch template
    template = None
    if campaign_in.template_id:
        template = await db.get(EmailTemplate, campaign_in.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    # 2. Snapshot content
    body_html = template.body_html if template else ""
    body_text = template.body_text if template else ""

    db_obj = Campaign(
        name=campaign_in.name,
        subject=campaign_in.subject,
        template_id=campaign_in.template_id,
        scheduled_at=campaign_in.scheduled_at,
        body_html=body_html,
        body_text=body_text,
        # In a real app, we would store the target lists in a many-to-many
        # or a JSON field to know who to send to when the worker picks it up.
        # For this Kit MVP, let's assume we handle list association later or add a field.
    )

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[CampaignSchema])
async def read_campaigns(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    stmt = select(Campaign).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
