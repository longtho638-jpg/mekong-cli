from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.drip import DripCampaign, DripStep
from app.schemas.drip import DripCampaign as DripSchema, DripCampaignCreate, DripCampaignUpdate

router = APIRouter()

@router.post("/", response_model=DripSchema)
async def create_drip_campaign(
    *,
    db: AsyncSession = Depends(get_db),
    drip_in: DripCampaignCreate,
) -> Any:
    """
    Create a new drip campaign with steps.
    """
    db_obj = DripCampaign(
        name=drip_in.name,
        description=drip_in.description,
        status=drip_in.status,
        trigger_type=drip_in.trigger_type,
        trigger_value=drip_in.trigger_value,
    )

    # Add steps
    for step in drip_in.steps:
        db_step = DripStep(
            step_order=step.step_order,
            action_type=step.action_type,
            delay_seconds=step.delay_seconds,
            template_id=step.template_id,
            subject=step.subject
        )
        db_obj.steps.append(db_step)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    # Eager load steps for response
    stmt = select(DripCampaign).options(selectinload(DripCampaign.steps)).where(DripCampaign.id == db_obj.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/", response_model=List[DripSchema])
async def read_drip_campaigns(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve drip campaigns.
    """
    stmt = select(DripCampaign).options(selectinload(DripCampaign.steps)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{drip_id}", response_model=DripSchema)
async def read_drip_campaign(
    drip_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get a specific drip campaign.
    """
    stmt = select(DripCampaign).options(selectinload(DripCampaign.steps)).where(DripCampaign.id == drip_id)
    result = await db.execute(stmt)
    drip = result.scalar_one_or_none()
    if not drip:
        raise HTTPException(status_code=404, detail="Drip campaign not found")
    return drip

@router.put("/{drip_id}", response_model=DripSchema)
async def update_drip_campaign(
    drip_id: int,
    drip_in: DripCampaignUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a drip campaign.
    """
    stmt = select(DripCampaign).options(selectinload(DripCampaign.steps)).where(DripCampaign.id == drip_id)
    result = await db.execute(stmt)
    drip = result.scalar_one_or_none()
    if not drip:
        raise HTTPException(status_code=404, detail="Drip campaign not found")

    if drip_in.name is not None:
        drip.name = drip_in.name
    if drip_in.description is not None:
        drip.description = drip_in.description
    if drip_in.status is not None:
        drip.status = drip_in.status
    if drip_in.trigger_type is not None:
        drip.trigger_type = drip_in.trigger_type
    if drip_in.trigger_value is not None:
        drip.trigger_value = drip_in.trigger_value

    # If steps provided, replace them (simple implementation)
    # In prod, we might want to update individually to preserve history/enrollments linkage if needed
    if drip_in.steps is not None:
        # Clear existing
        drip.steps = []
        for step in drip_in.steps:
            db_step = DripStep(
                step_order=step.step_order,
                action_type=step.action_type,
                delay_seconds=step.delay_seconds,
                template_id=step.template_id,
                subject=step.subject
            )
            drip.steps.append(db_step)

    db.add(drip)
    await db.commit()
    await db.refresh(drip)
    return drip
